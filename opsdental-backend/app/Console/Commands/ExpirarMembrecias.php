<?php

namespace App\Console\Commands;

use App\Models\Membrecia;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExpirarMembrecias extends Command
{
    protected $signature   = 'opsdental:expirar-membrecias';
    protected $description = 'Desactiva automáticamente los consultorios con membresía vencida';

    public function handle(): int
    {
        $vencidas = Membrecia::with('consultorio')
            ->where('activa', true)
            ->whereDate('fecha_vencimiento', '<', today())
            ->get();

        if ($vencidas->isEmpty()) {
            $this->info('Sin membresías vencidas hoy.');
            return self::SUCCESS;
        }

        $ids = $vencidas->pluck('id');
        $consultorioIds = $vencidas->pluck('consultorio_id');

        DB::transaction(function () use ($ids, $consultorioIds, $vencidas) {
            // Desactivar membresías
            Membrecia::whereIn('id', $ids)->update(['activa' => false]);

            // Desactivar los consultorios correspondientes
            DB::table('consultorios')
                ->whereIn('id', $consultorioIds)
                ->update(['activo' => false]);
        });

        foreach ($vencidas as $m) {
            Log::info('Membresía expirada', [
                'consultorio_id'   => $m->consultorio_id,
                'consultorio'      => $m->consultorio?->nombre,
                'plan'             => $m->plan,
                'fecha_vencimiento'=> $m->fecha_vencimiento->toDateString(),
            ]);
        }

        $this->info("Membresías expiradas: {$vencidas->count()}");
        $this->table(
            ['Consultorio', 'Plan', 'Venció'],
            $vencidas->map(fn($m) => [
                $m->consultorio?->nombre ?? "ID {$m->consultorio_id}",
                $m->plan,
                $m->fecha_vencimiento->toDateString(),
            ])->toArray()
        );

        return self::SUCCESS;
    }
}
