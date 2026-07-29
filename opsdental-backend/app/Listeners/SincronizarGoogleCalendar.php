<?php

namespace App\Listeners;

use App\Events\NuevaCitaRegistrada;
use App\Services\GoogleCalendarService;
use Illuminate\Support\Facades\Log;

class SincronizarGoogleCalendar
{
    public function __construct(private GoogleCalendarService $service) {}

    public function handle(NuevaCitaRegistrada $event): void
    {
        $cita    = $event->cita;
        $eventId = $this->service->crearEventoCita($cita);

        if ($eventId) {
            $cita->update(['google_event_id_consultorio' => $eventId]);
            Log::info("Google Calendar: evento creado {$eventId} para cita {$cita->id}");
        }
    }
}
