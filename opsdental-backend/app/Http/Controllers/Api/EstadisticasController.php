<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\Paciente;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EstadisticasController extends Controller
{
    public function estadisticas(Request $request): JsonResponse
    {
        $id = $request->user()->consultorio->id;

        $topTratamientos = DB::table('citas')
            ->join('tratamientos', 'citas.tratamiento_id', '=', 'tratamientos.id')
            ->where('citas.consultorio_id', $id)
            ->whereIn('citas.estado', ['confirmada', 'completada'])
            ->groupBy('tratamientos.id', 'tratamientos.nombre')
            ->orderByDesc('total')
            ->limit(5)
            ->select('tratamientos.nombre', DB::raw('count(*) as total'))
            ->get();

        $citasMes = Cita::where('consultorio_id', $id)
            ->whereYear('fecha', now()->year)->whereMonth('fecha', now()->month)
            ->whereIn('estado', ['pendiente', 'confirmada', 'completada'])
            ->count();

        $totalGeneral    = Cita::where('consultorio_id', $id)->whereIn('estado', ['confirmada', 'completada'])->count();
        $pacientesUnicos = Cita::where('consultorio_id', $id)->whereIn('estado', ['confirmada', 'completada'])->distinct('paciente_id')->count('paciente_id');
        $promedio        = Cita::where('consultorio_id', $id)->whereNotNull('calificacion')->avg('calificacion');

        return response()->json([
            'top_tratamientos'      => $topTratamientos,
            'citas_mes'             => $citasMes,
            'total_general'         => $totalGeneral,
            'pacientes_unicos'      => $pacientesUnicos,
            'calificacion_promedio' => round($promedio ?? 0, 1),
        ]);
    }

    public function pacientes(Request $request): JsonResponse
    {
        $id = $request->user()->consultorio->id;

        $lista = DB::table('citas')
            ->join('pacientes', 'citas.paciente_id', '=', 'pacientes.id')
            ->join('users', 'pacientes.user_id', '=', 'users.id')
            ->where('citas.consultorio_id', $id)
            ->groupBy('pacientes.id', 'users.name', 'users.email', 'users.telefono')
            ->select(
                'pacientes.id',
                'users.name',
                'users.email',
                'users.telefono',
                DB::raw('count(*) as total_citas'),
                DB::raw('max(citas.fecha) as ultima_visita')
            )
            ->orderByDesc('ultima_visita')
            ->get();

        return response()->json($lista);
    }

    public function invitar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'telefono' => 'nullable|string|max:20',
        ]);

        $consultorioId = $request->user()->consultorio->id;
        $token = Str::random(40);

        $user = DB::transaction(function () use ($data, $consultorioId, $token) {
            $user = User::create([
                'name'                        => $data['name'],
                'email'                       => $data['email'],
                'password'                    => Hash::make(Str::random(16)),
                'role'                        => 'paciente',
                'telefono'                    => $data['telefono'] ?? null,
                'token_invitacion'            => $token,
                'token_invitacion_expires_at' => now()->addDays(7),
            ]);

            Paciente::create([
                'user_id'        => $user->id,
                'consultorio_id' => $consultorioId,
            ]);

            return $user;
        });

        $link = (config('app.frontend_url') ?: 'http://localhost:3000') . '/acceso/' . $token;

        return response()->json([
            'mensaje'     => 'Paciente registrado. Comparte el enlace para que acceda a la plataforma.',
            'link_acceso' => $link,
            'paciente'    => [
                'id'       => $user->paciente->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'telefono' => $user->telefono,
            ],
        ], 201);
    }

    public function historialPaciente(Request $request, int $pacienteId): JsonResponse
    {
        $id = $request->user()->consultorio->id;

        $citas = Cita::where('consultorio_id', $id)
            ->where('paciente_id', $pacienteId)
            ->with(['tratamiento', 'paciente.user'])
            ->orderBy('fecha', 'desc')
            ->get();

        abort_if($citas->isEmpty(), 404);

        return response()->json([
            'paciente' => $citas->first()->paciente->user->only(['name', 'email', 'telefono']),
            'citas'    => $citas,
        ]);
    }
}
