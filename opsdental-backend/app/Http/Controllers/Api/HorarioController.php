<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\HorarioRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class HorarioController extends Controller
{
    public function __construct(private HorarioRepository $repo) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->repo->porConsultorio($request->user()->consultorio->id));
    }

    public function store(Request $request): JsonResponse
    {
        $consultorioId = $request->user()->consultorio->id;

        $data = $request->validate([
            'dia_semana'  => 'required|in:lunes,martes,miercoles,jueves,viernes,sabado,domingo',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin'    => 'required|date_format:H:i|after:hora_inicio',
        ]);

        $existe = $this->repo->porConsultorio($consultorioId)
            ->firstWhere('dia_semana', $data['dia_semana']);

        if ($existe) {
            return response()->json([
                'message' => 'Ya existe un horario para ese día. Edítalo en lugar de crear uno nuevo.',
                'errors'  => ['dia_semana' => ['Día ya registrado.']],
            ], 422);
        }

        $horario = $this->repo->create([...$data, 'consultorio_id' => $consultorioId, 'activo' => true]);

        // Limpiar caché de disponibilidad del consultorio al agregar un horario
        Cache::tags(["disp:{$consultorioId}"])->flush();

        return response()->json($horario, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $consultorioId = $request->user()->consultorio->id;
        $horario       = $this->repo->find($id);
        abort_unless($horario && $horario->consultorio_id === $consultorioId, 404);

        $data = $request->validate([
            'hora_inicio' => 'sometimes|date_format:H:i',
            'hora_fin'    => 'sometimes|date_format:H:i|after:hora_inicio',
            'activo'      => 'sometimes|boolean',
        ]);

        $actualizado = $this->repo->update($id, $data);

        // Limpiar caché: cambiar horas o estado afecta los slots disponibles
        Cache::tags(["disp:{$consultorioId}"])->flush();

        return response()->json($actualizado);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $consultorioId = $request->user()->consultorio->id;
        $horario       = $this->repo->find($id);
        abort_unless($horario && $horario->consultorio_id === $consultorioId, 404);

        $this->repo->delete($id);

        // Limpiar caché: eliminar un horario invalida toda disponibilidad de ese día
        Cache::tags(["disp:{$consultorioId}"])->flush();

        return response()->json(null, 204);
    }
}
