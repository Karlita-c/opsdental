<?php

namespace App\Http\Controllers\Api;

use App\Events\NuevaCitaRegistrada;
use App\Http\Controllers\Controller;
use App\Models\Consultorio;
use App\Models\Horario;
use App\Models\Paciente;
use App\Repositories\CitaRepository;
use App\Repositories\TratamientoRepository;
use App\Services\DepositoService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CitaController extends Controller
{
    public function __construct(
        private CitaRepository $citas,
        private TratamientoRepository $tratamientos,
        private DepositoService $depositos
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $lista = match ($user->role) {
            'paciente'    => $this->citas->porPaciente($user->paciente->id),
            'consultorio' => $this->citas->porConsultorioFecha(
                $user->consultorio->id,
                $request->query('fecha', now()->toDateString()),
                ['pendiente', 'confirmada', 'completada', 'reservada']
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
                        ->addMinutes($tratamiento->duracion_minutos ?? 30)
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

        $montoAnticipo = $consultorio->calcularAnticipo((float) $tratamiento->precio);

        if ($montoAnticipo > 0) {
            // Con anticipo: el slot se reserva 30 min pero la cita no se confirma hasta que se pague
            try {
                $preference = $this->depositos->crearPreference($cita, $montoAnticipo);
                $cita->update([
                    'estado'                 => 'reservada',
                    'deposito_monto'         => $montoAnticipo,
                    'deposito_estado'        => 'pendiente',
                    'deposito_preference_id' => $preference['preference_id'],
                    'deposito_expires_at'    => now()->addMinutes(30),
                ]);

                return response()->json([
                    'id'         => $cita->id,
                    'anticipo'   => [
                        'requerido'  => true,
                        'monto'      => $montoAnticipo,
                        'init_point' => $preference['init_point'],
                        'politica'   => $consultorio->getPolitica(),
                        'expira_en'  => 30, // minutos
                    ],
                    'tratamiento' => ['nombre' => $tratamiento->nombre],
                    'consultorio' => ['nombre' => $consultorio->nombre],
                    'fecha'       => $cita->fecha->format('Y-m-d'),
                    'hora_inicio' => $cita->hora_inicio,
                    'hora_fin'    => $cita->hora_fin,
                ], 201);
            } catch (\Throwable $e) {
                // Si MP falla, cancelamos la reserva y avisamos al paciente
                $cita->delete();
                return response()->json(['message' => 'No se pudo procesar el pago. Intenta de nuevo.'], 422);
            }
        }

        // Sin anticipo: cita confirmada directamente
        $this->limpiarCache($consultorio->id, $data['tratamiento_id'], $data['fecha']);
        event(new NuevaCitaRegistrada($cita));

        return response()->json([
            ...$cita->load(['paciente.user', 'consultorio', 'tratamiento'])->toArray(),
            'anticipo' => ['requerido' => false],
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $pacienteId = $request->user()->paciente->id;
        $cita       = $this->citas->find($id, ['paciente.user', 'consultorio', 'tratamiento']);

        abort_unless($cita && $cita->paciente_id === $pacienteId, 404);
        return response()->json($cita);
    }

    /** Consulta previa: qué penalización aplica si el paciente cancela ahora */
    public function consultarPenalizacion(Request $request, int $id): JsonResponse
    {
        $pacienteId = $request->user()->paciente->id;
        $cita       = $this->citas->find($id, ['consultorio']);

        abort_unless($cita && $cita->paciente_id === $pacienteId, 404);
        abort_unless(in_array($cita->estado, ['pendiente', 'confirmada']), 422);

        $this->citas->find($id, ['consultorio']); // ya cargado
        $penalizacion = $cita->calcularPenalizacion();

        $politica = $cita->consultorio->getPolitica();

        return response()->json([
            'penalizacion' => $penalizacion,
            'politica'     => $politica,
            'deposito'     => [
                'monto'  => (float) ($cita->deposito_monto ?? 0),
                'estado' => $cita->deposito_estado,
            ],
        ]);
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

        $penalizacion = $cita->calcularPenalizacion();
        $cita->cancelar();
        $this->limpiarCache($cita->consultorio_id, $cita->tratamiento_id, $cita->fecha->toDateString());

        // Devolver depósito (total o parcial) si aplica
        if ($penalizacion['devolver'] > 0) {
            $this->depositos->devolverDeposito($cita, $penalizacion['devolver']);
        }
        if ($penalizacion['retener'] > 0 && $penalizacion['devolver'] > 0) {
            $cita->update(['deposito_estado' => 'retenido_parcial']);  // cobro parcial
        } elseif ($penalizacion['retener'] > 0) {
            $cita->update(['deposito_estado' => 'retenido']);           // 100 % retenido
        }

        return response()->json([
            'message'      => 'Cita cancelada correctamente.',
            'penalizacion' => $penalizacion,
        ]);
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
                        ->addMinutes($tratamiento->duracion_minutos ?? 30)
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

    public function misPacientes(Request $request): JsonResponse
    {
        $consultorioId = $request->user()->consultorio->id;

        $pacientes = Paciente::with('user')
            ->where('consultorio_id', $consultorioId)
            ->get()
            ->map(fn($p) => [
                'id'       => $p->id,
                'nombre'   => $p->user->name,
                'telefono' => $p->user->telefono ?? '',
            ]);

        return response()->json($pacientes);
    }

    public function slotsDisponibles(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fecha'          => 'required|date',
            'tratamiento_id' => 'required|exists:tratamientos,id',
        ]);

        $consultorioId = $request->user()->consultorio->id;
        $tratamiento   = $this->tratamientos->find((int) $data['tratamiento_id']);

        if (!$tratamiento || $tratamiento->consultorio_id !== $consultorioId) {
            return response()->json([], 422);
        }

        $duracion = $tratamiento->duracion_minutos ?? 30;
        $fecha    = Carbon::parse($data['fecha']);

        $dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        $diaSemana = $dias[$fecha->dayOfWeek];

        $horarios = Horario::where('consultorio_id', $consultorioId)
            ->where('dia_semana', $diaSemana)
            ->where('activo', true)
            ->get();

        if ($horarios->isEmpty()) {
            return response()->json([]);
        }

        $ocupadas = $this->citas->porConsultorioFecha(
            $consultorioId,
            $data['fecha'],
            ['pendiente', 'confirmada', 'reservada']
        );

        $slots = [];
        foreach ($horarios as $horario) {
            $cursor = Carbon::parse($data['fecha'] . ' ' . $horario->hora_inicio);
            $limite = Carbon::parse($data['fecha'] . ' ' . $horario->hora_fin);

            while ($cursor->copy()->addMinutes($duracion)->lte($limite)) {
                $inicio    = $cursor->format('H:i');
                $fin       = $cursor->copy()->addMinutes($duracion)->format('H:i');
                $inicioMin = $cursor->copy()->format('H:i');
                $finMin    = $cursor->copy()->addMinutes($duracion)->format('H:i');

                $libre = $ocupadas->every(function ($c) use ($inicioMin, $finMin) {
                    $ci = substr($c->hora_inicio, 0, 5);
                    $cf = substr($c->hora_fin,    0, 5);
                    return $ci >= $finMin || $cf <= $inicioMin;
                });

                $slots[] = ['hora_inicio' => $inicio, 'hora_fin' => $fin, 'disponible' => $libre];
                $cursor->addMinutes($duracion);
            }
        }

        return response()->json($slots);
    }

    public function crearPorConsultorio(Request $request): JsonResponse
    {
        $data = $request->validate([
            'paciente_id'    => 'required|exists:pacientes,id',
            'tratamiento_id' => 'required|exists:tratamientos,id',
            'fecha'          => 'required|date|after_or_equal:today',
            'hora_inicio'    => 'required|date_format:H:i',
            'notas'          => 'nullable|string|max:500',
        ]);

        $consultorioId = $request->user()->consultorio->id;

        $paciente = Paciente::find($data['paciente_id']);
        if (!$paciente || $paciente->consultorio_id !== $consultorioId) {
            return response()->json(['message' => 'El paciente no pertenece a este consultorio.'], 403);
        }

        $tratamiento = $this->tratamientos->find((int) $data['tratamiento_id']);
        if (!$tratamiento || $tratamiento->consultorio_id !== $consultorioId || !$tratamiento->activo) {
            return response()->json(['message' => 'El tratamiento no está disponible.'], 422);
        }

        $horaFin = Carbon::parse($data['hora_inicio'])
            ->addMinutes($tratamiento->duracion_minutos ?? 30)
            ->format('H:i');

        $cita = DB::transaction(function () use ($data, $horaFin, $consultorioId) {
            if ($this->citas->hayConflicto($consultorioId, $data['fecha'], $data['hora_inicio'], $horaFin)) {
                return null;
            }
            return $this->citas->create([
                ...$data,
                'consultorio_id' => $consultorioId,
                'hora_fin'       => $horaFin,
                'estado'         => 'confirmada',
            ]);
        });

        if (!$cita) {
            return response()->json(['message' => 'El horario ya está ocupado. Elige otro.'], 422);
        }

        $this->limpiarCache($consultorioId, $data['tratamiento_id'], $data['fecha']);

        return response()->json($cita->load(['paciente.user', 'consultorio', 'tratamiento']), 201);
    }

    private function limpiarCache(int $consultorioId, int $tratamientoId, string $fecha): void
    {
        // Cache invalidation omitted — requires Redis tagging support
    }
}
