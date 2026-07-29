<?php

namespace App\Http\Controllers\Api;

use App\Events\CitaCancelada;
use App\Events\NuevaCitaRegistrada;
use App\Http\Controllers\Controller;
use App\Models\Consultorio;
use App\Repositories\CitaRepository;
use App\Repositories\TratamientoRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CitaController extends Controller
{
    public function __construct(
        private CitaRepository $citas,
        private TratamientoRepository $tratamientos
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $lista = match ($user->role) {
            'paciente'    => $this->citas->porPaciente($user->paciente->id),
            'consultorio' => $this->citas->porConsultorioFecha(
                $user->consultorio->id,
                $request->query('fecha', now()->toDateString()),
                ['pendiente', 'confirmada', 'completada']
            ),
            default => collect(),
        };

        return response()->json($lista);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'consultorio_id' => 'required|exists:consultorios,id',
            'tratamiento_id' => 'required|exists:tratamientos,id',
            'fecha'          => 'required|date|after_or_equal:today',
            'hora_inicio'    => 'required|date_format:H:i',
            'notas'          => 'nullable|string|max:500',
        ]);

        // Verificar que el consultorio está activo y verificado
        $consultorio = Consultorio::with('membrecia')->findOrFail((int) $data['consultorio_id']);

        if (!$consultorio->activo) {
            return response()->json([
                'message' => 'Este consultorio no está disponible actualmente.',
            ], 422);
        }

        $membrecia = $consultorio->membrecia;
        if (!$membrecia || !$membrecia->vigente()) {
            return response()->json([
                'message' => 'Este consultorio no puede recibir citas en este momento (membresía inactiva).',
            ], 422);
        }

        if ($membrecia->limite_citas_mes < 9999) {
            $fechaCita = \Carbon\Carbon::parse($data['fecha']);
            $citasMes  = $this->citas->contarMes(
                (int) $data['consultorio_id'],
                $fechaCita->year,
                $fechaCita->month
            );
            if ($citasMes >= $membrecia->limite_citas_mes) {
                return response()->json([
                    'message' => 'Este consultorio ha alcanzado el límite de citas de su plan para este mes.',
                ], 422);
            }
        }

        // Verificar que el tratamiento pertenece al consultorio y está activo
        $tratamiento = $this->tratamientos->find((int) $data['tratamiento_id']);
        if (!$tratamiento || $tratamiento->consultorio_id !== $consultorio->id || !$tratamiento->activo) {
            return response()->json([
                'message' => 'El tratamiento seleccionado no está disponible.',
            ], 422);
        }

        $horaFin    = \Carbon\Carbon::parse($data['hora_inicio'])
                        ->addMinutes($tratamiento->duracion_minutos)
                        ->format('H:i');
        $paciente   = $request->user()->paciente;
        $pacienteId = $paciente->id;

        // El paciente solo puede agendar con su consultorio asignado
        if ($paciente->consultorio_id && $paciente->consultorio_id !== $consultorio->id) {
            return response()->json([
                'message' => 'Solo puedes agendar citas con tu consultorio asignado.',
            ], 403);
        }

        $cita = DB::transaction(function () use ($data, $horaFin, $pacienteId) {
            if ($this->citas->hayConflicto($data['consultorio_id'], $data['fecha'], $data['hora_inicio'], $horaFin)) {
                return null;
            }
            return $this->citas->create([
                ...$data,
                'paciente_id' => $pacienteId,
                'hora_fin'    => $horaFin,
                'estado'      => 'pendiente',
            ]);
        });

        if (!$cita) {
            return response()->json(['message' => 'El horario ya está ocupado. Elige otro disponible.'], 422);
        }

        $this->limpiarCache($consultorio->id, $data['tratamiento_id'], $data['fecha']);
        event(new NuevaCitaRegistrada($cita));

        return response()->json($cita->load(['paciente.user', 'consultorio', 'tratamiento']), 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $pacienteId = $request->user()->paciente->id;
        $cita       = $this->citas->find($id, ['paciente.user', 'consultorio', 'tratamiento']);

        abort_unless($cita && $cita->paciente_id === $pacienteId, 404);
        return response()->json($cita);
    }

    public function cancelar(Request $request, int $id): JsonResponse
    {
        $pacienteId = $request->user()->paciente->id;
        $cita       = $this->citas->find($id);

        abort_unless($cita && $cita->paciente_id === $pacienteId, 404);

        if ($cita->estado === 'cancelada') {
            return response()->json(['message' => 'La cita ya estaba cancelada.'], 422);
        }

        if ($cita->estado === 'completada') {
            return response()->json(['message' => 'No se puede cancelar una cita ya completada.'], 422);
        }

        $cita->cancelar();
        $this->limpiarCache($cita->consultorio_id, $cita->tratamiento_id, $cita->fecha->toDateString());
        event(new CitaCancelada($cita));

        return response()->json(['message' => 'Cita cancelada correctamente.']);
    }

    public function cancelarPorConsultorio(Request $request, int $id): JsonResponse
    {
        $consultorioId = $request->user()->consultorio->id;
        $cita          = $this->citas->find($id);

        abort_unless($cita && $cita->consultorio_id === $consultorioId, 404);

        if (!in_array($cita->estado, ['pendiente', 'confirmada'])) {
            return response()->json(['message' => 'Solo se pueden cancelar citas pendientes o confirmadas.'], 422);
        }

        $cita->cancelar();
        $this->limpiarCache($cita->consultorio_id, $cita->tratamiento_id, $cita->fecha->toDateString());
        event(new CitaCancelada($cita));

        return response()->json(['message' => 'Cita cancelada.']);
    }

    public function actualizarEstado(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'estado' => 'required|in:confirmada,completada',
        ]);

        $consultorioId = $request->user()->consultorio->id;
        $cita          = $this->citas->find($id, ['paciente.user', 'consultorio', 'tratamiento']);

        abort_unless($cita && $cita->consultorio_id === $consultorioId, 404);

        $transiciones = ['pendiente' => 'confirmada', 'confirmada' => 'completada'];
        if (($transiciones[$cita->estado] ?? null) !== $data['estado']) {
            return response()->json(['message' => 'Transición de estado no permitida.'], 422);
        }

        $cita->update(['estado' => $data['estado']]);

        // Observer: al confirmar, notifica al paciente que su cita fue aceptada
        if ($data['estado'] === 'confirmada') {
            event(new NuevaCitaRegistrada($cita));
        }

        return response()->json($cita->fresh(['paciente.user', 'consultorio', 'tratamiento']));
    }

    public function calificar(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'calificacion'            => 'required|integer|min:1|max:5',
            'comentario_calificacion' => 'nullable|string|max:500',
        ]);

        $pacienteId = $request->user()->paciente->id;
        $cita       = $this->citas->find($id);

        abort_unless($cita && $cita->paciente_id === $pacienteId, 404);

        if ($cita->estado !== 'completada') {
            return response()->json(['message' => 'Solo se pueden calificar citas completadas.'], 422);
        }
        if ($cita->calificacion !== null) {
            return response()->json(['message' => 'Esta cita ya fue calificada.'], 422);
        }

        $cita->update($data);
        return response()->json($cita);
    }

    public function reagendar(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'fecha'       => 'required|date|after_or_equal:today',
            'hora_inicio' => 'required|date_format:H:i',
        ]);

        $pacienteId = $request->user()->paciente->id;
        $cita       = $this->citas->find($id);

        abort_unless($cita && $cita->paciente_id === $pacienteId, 404);

        if (!in_array($cita->estado, ['pendiente', 'confirmada'])) {
            return response()->json(['message' => 'Solo se pueden reagendar citas pendientes o confirmadas.'], 422);
        }

        // Verificar que el consultorio sigue activo y con membrecía vigente
        $consultorio = Consultorio::with('membrecia')->find($cita->consultorio_id);
        if (!$consultorio || !$consultorio->activo) {
            return response()->json(['message' => 'El consultorio no está disponible para reagendar.'], 422);
        }
        if (!$consultorio->membrecia?->vigente()) {
            return response()->json(['message' => 'El consultorio no puede recibir citas actualmente.'], 422);
        }

        $tratamiento = $this->tratamientos->find($cita->tratamiento_id);
        $horaFin     = \Carbon\Carbon::parse($data['hora_inicio'])
                        ->addMinutes($tratamiento->duracion_minutos)
                        ->format('H:i');

        $fechaAnterior = $cita->fecha->toDateString();

        $actualizada = DB::transaction(function () use ($cita, $data, $horaFin) {
            if ($this->citas->hayConflicto($cita->consultorio_id, $data['fecha'], $data['hora_inicio'], $horaFin, $cita->id)) {
                return null;
            }
            $cita->update([...$data, 'hora_fin' => $horaFin, 'estado' => 'pendiente']);
            return $cita;
        });

        if (!$actualizada) {
            return response()->json(['message' => 'El horario ya está ocupado. Elige otro disponible.'], 422);
        }

        // Limpiar caché de la fecha anterior y la nueva
        $this->limpiarCache($cita->consultorio_id, $cita->tratamiento_id, $fechaAnterior);
        $this->limpiarCache($cita->consultorio_id, $cita->tratamiento_id, $data['fecha']);

        // Observer: notifica al consultorio del reagendamiento
        event(new NuevaCitaRegistrada($actualizada));

        return response()->json($actualizada->fresh(['paciente.user', 'consultorio', 'tratamiento']));
    }

    private function limpiarCache(int $consultorioId, int $tratamientoId, string $fecha): void
    {
        // Cache invalidation omitted — requires Redis tagging support
    }
}
