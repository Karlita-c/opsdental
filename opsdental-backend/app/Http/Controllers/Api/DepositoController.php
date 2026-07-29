<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Services\DepositoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DepositoController extends Controller
{
    public function __construct(private DepositoService $servicio) {}

    /** Paciente: solicitar link de pago del depósito para una cita */
    public function iniciarPago(Request $request, int $citaId): JsonResponse
    {
        $cita = Cita::with('tratamiento', 'consultorio')->findOrFail($citaId);

        abort_unless($cita->paciente_id === $request->user()->paciente->id, 403);

        if ($cita->deposito_estado === 'pagado') {
            return response()->json(['message' => 'El depósito ya está pagado.'], 422);
        }

        $monto = $cita->tratamiento->deposito_monto ?? 0;

        if ($monto <= 0) {
            return response()->json(['message' => 'Este tratamiento no requiere depósito.'], 422);
        }

        $preference = $this->servicio->crearPreference($cita, $monto);

        $cita->update([
            'deposito_monto'        => $monto,
            'deposito_estado'       => 'pendiente',
            'deposito_preference_id' => $preference['preference_id'],
        ]);

        return response()->json([
            'init_point'    => $preference['init_point'],
            'preference_id' => $preference['preference_id'],
            'monto'         => $monto,
        ]);
    }

    /** Webhook de Mercado Pago — confirmar pago recibido */
    public function webhook(Request $request): JsonResponse
    {
        $type      = $request->input('type');
        $paymentId = $request->input('data.id');

        if ($type !== 'payment' || !$paymentId) {
            return response()->json(['ok' => true]);
        }

        $pago = $this->servicio->verificarPago((string) $paymentId);

        if (!$pago || $pago['status'] !== 'approved') {
            return response()->json(['ok' => true]);
        }

        $citaId = (int) $pago['external_reference'];
        $cita   = Cita::find($citaId);

        if ($cita) {
            $cita->update([
                'deposito_estado'  => 'pagado',
                'deposito_pago_id' => (string) $paymentId,
            ]);

            Log::info("Depósito confirmado — cita #{$citaId}, pago #{$paymentId}");
        }

        return response()->json(['ok' => true]);
    }

    /** Consultorio: retener el depósito cuando hay no-show */
    public function retener(Request $request, int $citaId): JsonResponse
    {
        $cita = Cita::findOrFail($citaId);
        abort_unless($cita->consultorio_id === $request->user()->consultorio->id, 403);

        if ($cita->deposito_estado !== 'pagado') {
            return response()->json(['message' => 'No hay depósito pagado para retener.'], 422);
        }

        $cita->update(['deposito_estado' => 'retenido']);
        Log::info("Depósito retenido por no-show — cita #{$cita->id}");

        return response()->json(['message' => 'Depósito retenido. El paciente no se presentó.']);
    }

    /** Consultorio: devolver el depósito al paciente */
    public function devolver(Request $request, int $citaId): JsonResponse
    {
        $cita = Cita::findOrFail($citaId);
        abort_unless($cita->consultorio_id === $request->user()->consultorio->id, 403);

        if ($cita->deposito_estado !== 'pagado') {
            return response()->json(['message' => 'No hay depósito pagado para devolver.'], 422);
        }

        $ok = $this->servicio->devolverDeposito($cita);

        return $ok
            ? response()->json(['message' => 'Depósito devuelto al paciente.'])
            : response()->json(['message' => 'Error al procesar la devolución. Intenta de nuevo.'], 500);
    }
}
