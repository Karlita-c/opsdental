<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\CitaRepository;
use App\Repositories\HorarioRepository;
use App\Repositories\TratamientoRepository;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DisponibilidadController extends Controller
{
    public function __construct(
        private CitaRepository $citas,
        private HorarioRepository $horarios,
        private TratamientoRepository $tratamientos
    ) {}

    /**
     * GET /disponibilidad
     * Retorna los slots horarios para un consultorio + tratamiento + fecha.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'consultorio_id' => 'required|integer|exists:consultorios,id',
            'tratamiento_id' => 'required|integer|exists:tratamientos,id',
            'fecha'          => 'required|date|after_or_equal:today',
        ]);

        $cId = (int) $request->consultorio_id;
        $tId = (int) $request->tratamiento_id;

        $cacheKey = "disp:{$cId}:{$tId}:{$request->fecha}";

        $slots = Cache::tags(["disp:{$cId}"])->remember($cacheKey, 300, function () use ($cId, $tId, $request) {
            return $this->calcularSlots($cId, $tId, $request->fecha);
        });

        return response()->json(['slots' => $slots]);
    }

    /**
     * GET /disponibilidad/dias
     * Retorna los días de la semana activos del consultorio para mostrar en el calendario.
     */
    public function dias(Request $request): JsonResponse
    {
        $request->validate([
            'consultorio_id' => 'required|integer|exists:consultorios,id',
        ]);

        $cId = (int) $request->consultorio_id;

        $horarios = $this->horarios->porConsultorio($cId)->where('activo', true);

        $dias = $horarios->map(fn($h) => [
            'dia_semana'  => $h->dia_semana,
            'hora_inicio' => $h->hora_inicio,
            'hora_fin'    => $h->hora_fin,
        ])->values();

        return response()->json(['dias' => $dias]);
    }

    private function calcularSlots(int $consultorioId, int $tratamientoId, string $fecha): array
    {
        $consultorioActivo = \App\Models\Consultorio::where('id', $consultorioId)
            ->where('activo', true)
            ->exists();

        if (!$consultorioActivo) {
            return [];
        }

        $tratamiento = $this->tratamientos->find($tratamientoId);
        if (!$tratamiento || !$tratamiento->activo) {
            return [];
        }

        // Normalizar nombre de día para comparar con la BD
        $diaSemana = strtolower(Carbon::parse($fecha)->locale('es')->isoFormat('dddd'));
        $diaSemana = str_replace(
            ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'],
            ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],
            $diaSemana
        );

        $horario = $this->horarios->porConsultorio($consultorioId)
            ->filter(fn($h) => $h->activo)                    // solo horarios activos
            ->firstWhere('dia_semana', $diaSemana);

        if (!$horario) {
            return [];
        }

        $citasOcupadas = $this->citas->porConsultorioFecha($consultorioId, $fecha);
        $duracion      = $tratamiento->duracion_minutos;
        $inicio        = Carbon::parse("{$fecha} {$horario->hora_inicio}");
        $fin           = Carbon::parse("{$fecha} {$horario->hora_fin}");
        $slots         = [];

        while ($inicio->copy()->addMinutes($duracion)->lte($fin)) {
            $horaSlot = $inicio->format('H:i');
            $finSlot  = $inicio->copy()->addMinutes($duracion)->format('H:i');
            $ocupado  = $citasOcupadas->first(
                fn($c) => $c->hora_inicio < $finSlot && $c->hora_fin > $horaSlot
            );

            $slots[] = [
                'hora_inicio' => $horaSlot,
                'hora_fin'    => $finSlot,
                'disponible'  => !$ocupado,
            ];

            $inicio->addMinutes($duracion);
        }

        return $slots;
    }
}
