<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class N8NController extends Controller
{
    public function citasManana(): JsonResponse
    {
        $manana = now()->addDay()->toDateString();

        $citas = Cita::with(['paciente.user', 'tratamiento', 'consultorio'])
            ->whereDate('fecha', $manana)
            ->whereIn('estado', ['pendiente', 'confirmada'])
            ->get()
            ->map(fn($c) => [
                'id'          => $c->id,
                'nombre'      => $c->paciente->user->name,
                'telefono'    => '52' . preg_replace('/[^0-9]/', '', $c->paciente->user->telefono ?? ''),
                'fecha'       => $c->fecha->format('d/m/Y'),
                'hora'        => $c->hora_inicio,
                'tratamiento' => $c->tratamiento->nombre,
                'consultorio' => $c->consultorio->nombre,
            ]);

        return response()->json($citas);
    }

    public function confirmarPorWhatsapp(Request $request): JsonResponse
    {
        $telefono = preg_replace('/[^0-9]/', '', $request->input('telefono', ''));

        $user = User::where('telefono', 'LIKE', "%{$telefono}%")->first();
        if (!$user) return response()->json(['ok' => false, 'msg' => 'Usuario no encontrado'], 404);

        $cita = Cita::where('paciente_id', $user->paciente?->id)
            ->where('estado', 'pendiente')
            ->whereDate('fecha', '>=', now()->toDateString())
            ->orderBy('fecha')
            ->first();

        if (!$cita) return response()->json(['ok' => false, 'msg' => 'No hay citas pendientes'], 404);

        $cita->update(['estado' => 'confirmada']);
        return response()->json(['ok' => true, 'cita_id' => $cita->id]);
    }

    public function cancelarPorWhatsapp(Request $request): JsonResponse
    {
        $telefono = preg_replace('/[^0-9]/', '', $request->input('telefono', ''));

        $user = User::where('telefono', 'LIKE', "%{$telefono}%")->first();
        if (!$user) return response()->json(['ok' => false, 'msg' => 'Usuario no encontrado'], 404);

        $cita = Cita::where('paciente_id', $user->paciente?->id)
            ->whereIn('estado', ['pendiente', 'confirmada'])
            ->whereDate('fecha', '>=', now()->toDateString())
            ->orderBy('fecha')
            ->first();

        if (!$cita) return response()->json(['ok' => false, 'msg' => 'No hay citas activas'], 404);

        $cita->cancelar();
        return response()->json(['ok' => true, 'cita_id' => $cita->id]);
    }

    public function webhookVerificacion(Request $request): mixed
    {
        $mode      = $request->query('hub_mode');
        $token     = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode === 'subscribe' && $token === config('services.whatsapp.verify_token')) {
            return response($challenge, 200);
        }
        return response('Forbidden', 403);
    }

    public function webhookIncoming(Request $request): mixed
    {
        $payload = $request->json()->all();

        if (($payload['object'] ?? '') !== 'whatsapp_business_account') {
            return response('', 200);
        }

        $messages = data_get($payload, 'entry.0.changes.0.value.messages');
        if (!$messages || !is_array($messages)) {
            return response('', 200);
        }

        foreach ($messages as $msg) {
            if (($msg['type'] ?? '') !== 'text') continue;

            $from = $msg['from'] ?? '';
            $body = strtoupper(trim($msg['text']['body'] ?? ''));

            if ($body === 'SI') {
                $this->procesarRespuestaWA($from, 'confirmar');
            } elseif ($body === 'CANCELAR') {
                $this->procesarRespuestaWA($from, 'cancelar');
            } else {
                $this->enviarWhatsApp($from, 'No entendí tu respuesta. Contesta SI para confirmar tu cita o CANCELAR si no puedes asistir.');
            }
        }

        return response('', 200);
    }

    private function procesarRespuestaWA(string $telefono, string $accion): void
    {
        $limpio = preg_replace('/[^0-9]/', '', $telefono);
        $user   = User::where('telefono', 'LIKE', "%{$limpio}%")->first();

        if (!$user) {
            $this->enviarWhatsApp($telefono, 'No encontramos tu cita. Contacta a OpsDental directamente.');
            return;
        }

        $query = Cita::where('paciente_id', $user->paciente?->id)
            ->whereDate('fecha', '>=', now()->toDateString())
            ->orderBy('fecha');

        if ($accion === 'confirmar') {
            $cita = (clone $query)->where('estado', 'pendiente')->first();
            if ($cita) {
                $cita->update(['estado' => 'confirmada']);
                $this->enviarWhatsApp($telefono, '¡Tu cita quedó confirmada! Te esperamos en OpsDental.');
            } else {
                $this->enviarWhatsApp($telefono, 'No encontramos citas pendientes de confirmar.');
            }
        } else {
            $cita = (clone $query)->whereIn('estado', ['pendiente', 'confirmada'])->first();
            if ($cita) {
                $cita->cancelar();
                $this->enviarWhatsApp($telefono, 'Cita cancelada. Puedes agendar otra cuando gustes en OpsDental.');
            } else {
                $this->enviarWhatsApp($telefono, 'No encontramos citas activas para cancelar.');
            }
        }
    }

    private function enviarWhatsApp(string $to, string $mensaje): void
    {
        $phoneId = config('services.whatsapp.phone_number_id');
        $token   = config('services.whatsapp.token');

        Http::withToken($token)
            ->post("https://graph.facebook.com/v19.0/{$phoneId}/messages", [
                'messaging_product' => 'whatsapp',
                'to'                => $to,
                'type'              => 'text',
                'text'              => ['body' => $mensaje],
            ]);
    }
}
