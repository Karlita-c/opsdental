<?php

namespace App\Repositories;

use App\Models\Expediente;
use Illuminate\Database\Eloquent\Collection;

class ExpedienteRepository
{
    public function porPaciente(int $consultorioId, int $pacienteId): Collection
    {
        return Expediente::where('consultorio_id', $consultorioId)
            ->where('paciente_id', $pacienteId)
            ->orderBy('fecha_visita', 'desc')
            ->get();
    }

    public function crear(array $data): Expediente
    {
        return Expediente::create($data);
    }

    public function buscar(int $id, int $consultorioId): ?Expediente
    {
        return Expediente::where('id', $id)
            ->where('consultorio_id', $consultorioId)
            ->first();
    }

    public function actualizar(Expediente $expediente, array $data): Expediente
    {
        $expediente->update($data);
        return $expediente->fresh();
    }
}
