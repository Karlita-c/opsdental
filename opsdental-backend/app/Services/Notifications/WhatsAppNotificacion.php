<?php

namespace App\Services\Notifications;

use App\Models\Cita;
use App\Services\Notifications\Contracts\NotificacionInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppNotificacion implements NotificacionInterface
{
    private string $phoneNumberId;
    private string $token;
    private string $apiUrl;

    public function __construct()
    {
        $this->phoneNumberId = config('services.whatsapp.phone_number_id', '');
        $this->token         = config('services.whatsapp.token', '');
        $this->apiUrl        = "https://graph.facebook.com/v19.0/{$this->phoneNumberId}/messages";
    }

    public function enviarConfirmacion(Cita $cita): void
    {
        $nombre = $cita->paciente->user->name;
        $fecha  = $cita->fecha->format('d/m/Y');
        $hora   = $cita->hora_inicio;
        $trat   = $cita->tratamiento->nombre;

        $this->enviar(
            $cita->paciente->user->telefono ?? '',
            "¡Hola {$nombre}! Tu cita para *{$trat}* quedó agendada para el *{$fecha}* a las *{$hora}*. "
            . "Te esperamos en OpsDental. Responde *CANCELAR* si necesitas reagendar."
        );
    }

    public function enviarCancelacion(Cita $cita): void
    {
        $nombre = $cita->paciente->user->name;
        $fecha  = $cita->fecha->format('d/m/Y');

        $this->enviar(
            $cita->paciente->user->telefono ?? '',
            "Hola {$nombre}, tu cita del {$fecha} en OpsDental fue *cancelada*. "
            . "Escríbenos para reagendar cuando gustes."
        );
    }

    public function enviarRecordatorio(Cita $cita): void
    {
        $nombre = $cita->paciente->user->name;
        $fecha  = $cita->fecha->format('d/m/Y');
        $hora   = $cita->hora_inicio;

        $this->enviar(
            $cita->paciente->user->telefono ?? '',
            "👋 Hola {$nombre}, te recordamos que mañana *{$fecha} a las {$hora}* tienes cita en OpsDental. "
            . "Responde *SÍ* para confirmar o *CANCELAR* si no puedes asistir."
        );
    }

    private function enviar(string $telefono, string $mensaje): void
    {
        if (!$this->token || !$this->phoneNumberId) {
            Log::warning("WhatsApp no configurado — mensaje no enviado", ['telefono' => $telefono]);
            return;
        }

        $telefono = preg_replace('/[^0-9]/', '', $telefono);
        if (strlen($telefono) < 10) {
            Log::warning("WhatsApp: teléfono inválido", ['telefono' => $telefono]);
            return;
        }

        $response = Http::withToken($this->token)->post($this->apiUrl, [
            'messaging_product' => 'whatsapp',
            'to'                => $telefono,
            'type'              => 'text',
            'text'              => ['body' => $mensaje],
        ]);

        if ($response->failed()) {
            Log::error("WhatsApp envío fallido", [
                'telefono' => $telefono,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);
        } else {
            Log::info("WhatsApp enviado → {$telefono}");
        }
    }
}
