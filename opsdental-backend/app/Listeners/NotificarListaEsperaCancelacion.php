<?php

namespace App\Listeners;

use App\Events\CitaCancelada;
use App\Services\ListaEsperaService;

class NotificarListaEsperaCancelacion
{
    public function __construct(private ListaEsperaService $service) {}

    public function handle(CitaCancelada $event): void
    {
        $this->service->notificarSiguiente($event->cita);
    }
}
