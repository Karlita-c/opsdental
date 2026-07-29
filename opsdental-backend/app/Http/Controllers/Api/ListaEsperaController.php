<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\ListaEsperaRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ListaEsperaController extends Controller
{
    public function __construct(private ListaEsperaRepository $repo) {}

    /** Paciente: unirse a la lista de espera de un consultorio */
    public function unirse(Request $request): JsonResponse
    {
        $data = $request->validate([
            'consultorio_id'  => 'required|exists:consultorios,id',
            'tratamiento_id'  => 'nullable|exists:tratamientos,id',
            'fecha_preferida' => 'nullable|date|after_or_equal:today',
            'notas'           => 'nullable|string|max:300',
        ]);

        $pacienteId = $request->user()->paciente->id;

        if ($this->repo->yaEnCola((int) $data['consultorio_id'], $pacienteId, $data['tratamiento_id'] ?? null)) {
            return response()->json(['message' => 'Ya estás en la lista de espera para este consultorio.'], 422);
        }

        $posicion = $this->repo->proximaPosicion((int) $data['consultorio_id']);

        $entrada = $this->repo->create([
            ...$data,
            'paciente_id' => $pacienteId,
            'posicion'    => $posicion,
            'estado'      => 'en_espera',
        ]);

        return response()->json([
            'message'  => "Estás en la posición #{$posicion} de la lista de espera.",
            'entrada'  => $entrada->load('consultorio', 'tratamiento'),
        ], 201);
    }

    /** Paciente: ver su posición en la lista */
    public function miPosicion(Request $request): JsonResponse
    {
        $lista = $this->repo->porPaciente($request->user()->paciente->id);
        return response()->json($lista);
    }

    /** Paciente: salir de la lista de espera */
    public function salir(Request $request, int $id): JsonResponse
    {
        $pacienteId = $request->user()->paciente->id;
        $entrada    = \App\Models\ListaEspera::findOrFail($id);

        abort_unless($entrada->paciente_id === $pacienteId, 403);

        $entrada->update(['estado' => 'cancelado']);
        return response()->json(['message' => 'Saliste de la lista de espera.']);
    }

    /** Consultorio: ver su lista de espera completa */
    public function lista(Request $request): JsonResponse
    {
        $consultorioId = $request->user()->consultorio->id;
        return response()->json($this->repo->porConsultorio($consultorioId));
    }
}
