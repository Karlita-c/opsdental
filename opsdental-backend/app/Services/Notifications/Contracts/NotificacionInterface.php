<?php

namespace App\Services\Notifications\Contracts;

use App\Models\Cita;

interface NotificacionInterface
{
    public function enviarConfirmacion(Cita $cita): void;
    public function enviarCancelacion(Cita $cita): void;
    public function enviarRecordatorio(Cita $cita): void;
}
