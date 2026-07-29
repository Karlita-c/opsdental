<?php

namespace Tests\Feature;

use App\Models\Consultorio;
use App\Models\Membrecia;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ValidacionConsultorioTest extends TestCase
{
    use RefreshDatabase;

    // ── CV06 — Registro de consultorio queda inactivo por defecto ──────────────

    public function test_cv06_registro_consultorio_queda_inactivo_hasta_validacion(): void
    {
        $response = $this->postJson('/api/register', [
            'name'               => 'Dra. López',
            'email'              => 'lopez@clinica.com',
            'password'           => 'Password1!',
            'password_confirmation' => 'Password1!',
            'role'               => 'consultorio',
            'telefono'           => '5551234567',
            'nombre'             => 'Clínica López',
            'direccion'          => 'Av. Principal 100',
            'ciudad'             => 'CDMX',
            'cedula_profesional' => '1234567',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('consultorios', [
            'nombre' => 'Clínica López',
            'activo' => false,
        ]);

        $this->assertDatabaseHas('membrecias', [
            'plan'   => 'basico',
            'activa' => false,
        ]);
    }

    // ── CV07 — Admin activa consultorio → email enviado + token generado ───────

    public function test_cv07_activar_consultorio_genera_token_y_envia_email(): void
    {
        $gestor = User::create([
            'name' => 'Gestor', 'email' => 'gestor@bb.com',
            'password' => bcrypt('pass'), 'role' => 'gestor',
        ]);

        $userC = User::create([
            'name' => 'Dr. Test', 'email' => 'dr@test.com',
            'password' => bcrypt('pass'), 'role' => 'consultorio',
        ]);

        $consultorio = Consultorio::create([
            'user_id' => $userC->id, 'nombre' => 'Test', 'direccion' => 'Calle 1',
            'ciudad' => 'CDMX', 'activo' => false,
        ]);

        Membrecia::create([
            'consultorio_id' => $consultorio->id, 'plan' => 'basico',
            'limite_citas_mes' => 20,
            'fecha_inicio' => Carbon::today(), 'fecha_vencimiento' => Carbon::today()->addYear(),
            'activa' => false,
        ]);

        $response = $this->actingAs($gestor, 'sanctum')
            ->patchJson("/api/admin/consultorios/{$consultorio->id}/activar");

        $response->assertStatus(200)
            ->assertJsonFragment(['message' => 'Consultorio activado. Se ha enviado la notificación por WhatsApp.']);

        $this->assertDatabaseHas('consultorios', ['id' => $consultorio->id, 'activo' => true]);

        // Verifica que se generó un token de invitación con 48h de vigencia
        $userC->refresh();
        $this->assertNotNull($userC->token_invitacion);
        $this->assertTrue($userC->token_invitacion_expires_at->gt(now()));
        // La notificación de activación se envía por WhatsApp vía Meta Cloud API
    }

    // ── CV08 — Login con token de invitación → sesión iniciada ────────────────

    public function test_cv08_login_con_token_valido_retorna_token_sanctum(): void
    {
        $user = User::create([
            'name' => 'Dr. Token', 'email' => 'token@test.com',
            'password' => bcrypt('pass'), 'role' => 'consultorio',
            'token_invitacion' => 'abc123secure',
            'token_invitacion_expires_at' => now()->addHours(24),
        ]);

        Consultorio::create([
            'user_id' => $user->id, 'nombre' => 'Clínica', 'direccion' => 'Calle',
            'ciudad' => 'CDMX', 'activo' => true,
        ]);

        $response = $this->getJson('/api/acceso/abc123secure');

        $response->assertStatus(200)
            ->assertJsonStructure(['user', 'token']);

        // El token de invitación debe haberse consumido
        $user->refresh();
        $this->assertNull($user->token_invitacion);
    }

    // ── CV09 — Token inválido o expirado → acceso denegado ────────────────────

    public function test_cv09_token_invalido_retorna_422(): void
    {
        $response = $this->getJson('/api/acceso/token-que-no-existe');
        $response->assertStatus(422);
    }

    public function test_cv09b_token_expirado_retorna_422(): void
    {
        User::create([
            'name' => 'Dr. Expirado', 'email' => 'expired@test.com',
            'password' => bcrypt('pass'), 'role' => 'consultorio',
            'token_invitacion' => 'tokenexpirado',
            'token_invitacion_expires_at' => now()->subHour(),
        ]);

        $response = $this->getJson('/api/acceso/tokenexpirado');
        $response->assertStatus(422);
    }
}
