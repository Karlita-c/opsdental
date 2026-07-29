<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GoogleToken;
use App\Services\GoogleCalendarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoogleCalendarController extends Controller
{
    public function __construct(private GoogleCalendarService $service) {}

    public function redirigir(Request $request): JsonResponse
    {
        return response()->json(['url' => $this->service->urlAutorizacion()]);
    }

    public function callback(Request $request): JsonResponse
    {
        $code = $request->query('code');
        abort_if(!$code, 422, 'Código de autorización no recibido.');

        $this->service->intercambiarCodigo($code, $request->user());

        return response()->json(['mensaje' => 'Google Calendar conectado correctamente.']);
    }

    public function estado(Request $request): JsonResponse
    {
        $token = GoogleToken::where('user_id', $request->user()->id)->first();
        return response()->json([
            'conectado' => (bool) $token,
            'expira_en' => $token?->expires_at,
        ]);
    }

    public function desconectar(Request $request): JsonResponse
    {
        GoogleToken::where('user_id', $request->user()->id)->delete();
        return response()->json(['mensaje' => 'Google Calendar desconectado.']);
    }
}
