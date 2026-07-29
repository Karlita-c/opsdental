<?php

namespace Tests\Feature;

use App\Models\Consultorio;
use App\Models\Membrecia;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanMembreciaTest extends TestCase
{
    use RefreshDatabase;

    private function crearConsultorioActivo(string $plan = 'basico'): array
    {
        $user = User::create([
            'name' => 'Dr. Plan', 'email' => 'plan@test.com',
            'password' => bcrypt('pass'), 'role' => 'consultorio',
        ]);

        $consultorio = Consultorio::create([
            'user_id' => $user->id, 'nombre' => 'Clínica Plan', 'direccion' => 'Calle',
            'ciudad' => 'CDMX', 'activo' => true,
        ]);

        $limites = ['basico' => 20, 'premium' => 100, 'pro' => 9999];

        Membrecia::create([
            'consultorio_id'   => $consultorio->id,
            'plan'             => $plan,
            'limite_citas_mes' => $limites[$plan],
            'fecha_inicio'     => Carbon::today(),
            'fecha_vencimiento'=> Carbon::today()->addYear(),
            'activa'           => true,
        ]);

        return ['user' => $user, 'consultorio' => $consultorio];
    }

    // ── CP01 — Consultorio puede consultar su plan actual ──────────────────────

    public function test_cp01_consultorio_puede_ver_su_plan(): void
    {
        ['user' => $user] = $this->crearConsultorioActivo('basico');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/consultorio/membrecia');

        $response->assertStatus(200)
            ->assertJsonFragment(['plan' => 'basico', 'limite_citas_mes' => 20]);
    }

    // ── CP02 — Cambiar a premium actualiza límite a 100 citas ─────────────────

    public function test_cp02_cambiar_a_premium_actualiza_limite(): void
    {
        ['user' => $user] = $this->crearConsultorioActivo('basico');

        $response = $this->actingAs($user, 'sanctum')
            ->putJson('/api/consultorio/membrecia/plan', ['plan' => 'premium']);

        $response->assertStatus(200)
            ->assertJsonFragment(['plan' => 'premium', 'limite_citas_mes' => 100]);

        $this->assertDatabaseHas('membrecias', ['plan' => 'premium', 'limite_citas_mes' => 100]);
    }

    // ── CP03 — Cambiar a pro actualiza límite a 9999 (ilimitado) ──────────────

    public function test_cp03_cambiar_a_pro_actualiza_limite(): void
    {
        ['user' => $user] = $this->crearConsultorioActivo('basico');

        $response = $this->actingAs($user, 'sanctum')
            ->putJson('/api/consultorio/membrecia/plan', ['plan' => 'pro']);

        $response->assertStatus(200)
            ->assertJsonFragment(['plan' => 'pro', 'limite_citas_mes' => 9999]);
    }

    // ── CP04 — Plan inválido es rechazado con 422 ─────────────────────────────

    public function test_cp04_plan_invalido_retorna_422(): void
    {
        ['user' => $user] = $this->crearConsultorioActivo('basico');

        $response = $this->actingAs($user, 'sanctum')
            ->putJson('/api/consultorio/membrecia/plan', ['plan' => 'ultra-vip']);

        $response->assertStatus(422);
    }

    // ── CP05 — La API de planes devuelve los tres planes disponibles ───────────

    public function test_cp05_endpoint_planes_devuelve_configuracion(): void
    {
        $response = $this->getJson('/api/membrecia/planes');

        $response->assertStatus(200)
            ->assertJsonStructure(['basico', 'premium', 'pro']);
    }

    // ── CP06 — Bajar de plan también funciona (downgrade) ─────────────────────

    public function test_cp06_bajar_a_basico_actualiza_limite(): void
    {
        ['user' => $user] = $this->crearConsultorioActivo('pro');

        $response = $this->actingAs($user, 'sanctum')
            ->putJson('/api/consultorio/membrecia/plan', ['plan' => 'basico']);

        $response->assertStatus(200)
            ->assertJsonFragment(['plan' => 'basico', 'limite_citas_mes' => 20]);
    }

    // ── CP07 — Consultorio inactivo no puede cambiar plan → 403 ──────────────

    public function test_cp07_consultorio_inactivo_no_puede_cambiar_plan(): void
    {
        $user = User::create([
            'name' => 'Dr. Pendiente', 'email' => 'pendiente@test.com',
            'password' => bcrypt('pass'), 'role' => 'consultorio',
        ]);

        $consultorio = Consultorio::create([
            'user_id' => $user->id, 'nombre' => 'Pendiente', 'direccion' => 'Calle',
            'ciudad' => 'CDMX', 'activo' => false,
        ]);

        Membrecia::create([
            'consultorio_id'   => $consultorio->id,
            'plan'             => 'basico',
            'limite_citas_mes' => 20,
            'fecha_inicio'     => Carbon::today(),
            'fecha_vencimiento'=> Carbon::today()->addYear(),
            'activa'           => false,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->putJson('/api/consultorio/membrecia/plan', ['plan' => 'premium']);

        $response->assertStatus(403)
            ->assertJsonFragment(['message' => 'Tu consultorio aún no ha sido validado. No puedes cambiar de plan hasta que el administrador active tu cuenta.']);

        // La membrecía no debe haber cambiado
        $this->assertDatabaseHas('membrecias', ['consultorio_id' => $consultorio->id, 'plan' => 'basico']);
    }
}
