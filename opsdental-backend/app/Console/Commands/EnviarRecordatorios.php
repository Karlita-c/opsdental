<?php

namespace App\Console\Commands;

use App\Models\Cita;
use App\Services\Notifications\NotificacionFactory;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class EnviarRecordatorios extends Command
{
    protected $signature   = 'bb:recordatorios';
    protected $description = 'Envía recordatorios de citas del día siguiente';

    public function handle(): int
    {
        $manana = now()->addDay()->toDateString();

        $citas = Cita::with(['paciente.user', 'consultorio.membrecia', 'tratamiento'])
            ->whereDate('fecha', $manana)
            ->whereIn('estado', ['pendiente', 'confirmada'])
            ->get();

        foreach ($citas as $cita) {
            try {
                NotificacionFactory::para($cita->consultorio)->enviarRecordatorio($cita);
            } catch (\Throwable $e) {
                Log::error("Recordatorio fallido cita #{$cita->id}: {$e->getMessage()}");
            }
        }

        $this->info("Recordatorios enviados: {$citas->count()}");
        return self::SUCCESS;
    }
}
