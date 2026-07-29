<?php

namespace App\Services;

use App\Models\Cita;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DepositoService
{
    private string $accessToken;
    private string $publicKey;

    public function __construct()
    {
        $this->accessToken = env('MERCADOPAGO_ACCESS_TOKEN', '');
        $this->publicKey   = env('MERCADOPAGO_PUBLIC_KEY', '');
    }

    /**
     * Crea una preference de pago en Mercado Pago para el depósito de la cita.
     * Devuelve la URL de pago y el preference_id.
     */
    public function crearPreference(Cita $cita, float $monto): array
    {
        if (empty($this->accessToken)) {
            Log::info('MercadoPago: ACCESS_TOKEN no configurado — modo simulación', [
                'cita_id' => $cita->id,
                'monto'   => $monto,
            ]);
            return [
                'preference_id' => 'simulado-' . $cita->id,
                'init_point'    => env('FRONTEND_URL', 'http://localhost:3000') . '/pago/simulado/' . $cita->id,
            ];
        }

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');

        $response = Http::withToken($this->accessToken)
            ->post('https://api.mercadopago.com/checkout/preferences', [
                'items' => [[
                    'title'      => 'Depósito reserva — OpsDental',
                    'quantity'   => 1,
                    'unit_price' => $monto,
                    'currency_id' => 'MXN',
                ]],
                'back_urls' => [
                    'success' => "{$frontendUrl}/pago/exitoso?cita={$cita->id}",
                    'failure' => "{$frontendUrl}/pago/fallido?cita={$cita->id}",
                    'pending' => "{$frontendUrl}/pago/pendiente?cita={$cita->id}",
                ],
                'auto_return'       => 'approved',
                'external_reference' => (string) $cita->id,
                'notification_url'  => env('APP_URL', 'http://localhost') . '/api/deposito/webhook',
            ]);

        if ($response->failed()) {
            Log::error('MercadoPago: error al crear preference', [
                'status' => $response->status(),
                'body'   => $response->json(),
            ]);
            throw new \RuntimeException('No se pudo crear el pago. Intenta de nuevo.');
        }

        return [
            'preference_id' => $response->json('id'),
            'init_point'    => $response->json('init_point'),
        ];
    }

    /**
     * Verifica el pago y actualiza el estado del depósito en la cita.
     */
    public function verificarPago(string $paymentId): ?array
    {
        if (empty($this->accessToken) || str_starts_with($paymentId, 'simulado')) {
            return ['status' => 'approved', 'external_reference' => str_replace('simulado-', '', $paymentId)];
        }

        $response = Http::withToken($this->accessToken)
            ->get("https://api.mercadopago.com/v1/payments/{$paymentId}");

        if ($response->failed()) {
            return null;
        }

        return [
            'status'             => $response->json('status'),
            'external_reference' => $response->json('external_reference'),
        ];
    }

    /**
     * Devuelve el depósito al paciente si el consultorio cancela con suficiente anticipación.
     */
    public function devolverDeposito(Cita $cita): bool
    {
        if (empty($this->accessToken) || empty($cita->deposito_pago_id)) {
            Log::info('Devolución depósito (simulada)', ['cita_id' => $cita->id]);
            $cita->update(['deposito_estado' => 'devuelto']);
            return true;
        }

        $response = Http::withToken($this->accessToken)
            ->post("https://api.mercadopago.com/v1/payments/{$cita->deposito_pago_id}/refunds");

        if ($response->successful()) {
            $cita->update(['deposito_estado' => 'devuelto']);
            return true;
        }

        Log::error('MercadoPago: error al devolver depósito', ['cita_id' => $cita->id]);
        return false;
    }
}
