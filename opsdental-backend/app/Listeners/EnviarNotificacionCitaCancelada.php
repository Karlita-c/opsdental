<?php

namespace App\Listeners;

use App\Events\CitaCancelada;
use App\Services\Notifications\NotificacionFactory;

class EnviarNotificacionCitaCancelada
{
    public function handle(CitaCancelada $event): void
    {
        $cita = $event->cita->load(['paciente.user', 'consultorio.membrecia', 'tratamiento']);
        NotificacionFactory::para($cita->consultorio)->enviarCancelacion($cita);
    }
}
