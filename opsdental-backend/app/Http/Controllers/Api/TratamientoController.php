<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\TratamientoRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TratamientoController extends Controller
{
    public function __construct(private TratamientoRepository $repo) {}

    public function index(Request $request): JsonResponse
    {
        $consultorioId = $request->user()->consultorio->id;
        return response()->json($this->repo->porConsultorio($consultorioId, false));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre'           => 'required|string|max:255',
            'duracion_minutos' => 'required|integer|min:10|max:480',
            'precio'           => 'required|numeric|min:0',
            'descripcion'      => 'nullable|string',
        ]);

        $tratamiento = $this->repo->create([
            ...$data,
            'consultorio_id' => $request->user()->consultorio->id,
        ]);

        return response()->json($tratamiento, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $consultorioId = $request->user()->consultorio->id;
        $tratamiento   = $this->repo->find($id);
        abort_unless($tratamiento && $tratamiento->consultorio_id === $consultorioId, 404);

        $data = $request->validate([
            'nombre'           => 'sometimes|string|max:255',
            'duracion_minutos' => 'sometimes|integer|min:10|max:480',
            'precio'           => 'sometimes|numeric|min:0',
            'descripcion'      => 'nullable|string',
            'activo'           => 'sometimes|boolean',
        ]);

        return response()->json($this->repo->update($id, $data));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $consultorioId = $request->user()->consultorio->id;
        $tratamiento   = $this->repo->find($id);
        abort_unless($tratamiento && $tratamiento->consultorio_id === $consultorioId, 404);

        $this->repo->delete($id);
        return response()->json(null, 204);
    }
}
