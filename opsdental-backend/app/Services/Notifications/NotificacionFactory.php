<?php

namespace App\Services\Notifications;

use App\Models\Consultorio;
use App\Services\Notifications\Contracts\NotificacionInterface;

class NotificacionFactory
{
    public static function para(Consultorio $consultorio): NotificacionInterface
    {
        return new WhatsAppNotificacion();
    }
}
