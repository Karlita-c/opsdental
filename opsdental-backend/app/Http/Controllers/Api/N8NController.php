<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\Paciente;
use App\Models\User;
use App\Services\Notifications\WhatsAppNotificacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class N8NController extends Controller
{
    public function __construct(private WhatsAppNotificacion $wa) {}

    public function citasManana(): JsonResponse
    {
        $manana = now()->addDay()->toDateString();

        $citas = Cita::with(['paciente.user', 'tratamiento', 'consultorio'])
            ->whereDate('fecha', $manana)
            ->whereIn('estado', ['pendiente', 'confirmada'])
            ->get()
            ->map(fn($c) => [
                'id'          => $c->id,
                'nombre'      => $c->paciente->user->name,
                'telefono'    => User::telefonoMx($c->paciente->user->telefono ?? ''),
                'fecha'       => $c->fecha->format('d/m/Y'),
                'hora'        => $c->hora_inicio,
                'tratamiento' => $c->tratamiento->nombre,
                'consultorio' => $c->consultorio->nombre,
            ]);

        return response()->json($citas);
    }

    public function confirmarPorWhatsapp(Request $request): JsonResponse
    {
        $telefono = User::normalizarTelefono($request->input('telefono', ''));

        $user = User::where('telefono', 'LIKE', "%{$telefono}%")->first();
        if (!$user) return response()->json(['ok' => false, 'msg' => 'Usuario no encontrado'], 404);

        $cita = Cita::where('paciente_id', $user->paciente?->id)
            ->where('estado', 'pendiente')
            ->whereDate('fecha', '>=', now()->toDateString())
            ->orderBy('fecha')
            ->first();

        if (!$cita) return response()->json(['ok' => false, 'msg' => 'No hay citas pendientes'], 404);

        $cita->update(['estado' => 'confirmada']);
        return response()->json(['ok' => true, 'cita_id' => $cita->id]);
    }

    public function cancelarPorWhatsapp(Request $request): JsonResponse
    {
        $telefono = User::normalizarTelefono($request->input('telefono', ''));

        $user = User::where('telefono', 'LIKE', "%{$telefono}%")->first();
        if (!$user) return response()->json(['ok' => false, 'msg' => 'Usuario no encontrado'], 404);

        $cita = Cita::where('paciente_id', $user->paciente?->id)
            ->whereIn('estado', ['pendiente', 'confirmada'])
            ->whereDate('fecha', '>=', now()->toDateString())
            ->orderBy('fecha')
            ->first();

        if (!$cita) return response()->json(['ok' => false, 'msg' => 'No hay citas activas'], 404);

        $cita->cancelar();
        return response()->json(['ok' => true, 'cita_id' => $cita->id]);
    }

    public function expedienteWa(Request $request): JsonResponse
    {
        $telefono = User::normalizarTelefono($request->input('telefono', ''));
        $user = User::where('telefono', 'LIKE', "%{$telefono}%")->first();

        if (!$user) {
            return response()->json(['mensaje' => '❌ No encontramos tu número. Contacta a tu consultorio para que te registren.']);
        }

        $citas = Cita::where('paciente_id', $user->paciente?->id)
            ->with(['tratamiento', 'consultorio'])
            ->orderBy('fecha', 'desc')
            ->take(3)
            ->get();

        if ($citas->isEmpty()) {
            return response()->json(['mensaje' => '📋 Aún no tienes citas registradas.\n\nEscribe *CITA* para agendar tu primera cita. 😊']);
        }

        $lineas = $citas->map(fn($c) =>
            "📅 {$c->fecha->format('d/m/Y')} {$c->hora_inicio} — {$c->tratamiento->nombre} ({$c->estado})"
        )->join("\n");

        return response()->json([
            'mensaje' => "📋 *Tus últimas citas:*\n\n{$lineas}\n\nEscribe *CITA* para agendar una nueva o *MENU* para ver opciones.",
        ]);
    }

    public function calificarWa(Request $request): JsonResponse
    {
        $telefono    = User::normalizarTelefono($request->input('telefono', ''));
        $calificacion = (int) $request->input('calificacion', 0);

        if ($calificacion < 1 || $calificacion > 5) {
            return response()->json(['mensaje' => '⭐ Responde con un número del *1 al 5* para calificar tu visita.\n\n1 = Muy malo  5 = Excelente']);
        }

        $user = User::where('telefono', 'LIKE', "%{$telefono}%")->first();
        if (!$user) {
            return response()->json(['mensaje' => '❌ No encontramos tu número en el sistema.']);
        }

        $cita = Cita::where('paciente_id', $user->paciente?->id)
            ->whereIn('estado', ['confirmada', 'completada'])
            ->whereDate('fecha', '<=', now()->toDateString())
            ->orderBy('fecha', 'desc')
            ->first();

        if (!$cita) {
            return response()->json(['mensaje' => '❌ No encontramos citas recientes para calificar.']);
        }

        $cita->update(['calificacion' => $calificacion]);

        $estrellas = str_repeat('⭐', $calificacion);
        return response()->json([
            'mensaje' => "¡Gracias por tu calificación {$estrellas}!\n\nTu opinión nos ayuda a mejorar. 🦷\n\nEscribe *MENU* si necesitas algo más.",
        ]);
    }

    public function pacientesSinCita(Request $request): JsonResponse
    {
        $dias  = max(1, (int) $request->input('dias', 60));
        $desde = now()->subDays($dias)->toDateString();

        $conCitaReciente = Cita::where('fecha', '>=', $desde)->pluck('paciente_id')->unique();

        $pacientes = Paciente::with('user')
            ->whereNotIn('id', $conCitaReciente)
            ->get()
            ->map(fn($p) => [
                'nombre'   => $p->user->name,
                'telefono' => User::telefonoMx($p->user->telefono ?? ''),
            ])
            ->filter(fn($p) => strlen($p['telefono']) >= 12)
            ->values();

        return response()->json($pacientes);
    }

    public function cumpleanosHoy(): JsonResponse
    {
        $hoy = now()->format('m-d');

        $pacientes = Paciente::with('user')
            ->whereNotNull('fecha_nacimiento')
            ->whereRaw("TO_CHAR(fecha_nacimiento, 'MM-DD') = ?", [$hoy])
            ->get()
            ->map(fn($p) => [
                'nombre'   => $p->user->name,
                'telefono' => User::telefonoMx($p->user->telefono ?? ''),
            ])
            ->filter(fn($p) => strlen($p['telefono']) >= 12)
            ->values();

        return response()->json($pacientes);
    }

    public function citasTerminadas(Request $request): JsonResponse
    {
        $horas    = max(1, (int) $request->input('horas', 2));
        $horaCorte = now()->subHours($horas)->format('H:i:s');
        $horaDesde = now()->subHours($horas + 1)->format('H:i:s');

        $citas = Cita::with(['paciente.user', 'tratamiento', 'consultorio'])
            ->whereDate('fecha', now()->toDateString())
            ->whereIn('estado', ['confirmada', 'completada'])
            ->whereTime('hora_fin', '<=', $horaCorte)
            ->whereTime('hora_fin', '>=', $horaDesde)
            ->get()
            ->map(fn($c) => [
                'nombre'      => $c->paciente->user->name,
                'telefono'    => User::telefonoMx($c->paciente->user->telefono ?? ''),
                'tratamiento' => $c->tratamiento->nombre,
                'consultorio' => $c->consultorio->nombre,
            ])
            ->filter(fn($c) => strlen($c['telefono']) >= 12)
            ->values();

        return response()->json($citas);
    }

    public function webhookVerificacion(Request $request): mixed
    {
        $mode      = $request->query('hub_mode');
        $token     = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode === 'subscribe' && $token === config('services.whatsapp.verify_token')) {
            return response($challenge, 200);
        }
        return response('Forbidden', 403);
    }

    public function webhookIncoming(Request $request): mixed
    {
        $payload = $request->json()->all();

        if (($payload['object'] ?? '') !== 'whatsapp_business_account') {
            return response('', 200);
        }

        $messages = data_get($payload, 'entry.0.changes.0.value.messages');
        if (!$messages || !is_array($messages)) {
            return response('', 200);
        }

        foreach ($messages as $msg) {
            if (($msg['type'] ?? '') !== 'text') continue;

            $from = $msg['from'] ?? '';
            $body = strtoupper(trim($msg['text']['body'] ?? ''));

            if ($body === 'SI') {
                $this->procesarRespuestaWA($from, 'confirmar');
            } elseif ($body === 'CANCELAR') {
                $this->procesarRespuestaWA($from, 'cancelar');
            } else {
                $this->wa->enviar($from, 'No entendí tu respuesta. Contesta SI para confirmar tu cita o CANCELAR si no puedes asistir.');
            }
        }

        return response('', 200);
    }

    private function procesarRespuestaWA(string $telefono, string $accion): void
    {
        $limpio = User::normalizarTelefono($telefono);
        $user   = User::where('telefono', 'LIKE', "%{$limpio}%")->first();

        if (!$user) {
            $this->wa->enviar($telefono, 'No encontramos tu cita. Contacta a OpsDental directamente.');
            return;
        }

        $query = Cita::where('paciente_id', $user->paciente?->id)
            ->whereDate('fecha', '>=', now()->toDateString())
            ->orderBy('fecha');

        if ($accion === 'confirmar') {
            $cita = (clone $query)->where('estado', 'pendiente')->first();
            if ($cita) {
                $cita->update(['estado' => 'confirmada']);
                $this->wa->enviar($telefono, '¡Tu cita quedó confirmada! Te esperamos en OpsDental.');
            } else {
                $this->wa->enviar($telefono, 'No encontramos citas pendientes de confirmar.');
            }
        } else {
            $cita = (clone $query)->whereIn('estado', ['pendiente', 'confirmada'])->first();
            if ($cita) {
                $cita->cancelar();
                $this->wa->enviar($telefono, 'Cita cancelada. Puedes agendar otra cuando gustes en OpsDental.');
            } else {
                $this->wa->enviar($telefono, 'No encontramos citas activas para cancelar.');
            }
        }
    }
}
