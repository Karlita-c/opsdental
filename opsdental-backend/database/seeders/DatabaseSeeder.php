<?php

namespace Database\Seeders;

use App\Models\Cita;
use App\Models\Consultorio;
use App\Models\Horario;
use App\Models\Membrecia;
use App\Models\Paciente;
use App\Models\Tratamiento;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('TRUNCATE TABLE citas, tratamientos, horarios, membrecias, consultorios, pacientes, personal_access_tokens, sessions, cache, cache_locks, password_reset_tokens, users RESTART IDENTITY CASCADE');

        // â”€â”€ 1. Gestor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        User::create([
            'name'     => 'Administrador',
            'email'    => 'gestor@opsdental.com',
            'password' => Hash::make('Gestor1234!'),
            'role'     => 'gestor',
        ]);

        // â”€â”€ 2. Consultorio demo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $userC = User::create([
            'name'     => 'Dr. Alejandro Ruiz',
            'email'    => 'demo_cons@opsdental.com',
            'password' => Hash::make('Demo1234!'),
            'role'     => 'consultorio',
            'telefono' => '5512345678',
        ]);

        $consultorio = Consultorio::create([
            'user_id'            => $userC->id,
            'nombre'             => 'Clínica Dental Ruiz',
            'direccion'          => 'Av. Insurgentes Sur 1234, Col. Del Valle',
            'ciudad'             => 'CDMX',
            'cedula_profesional' => '1234567',
            'telefono'           => '5512345678',
            'descripcion'        => 'Clínica dental con más de 15 años de experiencia. Atención personalizada, tecnología de punta y precios accesibles.',
            'activo'             => true,
        ]);

        Membrecia::create([
            'consultorio_id'    => $consultorio->id,
            'plan'              => 'basico',
            'limite_citas_mes'  => 100,
            'fecha_inicio'      => Carbon::today(),
            'fecha_vencimiento' => Carbon::today()->addYear(),
            'activa'            => true,
        ]);

        // â”€â”€ 3. Tratamientos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $tratamientos = collect([
            [
                'nombre'           => 'Revisión general',
                'duracion_minutos' => 20,
                'precio'           => 350.00,
                'descripcion'      => 'Evaluación completa del estado bucal, detección de caries, revisión de encías y orientación sobre higiene dental. Incluye diagnóstico y plan de tratamiento.',
            ],
            [
                'nombre'           => 'Limpieza dental',
                'duracion_minutos' => 45,
                'precio'           => 500.00,
                'descripcion'      => 'Eliminación de sarro y placa bacteriana mediante ultrasonido y pulido dental. Se recomienda realizarla cada 6 meses para mantener una buena salud bucal.',
            ],
            [
                'nombre'           => 'Empaste',
                'duracion_minutos' => 45,
                'precio'           => 700.00,
                'descripcion'      => 'Restauración de piezas dentales dañadas por caries mediante resina del color del diente. Se elimina el tejido afectado y se sella la cavidad para evitar mayor deterioro.',
            ],
            [
                'nombre'           => 'Extracción simple',
                'duracion_minutos' => 30,
                'precio'           => 800.00,
                'descripcion'      => 'Extracción de piezas dentales con movilidad, fracturadas o sin posibilidad de restauración. Se aplica anestesia local para garantizar un procedimiento sin dolor.',
            ],
            [
                'nombre'           => 'Blanqueamiento dental',
                'duracion_minutos' => 90,
                'precio'           => 2500.00,
                'descripcion'      => 'Aclaramiento del color natural de los dientes mediante gel de peróxido activado con luz LED. Resultados visibles desde la primera sesión, hasta 8 tonos más claro.',
            ],
        ])->map(fn($t) => Tratamiento::create([
            ...$t,
            'consultorio_id' => $consultorio->id,
            'activo'         => true,
        ]));

        // â”€â”€ 4. Horarios: Lun-Vie 09:00-18:00, SÃ¡b 09:00-14:00 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $horariosDef = [
            ['dia_semana' => 'lunes',     'hora_inicio' => '09:00', 'hora_fin' => '18:00'],
            ['dia_semana' => 'martes',    'hora_inicio' => '09:00', 'hora_fin' => '18:00'],
            ['dia_semana' => 'miercoles', 'hora_inicio' => '09:00', 'hora_fin' => '18:00'],
            ['dia_semana' => 'jueves',    'hora_inicio' => '09:00', 'hora_fin' => '18:00'],
            ['dia_semana' => 'viernes',   'hora_inicio' => '09:00', 'hora_fin' => '17:00'],
            ['dia_semana' => 'sabado',    'hora_inicio' => '09:00', 'hora_fin' => '14:00'],
        ];

        foreach ($horariosDef as $h) {
            Horario::create([...$h, 'consultorio_id' => $consultorio->id, 'activo' => true]);
        }

        // â”€â”€ 5. Paciente demo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $userP = User::create([
            'name'     => 'Ana García',
            'email'    => 'demo_pac@opsdental.com',
            'password' => Hash::make('Demo1234!'),
            'role'     => 'paciente',
            'telefono' => '5598765432',
        ]);
        $paciente = Paciente::create(['user_id' => $userP->id, 'consultorio_id' => $consultorio->id]);

        // Paciente extra para mÃ¡s variedad en el calendario
        $userP2 = User::create([
            'name'     => 'Carlos López',
            'email'    => 'carlos@demo.com',
            'password' => Hash::make('Demo1234!'),
            'role'     => 'paciente',
        ]);
        $paciente2 = Paciente::create(['user_id' => $userP2->id, 'consultorio_id' => $consultorio->id]);

        // â”€â”€ 6. Citas de ejemplo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // PrÃ³ximo lunes como base para que siempre sean fechas futuras
        $lunes    = Carbon::now()->startOfWeek(Carbon::MONDAY);
        if ($lunes->isPast()) $lunes->addWeek();

        $martes   = $lunes->copy()->addDay();
        $miercoles = $lunes->copy()->addDays(2);
        $jueves   = $lunes->copy()->addDays(3);

        $limpieza  = $tratamientos->firstWhere('nombre', 'Limpieza dental');
        $revision  = $tratamientos->firstWhere('nombre', 'Revisión general');
        $extraccion = $tratamientos->firstWhere('nombre', 'Extracción simple');
        $empaste   = $tratamientos->firstWhere('nombre', 'Empaste');
        $blanq     = $tratamientos->firstWhere('nombre', 'Blanqueamiento dental');

        // LUNES â€” varios slots ocupados para mostrar el calendario lleno
        $citasLunes = [
            ['hora_inicio' => '09:00', 'hora_fin' => '09:45', 'tratamiento' => $limpieza,  'paciente' => $paciente,  'estado' => 'confirmada'],
            ['hora_inicio' => '09:45', 'hora_fin' => '10:30', 'tratamiento' => $limpieza,  'paciente' => $paciente2, 'estado' => 'confirmada'],
            ['hora_inicio' => '10:30', 'hora_fin' => '11:00', 'tratamiento' => $extraccion,'paciente' => $paciente,  'estado' => 'pendiente'],
            ['hora_inicio' => '11:00', 'hora_fin' => '12:30', 'tratamiento' => $blanq,     'paciente' => $paciente2, 'estado' => 'confirmada'],
            ['hora_inicio' => '14:00', 'hora_fin' => '14:20', 'tratamiento' => $revision,  'paciente' => $paciente,  'estado' => 'pendiente'],
            ['hora_inicio' => '16:00', 'hora_fin' => '16:45', 'tratamiento' => $empaste,   'paciente' => $paciente2, 'estado' => 'confirmada'],
        ];

        foreach ($citasLunes as $c) {
            Cita::create([
                'consultorio_id' => $consultorio->id,
                'paciente_id'    => $c['paciente']->id,
                'tratamiento_id' => $c['tratamiento']->id,
                'fecha'          => $lunes->toDateString(),
                'hora_inicio'    => $c['hora_inicio'],
                'hora_fin'       => $c['hora_fin'],
                'estado'         => $c['estado'],
            ]);
        }

        // MARTES â€” algunos slots libres
        $citasMartes = [
            ['hora_inicio' => '09:00', 'hora_fin' => '09:20', 'tratamiento' => $revision,  'paciente' => $paciente,  'estado' => 'confirmada'],
            ['hora_inicio' => '10:00', 'hora_fin' => '10:45', 'tratamiento' => $limpieza,  'paciente' => $paciente2, 'estado' => 'pendiente'],
            ['hora_inicio' => '15:00', 'hora_fin' => '15:45', 'tratamiento' => $empaste,   'paciente' => $paciente,  'estado' => 'confirmada'],
        ];

        foreach ($citasMartes as $c) {
            Cita::create([
                'consultorio_id' => $consultorio->id,
                'paciente_id'    => $c['paciente']->id,
                'tratamiento_id' => $c['tratamiento']->id,
                'fecha'          => $martes->toDateString(),
                'hora_inicio'    => $c['hora_inicio'],
                'hora_fin'       => $c['hora_fin'],
                'estado'         => $c['estado'],
            ]);
        }

        // MIÃ‰RCOLES â€” solo 1 cita para mostrar alta disponibilidad
        Cita::create([
            'consultorio_id' => $consultorio->id,
            'paciente_id'    => $paciente->id,
            'tratamiento_id' => $revision->id,
            'fecha'          => $miercoles->toDateString(),
            'hora_inicio'    => '11:00',
            'hora_fin'       => '11:20',
            'estado'         => 'pendiente',
        ]);

        // JUEVES â€” 2 citas de blanqueamiento (90 min cada una)
        Cita::create([
            'consultorio_id' => $consultorio->id,
            'paciente_id'    => $paciente2->id,
            'tratamiento_id' => $blanq->id,
            'fecha'          => $jueves->toDateString(),
            'hora_inicio'    => '09:00',
            'hora_fin'       => '10:30',
            'estado'         => 'confirmada',
        ]);
        Cita::create([
            'consultorio_id' => $consultorio->id,
            'paciente_id'    => $paciente->id,
            'tratamiento_id' => $blanq->id,
            'fecha'          => $jueves->toDateString(),
            'hora_inicio'    => '10:30',
            'hora_fin'       => '12:00',
            'estado'         => 'confirmada',
        ]);

        // Cita completada con calificaciÃ³n (aparece en el historial y rating del consultorio)
        $semanaAnterior = $lunes->copy()->subWeek();
        Cita::create([
            'consultorio_id'          => $consultorio->id,
            'paciente_id'             => $paciente->id,
            'tratamiento_id'          => $limpieza->id,
            'fecha'                   => $semanaAnterior->toDateString(),
            'hora_inicio'             => '10:00',
            'hora_fin'                => '10:45',
            'estado'                  => 'completada',
            'calificacion'            => 5,
            'comentario_calificacion' => 'Excelente atenciÃ³n, muy profesional y puntual.',
        ]);

        $this->command->info('âœ… Seeder completo');
        $this->command->table(
            ['Rol', 'Email', 'ContraseÃ±a'],
            [
                ['Gestor',      'gestor@opsdental.com',   'Gestor1234!'],
                ['Consultorio', 'demo_cons@opsdental.com','Demo1234!'],
                ['Paciente',    'demo_pac@opsdental.com', 'Demo1234!'],
            ]
        );
    }
}

