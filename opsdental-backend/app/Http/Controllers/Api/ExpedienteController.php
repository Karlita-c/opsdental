<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\ExpedienteRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpedienteController extends Controller
{
    public function __construct(private ExpedienteRepository $repo) {}

    public function index(Request $request, int $pacienteId): JsonResponse
    {
        $consultorioId = $request->user()->consultorio->id;
        $expedientes   = $this->repo->porPaciente($consultorioId, $pacienteId);
        return response()->json($expedientes);
    }

    public function store(Request $request, int $pacienteId): JsonResponse
    {
        $data = $request->validate([
            'fecha_visita'          => 'required|date',
            'diagnostico'           => 'required|string|max:2000',
            'tratamiento_realizado' => 'required|string|max:2000',
            'observaciones'         => 'nullable|string|max:2000',
            'archivos'              => 'nullable|array',
            'archivos.*'            => 'nullable|string|url',
        ]);

        $data['consultorio_id'] = $request->user()->consultorio->id;
        $data['paciente_id']    = $pacienteId;

        $expediente = $this->repo->create($data);
        return response()->json($expediente, 201);
    }

    public function show(Request $request, int $pacienteId, int $id): JsonResponse
    {
        $consultorioId = $request->user()->consultorio->id;
        $expediente    = $this->repo->buscar($id, $consultorioId);
        abort_if(!$expediente || $expediente->paciente_id !== $pacienteId, 404);
        return response()->json($expediente);
    }

    public function update(Request $request, int $pacienteId, int $id): JsonResponse
    {
        $consultorioId = $request->user()->consultorio->id;
        $expediente    = $this->repo->buscar($id, $consultorioId);
        abort_if(!$expediente || $expediente->paciente_id !== $pacienteId, 404);

        $data = $request->validate([
            'fecha_visita'          => 'sometimes|date',
            'diagnostico'           => 'sometimes|string|max:2000',
            'tratamiento_realizado' => 'sometimes|string|max:2000',
            'observaciones'         => 'nullable|string|max:2000',
            'archivos'              => 'nullable|array',
            'archivos.*'            => 'nullable|string|url',
        ]);

        return response()->json($this->repo->actualizar($expediente, $data));
    }
}
