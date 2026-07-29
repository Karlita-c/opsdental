<?php

namespace App\Services;

use App\Models\Cita;
use App\Models\GoogleToken;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService
{
    private string $clientId;
    private string $clientSecret;
    private string $redirectUri;
    private string $calendarApiBase = 'https://www.googleapis.com/calendar/v3';

    public function __construct()
    {
        $this->clientId     = config('services.google.client_id');
        $this->clientSecret = config('services.google.client_secret');
        $this->redirectUri  = config('services.google.redirect');
    }

    public function urlAutorizacion(): string
    {
        $params = http_build_query([
            'client_id'     => $this->clientId,
            'redirect_uri'  => $this->redirectUri,
            'response_type' => 'code',
            'scope'         => 'https://www.googleapis.com/auth/calendar.events',
            'access_type'   => 'offline',
            'prompt'        => 'consent',
        ]);
        return "https://accounts.google.com/o/oauth2/v2/auth?{$params}";
    }

    public function intercambiarCodigo(string $code, User $user): void
    {
        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'code'          => $code,
            'client_id'     => $this->clientId,
            'client_secret' => $this->clientSecret,
            'redirect_uri'  => $this->redirectUri,
            'grant_type'    => 'authorization_code',
        ]);

        $data = $response->json();

        GoogleToken::updateOrCreate(
            ['user_id' => $user->id],
            [
                'access_token'  => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'expires_at'    => now()->addSeconds($data['expires_in'] ?? 3600),
            ]
        );
    }

    public function refrescarToken(GoogleToken $token): void
    {
        if (!$token->refresh_token) return;

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id'     => $this->clientId,
            'client_secret' => $this->clientSecret,
            'refresh_token' => $token->refresh_token,
            'grant_type'    => 'refresh_token',
        ]);

        $data = $response->json();
        $token->update([
            'access_token' => $data['access_token'],
            'expires_at'   => now()->addSeconds($data['expires_in'] ?? 3600),
        ]);
    }

    public function crearEventoCita(Cita $cita): ?string
    {
        $token = GoogleToken::where('user_id', $cita->consultorio->user_id)->first();
        if (!$token) return null;

        if ($token->estaExpirado()) {
            $this->refrescarToken($token);
            $token->refresh();
        }

        $fechaInicio = $cita->fecha->toDateString() . 'T' . $cita->hora_inicio . ':00';
        $fechaFin    = $cita->fecha->toDateString() . 'T' . $cita->hora_fin . ':00';
        $timeZone    = 'America/Mexico_City';

        $body = [
            'summary'     => "Cita: {$cita->paciente->user->name}",
            'description' => "Tratamiento: {$cita->tratamiento->nombre}\nOpsDental",
            'start'       => ['dateTime' => $fechaInicio, 'timeZone' => $timeZone],
            'end'         => ['dateTime' => $fechaFin,    'timeZone' => $timeZone],
            'attendees'   => [['email' => $cita->paciente->user->email]],
        ];

        $response = Http::withToken($token->access_token)
            ->post("{$this->calendarApiBase}/calendars/primary/events", $body);

        if ($response->failed()) {
            Log::error('Google Calendar error al crear evento', [
                'cita_id' => $cita->id,
                'status'  => $response->status(),
                'body'    => $response->body(),
            ]);
            return null;
        }

        return $response->json('id');
    }

    public function eliminarEventoCita(Cita $cita): void
    {
        if (!$cita->google_event_id_consultorio) return;

        $token = GoogleToken::where('user_id', $cita->consultorio->user_id)->first();
        if (!$token) return;

        if ($token->estaExpirado()) {
            $this->refrescarToken($token);
            $token->refresh();
        }

        Http::withToken($token->access_token)
            ->delete("{$this->calendarApiBase}/calendars/primary/events/{$cita->google_event_id_consultorio}");
    }
}
