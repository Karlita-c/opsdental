<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Recordatorios automáticos — todos los días a las 8:00 AM
Schedule::command('bb:recordatorios')->dailyAt('08:00');

// Lista de espera — libera notificaciones expiradas cada hora
Schedule::call(function () {
    app(\App\Services\ListaEsperaService::class)->limpiarExpirados();
})->hourly()->name('lista-espera:limpiar-expirados');

// Membresías — desactiva consultorios con plan vencido cada día a medianoche
Schedule::command('opsdental:expirar-membrecias')->dailyAt('00:05');
