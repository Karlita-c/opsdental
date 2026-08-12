<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\ConsultorioRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsultorioController extends Controller
{
    public function __construct(private ConsultorioRepository $repo) {}

    public function index(Request $request): JsonResponse
    {
        $ciudad = $request->query('ciudad', '');

        if ($ciudad) {
            $lista = $this->repo->porCiudad($ciudad);
        } else {
            $lista = $this->repo->activos(['membrecia'])
                ->load([
                    'tratamientos' => fn($q) => $q->where('activo', true),
                    'horarios'     => fn($q) => $q->where('activo', true),
                    // Solo traer calificación para mostrar promedio (sin datos personales)
                    'citas'        => fn($q) => $q->select('id','consultorio_id','calificacion')
                                                   ->whereNotNull('calificacion'),
                ]);
        }

        return response()->json($lista);
    }

    public function show(int $id): JsonResponse
    {
        $consultorio = $this->repo->find($id, ['tratamientos', 'horarios', 'membrecia']);
        abort_unless($consultorio && $consultorio->activo, 404);
        return response()->json($consultorio);
    }

    public function miConsultorio(Request $request): JsonResponse
    {
        $consultorioId = $request->user()->paciente?->consultorio_id;

        if (!$consultorioId) {
            return response()->json(['message' => 'No tienes un consultorio asignado.'], 404);
        }

        $consultorio = $this->repo->find($consultorioId, ['tratamientos', 'horarios', 'membrecia']);
        abort_unless($consultorio && $consultorio->activo, 404);

        return response()->json($consultorio);
    }

    public function update(Request $request): JsonResponse
    {
        $consultorio = $request->user()->consultorio;
        abort_unless($consultorio, 404);

        $data = $request->validate([
            'nombre'             => 'sometimes|string|max:255',
            'direccion'          => 'sometimes|string',
            'ciudad'             => 'sometimes|string|max:100',
            'telefono'           => 'sometimes|nullable|string|max:20',
            'descripcion'        => 'nullable|string',
            'cedula_profesional' => 'sometimes|nullable|string|max:20',
        ]);

        $consultorio->update($data);
        return response()->json($consultorio->fresh(['tratamientos', 'horarios', 'membrecia']));
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $consultorio = $request->user()->consultorio;
        abort_unless($consultorio, 404);

        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,webp|max:2048',
        ]);

        $result = cloudinary()->upload($request->file('logo')->getRealPath(), [
            'folder'        => 'opsdental/logos',
            'public_id'     => "consultorio_{$consultorio->id}",
            'overwrite'     => true,
            'resource_type' => 'image',
        ]);

        $url = $result->getSecurePath();
        $consultorio->update(['foto' => $url]);

        return response()->json(['foto' => $url]);
    }
}
