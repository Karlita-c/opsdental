<?php

namespace App\Repositories;

use App\Models\ListaEspera;
use Illuminate\Database\Eloquent\Collection;

class ListaEsperaRepository
{
    public function siguienteEnCola(int $consultorioId, ?int $tratamientoId = null): ?ListaEspera
    {
        return ListaEspera::with('paciente.user', 'tratamiento')
            ->where('consultorio_id', $consultorioId)
            ->where('estado', 'en_espera')
            ->when($tratamientoId, fn($q) => $q->where(function ($q) use ($tratamientoId) {
                $q->where('tratamiento_id', $tratamientoId)->orWhereNull('tratamiento_id');
            }))
            ->orderBy('posicion')
            ->orderBy('created_at')
            ->first();
    }

    public function porConsultorio(int $consultorioId): Collection
    {
        return ListaEspera::with('paciente.user', 'tratamiento')
            ->where('consultorio_id', $consultorioId)
            ->whereIn('estado', ['en_espera', 'notificado'])
            ->orderBy('posicion')
            ->orderBy('created_at')
            ->get();
    }

    public function porPaciente(int $pacienteId): Collection
    {
        return ListaEspera::with('consultorio', 'tratamiento')
            ->where('paciente_id', $pacienteId)
            ->whereIn('estado', ['en_espera', 'notificado'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function yaEnCola(int $consultorioId, int $pacienteId, ?int $tratamientoId): bool
    {
        return ListaEspera::where('consultorio_id', $consultorioId)
            ->where('paciente_id', $pacienteId)
            ->where('tratamiento_id', $tratamientoId)
            ->whereIn('estado', ['en_espera', 'notificado'])
            ->exists();
    }

    public function proximaPosicion(int $consultorioId): int
    {
        return (ListaEspera::where('consultorio_id', $consultorioId)
            ->whereIn('estado', ['en_espera', 'notificado'])
            ->max('posicion') ?? 0) + 1;
    }

    public function create(array $data): ListaEspera
    {
        return ListaEspera::create($data);
    }
}
