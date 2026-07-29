<?php

namespace App\Listeners;

use App\Events\NuevaCitaRegistrada;
use App\Services\Notifications\NotificacionFactory;

class EnviarNotificacionNuevaCita
{
    public function handle(NuevaCitaRegistrada $event): void
    {
        $cita = $event->cita->load(['paciente.user', 'consultorio.membrecia', 'tratamiento']);
        NotificacionFactory::para($cita->consultorio)->enviarConfirmacion($cita);
    }
}
