<?php

namespace App\Services;

use App\Models\Cita;
use App\Models\ListaEspera;
use App\Repositories\ListaEsperaRepository;
use Illuminate\Support\Facades\Log;

class ListaEsperaService
{
    public function __construct(private ListaEsperaRepository $repo) {}

    /**
     * Al cancelarse una cita, busca el siguiente en la cola y lo notifica.
     */
    public function notificarSiguiente(Cita $citaCancelada): void
    {
        $siguiente = $this->repo->siguienteEnCola(
            $citaCancelada->consultorio_id,
            $citaCancelada->tratamiento_id
        );

        if (!$siguiente) {
            return;
        }

        $expira = now()->addHours(2);
        $siguiente->update([
            'estado'        => 'notificado',
            'notificado_en' => now(),
            'expira_en'     => $expira,
        ]);

        $telefono = $siguiente->paciente->user->telefono ?? '';
        $nombre   = $siguiente->paciente->user->name ?? '';
        $fecha    = $citaCancelada->fecha->format('d/m/Y');
        $hora     = $citaCancelada->hora_inicio;

        Log::info("WhatsApp lista espera → $telefono", [
            'mensaje' => "¡Hola $nombre! Se liberó un espacio en OpsDental para el $fecha a las $hora. "
                       . "Tienes 2 horas para confirmar tu cita antes de que pase al siguiente en lista.",
        ]);
        // Fase N8N: llamar a Meta WhatsApp Cloud API aquí
    }

    /**
     * Marca la entrada como convertida cuando el paciente finalmente agenda.
     */
    public function marcarConvertido(int $listaEsperaId): void
    {
        ListaEspera::where('id', $listaEsperaId)->update(['estado' => 'convertido']);
    }

    /**
     * Limpia entradas expiradas (ejecutado por el scheduler).
     */
    public function limpiarExpirados(): int
    {
        return ListaEspera::where('estado', 'notificado')
            ->where('expira_en', '<', now())
            ->update(['estado' => 'en_espera', 'notificado_en' => null, 'expira_en' => null]);
    }
}
