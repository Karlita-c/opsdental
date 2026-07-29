<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Membrecia;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MembreciaController extends Controller
{
    const PLANES = [
        'basico'  => ['limite_citas_mes' => 20,   'dias_vigencia' => 365, 'precio' => 0,   'label' => 'Básico'],
        'premium' => ['limite_citas_mes' => 100,  'dias_vigencia' => 30,  'precio' => 299, 'label' => 'Premium'],
        'pro'     => ['limite_citas_mes' => 9999, 'dias_vigencia' => 30,  'precio' => 599, 'label' => 'Pro'],
    ];

    public function mi(Request $request): JsonResponse
    {
        $consultorio = $request->user()->consultorio;
        $membrecia   = Membrecia::where('consultorio_id', $consultorio->id)->firstOrFail();
        return response()->json($membrecia);
    }

    public function planes(): JsonResponse
    {
        return response()->json(self::PLANES);
    }

    public function cambiarPlan(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan' => 'required|in:basico,premium,pro',
        ]);

        $consultorio = $request->user()->consultorio;

        if (!$consultorio->activo) {
            return response()->json([
                'message' => 'Tu consultorio aún no ha sido validado. No puedes cambiar de plan hasta que el administrador active tu cuenta.',
            ], 403);
        }

        $membrecia = Membrecia::where('consultorio_id', $consultorio->id)->firstOrFail();
        $config      = self::PLANES[$data['plan']];

        $membrecia->update([
            'plan'              => $data['plan'],
            'limite_citas_mes'  => $config['limite_citas_mes'],
            'fecha_inicio'      => Carbon::today(),
            'fecha_vencimiento' => Carbon::today()->addDays($config['dias_vigencia']),
            'activa'            => true,
        ]);

        return response()->json($membrecia->fresh());
    }
}
