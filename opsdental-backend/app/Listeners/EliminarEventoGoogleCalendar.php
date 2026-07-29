<?php

namespace App\Listeners;

use App\Events\CitaCancelada;
use App\Services\GoogleCalendarService;

class EliminarEventoGoogleCalendar
{
    public function __construct(private GoogleCalendarService $service) {}

    public function handle(CitaCancelada $event): void
    {
        $this->service->eliminarEventoCita($event->cita);
    }
}
