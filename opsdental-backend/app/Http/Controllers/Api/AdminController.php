<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultorio;
use App\Models\Membrecia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    public function consultorios(): JsonResponse
    {
        $lista = Consultorio::with(['user', 'membrecia'])->get();
        return response()->json($lista);
    }

    public function showConsultorio(int $id): JsonResponse
    {
        $consultorio = Consultorio::with(['user', 'membrecia', 'tratamientos', 'citas'])->findOrFail($id);
        return response()->json($consultorio);
    }

    public function activarConsultorio(int $id): JsonResponse
    {
        $consultorio = Consultorio::with('user')->findOrFail($id);
        $consultorio->update(['activo' => true]);
        $consultorio->membrecia?->update(['activa' => true]);

        $token = Str::random(48);
        $consultorio->user->update([
            'token_invitacion'            => $token,
            'token_invitacion_expires_at' => now()->addHours(48),
        ]);

        $this->notificarActivacion($consultorio->user->telefono ?? '', $consultorio->user->name, $token);

        return response()->json(['message' => 'Consultorio activado. Se ha enviado la notificación por WhatsApp.']);
    }

    public function bloquearConsultorio(int $id): JsonResponse
    {
        $consultorio = Consultorio::findOrFail($id);
        $consultorio->update(['activo' => false]);
        $consultorio->membrecia?->update(['activa' => false]);
        return response()->json(['message' => 'Consultorio bloqueado.']);
    }

    public function editarMembrecia(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'plan'              => 'required|in:gratuito,basico,premium,pro',
            'fecha_inicio'      => 'required|date',
            'fecha_vencimiento' => 'required|date|after:fecha_inicio',
        ]);

        $limites = [
            'gratuito' => 10,
            'basico'   => 20,
            'premium'  => 50,
            'pro'      => 999,
        ];

        $data['limite_citas_mes'] = $limites[$data['plan']];

        $consultorio = Consultorio::findOrFail($id);

        if ($consultorio->membrecia) {
            $consultorio->membrecia->update($data);
        } else {
            $data['consultorio_id'] = $id;
            $data['activa'] = true;
            Membrecia::create($data);
        }

        return response()->json(['message' => 'Membresía actualizada correctamente.']);
    }

    private function notificarActivacion(string $telefono, string $nombre, string $token): void
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $enlace      = "{$frontendUrl}/acceso/{$token}";

        Log::info('WhatsApp activación consultorio → ' . $telefono, [
            'nombre'  => $nombre,
            'mensaje' => "Hola {$nombre}, tu consultorio en OpsDental ha sido activado. Ingresa aquí: {$enlace} (enlace válido 48 horas)",
        ]);
        // Integrar con Meta WhatsApp Cloud API — Fase N8N
    }
}
