<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultorio;
use App\Models\Membrecia;
use App\Models\Paciente;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'               => 'required|string|max:255',
            'email'              => 'required|email|unique:users',
            'password'           => 'required|string|min:8|confirmed',
            'role'               => 'required|in:paciente,consultorio',
            'telefono'           => 'required_if:role,consultorio|nullable|string|max:20',
            'nombre'             => 'required_if:role,consultorio|string|max:255',
            'direccion'          => 'required_if:role,consultorio|string|max:500',
            'ciudad'             => 'required_if:role,consultorio|string|max:100',
            'cedula_profesional' => 'required_if:role,consultorio|string|min:7|max:20',
        ]);

        if ($data['role'] === 'paciente') {
            return response()->json([
                'message' => 'Los pacientes acceden mediante el enlace de invitación que les comparte su consultorio.',
            ], 403);
        }

        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'password' => Hash::make($data['password']),
                'role'     => $data['role'],
                'telefono' => $data['telefono'] ?? null,
            ]);

            if ($user->role === 'consultorio') {
                $consultorio = Consultorio::create([
                    'user_id'            => $user->id,
                    'nombre'             => $data['nombre'],
                    'direccion'          => $data['direccion'],
                    'ciudad'             => $data['ciudad'],
                    'telefono'           => $data['telefono'] ?? null,
                    'cedula_profesional' => $data['cedula_profesional'],
                    // Inicia inactivo — el gestor debe verificar y activar el consultorio
                    'activo'             => false,
                ]);

                Membrecia::create([
                    'consultorio_id'    => $consultorio->id,
                    'plan'              => 'basico',
                    'limite_citas_mes'  => 20,
                    'fecha_inicio'      => Carbon::today(),
                    'fecha_vencimiento' => Carbon::today()->addYear(),
                    'activa'            => false,
                ]);
            } else {
                Paciente::create(['user_id' => $user->id]);
            }

            return $user;
        });

        $token = $user->createToken('opsdental')->plainTextToken;

        return response()->json([
            'user'  => $user->load($this->relaciones($user->role)),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => ['Credenciales incorrectas.']]);
        }

        $token = $user->createToken('opsdental')->plainTextToken;

        return response()->json([
            'user'  => $user->load($this->relaciones($user->role)),
            'token' => $token,
        ]);
    }

    public function loginConToken(string $token): JsonResponse
    {
        $user = User::where('token_invitacion', $token)
            ->whereNotNull('token_invitacion_expires_at')
            ->where('token_invitacion_expires_at', '>', now())
            ->first();

        if (!$user) {
            return response()->json(['message' => 'Enlace inválido o expirado.'], 422);
        }

        // Consume el token — solo puede usarse una vez
        $user->update([
            'token_invitacion'            => null,
            'token_invitacion_expires_at' => null,
        ]);

        $sanctumToken = $user->createToken('opsdental-invitacion')->plainTextToken;

        return response()->json([
            'user'  => $user->load($this->relaciones($user->role)),
            'token' => $sanctumToken,
        ]);
    }

    public function actualizarPerfil(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name'                 => 'sometimes|string|max:255',
            'telefono'             => 'sometimes|nullable|string|max:20',
            'password'             => 'sometimes|string|min:8|confirmed',
            'current_password'     => 'required_with:password|string',
        ]);

        if (isset($data['password'])) {
            if (!Hash::check($data['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['La contraseña actual es incorrecta.'],
                ]);
            }
            $data['password'] = Hash::make($data['password']);
        }

        unset($data['current_password']);
        $user->update($data);

        return response()->json($user->load($this->relaciones($user->role)));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json($user->load($this->relaciones($user->role)));
    }

    /** Devuelve las relaciones a cargar según el rol del usuario. */
    private function relaciones(string $role): array
    {
        return match ($role) {
            'consultorio' => ['consultorio.membrecia'],
            'paciente'    => ['paciente.consultorio'],
            default       => [],
        };
    }
}
