<?php

namespace App\Repositories;

use App\Models\Cita;
use Illuminate\Database\Eloquent\Collection;

class CitaRepository extends BaseRepository
{
    public function __construct(Cita $model)
    {
        parent::__construct($model);
    }

    public function porConsultorioFecha(int $consultorioId, string $fecha, array $estados = ['pendiente', 'confirmada']): Collection
    {
        return $this->model
            ->where('consultorio_id', $consultorioId)
            ->whereDate('fecha', $fecha)
            ->when(!empty($estados), fn($q) => $q->whereIn('estado', $estados))
            ->with(['paciente.user', 'tratamiento'])
            ->orderBy('hora_inicio')
            ->get();
    }

    public function porPaciente(int $pacienteId): Collection
    {
        return $this->model
            ->where('paciente_id', $pacienteId)
            ->with(['consultorio', 'tratamiento'])
            ->orderBy('fecha', 'desc')
            ->get();
    }

    public function contarMes(int $consultorioId, int $anio, int $mes): int
    {
        $inicio     = \Carbon\Carbon::createFromDate($anio, $mes, 1)->toDateString();
        $inicioNext = \Carbon\Carbon::createFromDate($anio, $mes, 1)->addMonth()->toDateString();

        return $this->model
            ->where('consultorio_id', $consultorioId)
            ->where('fecha', '>=', $inicio)
            ->where('fecha', '<',  $inicioNext)
            ->whereIn('estado', ['pendiente', 'confirmada', 'completada'])
            ->count();
    }

    public function hayConflicto(int $consultorioId, string $fecha, string $horaInicio, string $horaFin, ?int $exceptoId = null): bool
    {
        // Dos intervalos [a,b) y [c,d) se solapan si y solo si a < d AND b > c.
        // Citas consecutivas (b == c) NO solapan.
        $query = $this->model
            ->where('consultorio_id', $consultorioId)
            ->whereDate('fecha', $fecha)
            ->whereIn('estado', ['pendiente', 'confirmada'])
            ->where('hora_inicio', '<', $horaFin)
            ->where('hora_fin',    '>', $horaInicio);

        if ($exceptoId) {
            $query->where('id', '!=', $exceptoId);
        }

        return $query->exists();
    }
}
