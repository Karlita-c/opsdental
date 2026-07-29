<?php

namespace Tests\Feature;

use App\Models\Consultorio;
use App\Models\Horario;
use App\Models\Membrecia;
use App\Models\Paciente;
use App\Models\Tratamiento;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class CitaTest extends TestCase
{
    use RefreshDatabase;

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function crearConsultorio(bool $membreciaVigente = true): array
    {
        $userC = User::create([
            'name'     => 'Clínica Test',
            'email'    => 'clinica@test.com',
            'password' => bcrypt('pass'),
            'role'     => 'consultorio',
        ]);

        $consultorio = Consultorio::create([
            'user_id'   => $userC->id,
            'nombre'    => 'Clínica Test',
            'direccion' => 'Calle Principal 1',
            'ciudad'    => 'CDMX',
            'activo'    => true,
        ]);

        Membrecia::create([
            'consultorio_id'   => $consultorio->id,
            'plan'             => 'basico',
            'limite_citas_mes' => 20,
            'fecha_inicio'     => Carbon::yesterday(),
            'fecha_vencimiento'=> $membreciaVigente ? Carbon::now()->addMonth() : Carbon::yesterday(),
            'activa'           => $membreciaVigente,
        ]);

        // Siempre usar el próximo lunes para garantizar una fecha futura
        $fechaLunes = Carbon::now()->next(Carbon::MONDAY)->format('Y-m-d');

        Horario::create([
            'consultorio_id' => $consultorio->id,
            'dia_semana'     => 'lunes',
            'hora_inicio'    => '09:00',
            'hora_fin'       => '17:00',
            'activo'         => true,
        ]);

        return ['consultorio' => $consultorio, 'fecha' => $fechaLunes];
    }

    private function crearPaciente(): User
    {
        $userP = User::create([
            'name'     => 'Paciente Test',
            'email'    => 'pac@test.com',
            'password' => bcrypt('pass'),
            'role'     => 'paciente',
        ]);

        Paciente::create(['user_id' => $userP->id]);

        return $userP;
    }

    // ── CV01 — Disponibilidad respeta duración del tratamiento ─────────────────

    public function test_cv01_slots_de_30min_y_45min_difieren_en_cantidad_y_duracion(): void
    {
        ['consultorio' => $c, 'fecha' => $fecha] = $this->crearConsultorio();

        $limpieza = Tratamiento::create([
            'consultorio_id'   => $c->id,
            'nombre'           => 'Limpieza',
            'duracion_minutos' => 30,
            'precio'           => 500.00,
            'activo'           => true,
        ]);

        $extraccion = Tratamiento::create([
            'consultorio_id'   => $c->id,
            'nombre'           => 'Extracción',
            'duracion_minutos' => 45,
            'precio'           => 800.00,
            'activo'           => true,
        ]);

        $r30 = $this->getJson("/api/disponibilidad?consultorio_id={$c->id}&tratamiento_id={$limpieza->id}&fecha={$fecha}");
        $r45 = $this->getJson("/api/disponibilidad?consultorio_id={$c->id}&tratamiento_id={$extraccion->id}&fecha={$fecha}");

        $r30->assertStatus(200);
        $r45->assertStatus(200);

        $slots30 = $r30->json('slots');
        $slots45 = $r45->json('slots');

        // El tratamiento de 30 min genera más slots que el de 45 min en el mismo rango horario
        $this->assertGreaterThan(count($slots45), count($slots30));

        // Ambos empiezan a la misma hora
        $this->assertEquals('09:00', $slots30[0]['hora_inicio']);
        $this->assertEquals('09:00', $slots45[0]['hora_inicio']);

        // El primer slot de limpieza termina a los 30 min
        $this->assertEquals('09:30', $slots30[0]['hora_fin']);

        // El primer slot de extracción termina a los 45 min
        $this->assertEquals('09:45', $slots45[0]['hora_fin']);

        // Todos los slots disponibles al no haber citas
        foreach ($slots30 as $slot) {
            $this->assertTrue($slot['disponible'], "Slot {$slot['hora_inicio']} debería estar disponible");
        }
    }

    // ── CV02 — Agendar cita exitosa → HTTP 201 ─────────────────────────────────

    public function test_cv02_agendar_cita_exitosa_retorna_201(): void
    {
        ['consultorio' => $c, 'fecha' => $fecha] = $this->crearConsultorio();
        $userP = $this->crearPaciente();

        $tratamiento = Tratamiento::create([
            'consultorio_id'   => $c->id,
            'nombre'           => 'Limpieza',
            'duracion_minutos' => 30,
            'precio'           => 500.00,
            'activo'           => true,
        ]);

        $response = $this->actingAs($userP, 'sanctum')
            ->postJson('/api/citas', [
                'consultorio_id' => $c->id,
                'tratamiento_id' => $tratamiento->id,
                'fecha'          => $fecha,
                'hora_inicio'    => '09:00',
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['estado' => 'pendiente'])
            ->assertJsonFragment(['hora_inicio' => '09:00'])
            ->assertJsonFragment(['hora_fin'    => '09:30']);

        // Verificar en base de datos (usando el modelo para normalizar el formato de fecha)
        $cita = \App\Models\Cita::where('consultorio_id', $c->id)
            ->where('tratamiento_id', $tratamiento->id)
            ->where('estado', 'pendiente')
            ->first();

        $this->assertNotNull($cita, 'La cita no fue creada en la base de datos');
        $this->assertEquals($fecha, $cita->fecha->format('Y-m-d'));
    }

    // ── CV03 — Conflicto de horarios → HTTP 422 ────────────────────────────────

    public function test_cv03_cita_solapada_es_rechazada_con_422(): void
    {
        ['consultorio' => $c, 'fecha' => $fecha] = $this->crearConsultorio();
        $userP = $this->crearPaciente();

        $tratamiento = Tratamiento::create([
            'consultorio_id'   => $c->id,
            'nombre'           => 'Limpieza',
            'duracion_minutos' => 30,
            'precio'           => 500.00,
            'activo'           => true,
        ]);

        // Primera cita: 09:00–09:30
        $this->actingAs($userP, 'sanctum')
            ->postJson('/api/citas', [
                'consultorio_id' => $c->id,
                'tratamiento_id' => $tratamiento->id,
                'fecha'          => $fecha,
                'hora_inicio'    => '09:00',
            ])
            ->assertStatus(201);

        // Segunda cita: 09:15–09:45 se solapa con la primera (09:00–09:30)
        $response = $this->actingAs($userP, 'sanctum')
            ->postJson('/api/citas', [
                'consultorio_id' => $c->id,
                'tratamiento_id' => $tratamiento->id,
                'fecha'          => $fecha,
                'hora_inicio'    => '09:15',
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'El horario ya está ocupado. Elige otro disponible.']);

        // Solo existe una cita en la base de datos
        $this->assertDatabaseCount('citas', 1);
    }

    // ── CV04 — Cancelar cita actualiza estado y limpia caché ───────────────────

    public function test_cv04_cancelar_cita_cambia_estado_y_limpia_cache(): void
    {
        ['consultorio' => $c, 'fecha' => $fecha] = $this->crearConsultorio();
        $userP = $this->crearPaciente();

        $tratamiento = Tratamiento::create([
            'consultorio_id'   => $c->id,
            'nombre'           => 'Limpieza',
            'duracion_minutos' => 30,
            'precio'           => 500.00,
            'activo'           => true,
        ]);

        // Crear la cita
        $cita = $this->actingAs($userP, 'sanctum')
            ->postJson('/api/citas', [
                'consultorio_id' => $c->id,
                'tratamiento_id' => $tratamiento->id,
                'fecha'          => $fecha,
                'hora_inicio'    => '09:00',
            ])
            ->json();

        // Simular entrada en caché de disponibilidad (usa tags igual que el controlador)
        $cacheTag = "disp:{$c->id}";
        $cacheKey = "disp:{$c->id}:{$tratamiento->id}:{$fecha}";
        Cache::tags([$cacheTag])->put($cacheKey, ['slots' => [['hora_inicio' => '09:00', 'disponible' => false]]], 300);
        $this->assertTrue(Cache::tags([$cacheTag])->has($cacheKey));

        // Cancelar la cita
        $this->actingAs($userP, 'sanctum')
            ->patchJson("/api/citas/{$cita['id']}/cancelar")
            ->assertStatus(200)
            ->assertJsonFragment(['message' => 'Cita cancelada correctamente.']);

        // Estado actualizado en base de datos
        $this->assertDatabaseHas('citas', [
            'id'     => $cita['id'],
            'estado' => 'cancelada',
        ]);

        // Caché de disponibilidad limpiada para que pacientes vean el espacio libre
        $this->assertFalse(Cache::tags([$cacheTag])->has($cacheKey));
    }

    // ── CV05 — Membrecía vencida bloquea agendamiento → HTTP 422 ───────────────

    public function test_cv05_membrecia_vencida_bloquea_agendamiento(): void
    {
        ['consultorio' => $c, 'fecha' => $fecha] = $this->crearConsultorio(membreciaVigente: false);
        $userP = $this->crearPaciente();

        $tratamiento = Tratamiento::create([
            'consultorio_id'   => $c->id,
            'nombre'           => 'Limpieza',
            'duracion_minutos' => 30,
            'precio'           => 500.00,
            'activo'           => true,
        ]);

        $response = $this->actingAs($userP, 'sanctum')
            ->postJson('/api/citas', [
                'consultorio_id' => $c->id,
                'tratamiento_id' => $tratamiento->id,
                'fecha'          => $fecha,
                'hora_inicio'    => '09:00',
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Este consultorio no puede recibir citas en este momento (membrecía inactiva).',
            ]);

        // No se creó ninguna cita
        $this->assertDatabaseCount('citas', 0);
    }

    // ── CV06 — Límite mensual plan básico bloquea nueva cita → HTTP 422 ──────

    public function test_cv06_limite_mensual_bloquea_cita_al_alcanzar_cupo(): void
    {
        $userC = User::create([
            'name'     => 'Clínica Límite',
            'email'    => 'limite@test.com',
            'password' => bcrypt('pass'),
            'role'     => 'consultorio',
        ]);

        $consultorio = Consultorio::create([
            'user_id'   => $userC->id,
            'nombre'    => 'Clínica Límite',
            'direccion' => 'Calle Test 1',
            'ciudad'    => 'CDMX',
            'activo'    => true,
        ]);

        // Límite de 1 cita/mes para facilitar la prueba
        Membrecia::create([
            'consultorio_id'   => $consultorio->id,
            'plan'             => 'basico',
            'limite_citas_mes' => 1,
            'fecha_inicio'     => Carbon::today(),
            'fecha_vencimiento'=> Carbon::today()->addYear(),
            'activa'           => true,
        ]);

        $fechaLunes = Carbon::now()->next(Carbon::MONDAY)->format('Y-m-d');

        Horario::create([
            'consultorio_id' => $consultorio->id,
            'dia_semana'     => 'lunes',
            'hora_inicio'    => '09:00',
            'hora_fin'       => '17:00',
            'activo'         => true,
        ]);

        $userP = $this->crearPaciente();

        $tratamiento = Tratamiento::create([
            'consultorio_id'   => $consultorio->id,
            'nombre'           => 'Revisión',
            'duracion_minutos' => 30,
            'precio'           => 350.00,
            'activo'           => true,
        ]);

        // Primera cita: ocupa el único cupo del mes
        $this->actingAs($userP, 'sanctum')
            ->postJson('/api/citas', [
                'consultorio_id' => $consultorio->id,
                'tratamiento_id' => $tratamiento->id,
                'fecha'          => $fechaLunes,
                'hora_inicio'    => '09:00',
            ])
            ->assertStatus(201);

        // Segunda cita: debe ser rechazada por límite mensual
        $this->actingAs($userP, 'sanctum')
            ->postJson('/api/citas', [
                'consultorio_id' => $consultorio->id,
                'tratamiento_id' => $tratamiento->id,
                'fecha'          => $fechaLunes,
                'hora_inicio'    => '10:00',
            ])
            ->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Este consultorio ha alcanzado el límite de citas de su plan para este mes.',
            ]);

        $this->assertDatabaseCount('citas', 1);
    }

    // ── CV07 — Plan pro (límite=9999) no bloquea citas aunque supere límite básico ─

    public function test_cv07_plan_pro_no_tiene_limite_mensual(): void
    {
        $userC = User::create([
            'name'     => 'Clínica Pro',
            'email'    => 'pro@test.com',
            'password' => bcrypt('pass'),
            'role'     => 'consultorio',
        ]);

        $consultorio = Consultorio::create([
            'user_id'   => $userC->id,
            'nombre'    => 'Clínica Pro',
            'direccion' => 'Calle Pro 1',
            'ciudad'    => 'Monterrey',
            'activo'    => true,
        ]);

        Membrecia::create([
            'consultorio_id'   => $consultorio->id,
            'plan'             => 'pro',
            'limite_citas_mes' => 9999,
            'fecha_inicio'     => Carbon::today(),
            'fecha_vencimiento'=> Carbon::today()->addYear(),
            'activa'           => true,
        ]);

        $fechaLunes = Carbon::now()->next(Carbon::MONDAY)->format('Y-m-d');

        Horario::create([
            'consultorio_id' => $consultorio->id,
            'dia_semana'     => 'lunes',
            'hora_inicio'    => '09:00',
            'hora_fin'       => '17:00',
            'activo'         => true,
        ]);

        $userP = $this->crearPaciente();

        $tratamiento = Tratamiento::create([
            'consultorio_id'   => $consultorio->id,
            'nombre'           => 'Revisión Pro',
            'duracion_minutos' => 30,
            'precio'           => 350.00,
            'activo'           => true,
        ]);

        // Insertar 21 citas directamente (supera el límite de básico=20)
        // Todas en el mismo slot 09:00-09:30 — la inserción directa omite el
        // chequeo de conflictos, pero contarMes() las contará igual.
        $rows = [];
        for ($i = 0; $i < 21; $i++) {
            $rows[] = [
                'consultorio_id' => $consultorio->id,
                'paciente_id'    => $userP->paciente->id,
                'tratamiento_id' => $tratamiento->id,
                'fecha'          => $fechaLunes,
                'hora_inicio'    => '09:00',
                'hora_fin'       => '09:30',
                'estado'         => 'pendiente',
                'created_at'     => now(),
                'updated_at'     => now(),
            ];
        }
        \App\Models\Cita::insert($rows);

        // contarMes devuelve 21, que superaría el límite de básico (20).
        // Con plan pro (9999 < 9999 → false) el check se salta: la cita se acepta.
        // Usamos 14:00 para no chocar con las de 09:00-09:30.
        $this->actingAs($userP, 'sanctum')
            ->postJson('/api/citas', [
                'consultorio_id' => $consultorio->id,
                'tratamiento_id' => $tratamiento->id,
                'fecha'          => $fechaLunes,
                'hora_inicio'    => '14:00',
            ])
            ->assertStatus(201);
    }
}
