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
use Illuminate\Support\Facades\Hash;

class ExtraDataSeeder extends Seeder
{
    public function run(): void
    {
        $hoy   = Carbon::today();
        $lunes = Carbon::now()->startOfWeek(Carbon::MONDAY);
        if ($lunes->isPast()) $lunes->addWeek();

        // ══════════════════════════════════════════════════════════════
        //   3 CONSULTORIOS EXTRA (ciudades y planes distintos)
        // ══════════════════════════════════════════════════════════════

        $consultorios = [
            [
                'user'  => ['name' => 'Dra. Sofía Mendoza',  'email' => 'sofia.mendoza@dental.com',  'telefono' => '3312345678'],
                'cons'  => ['nombre' => 'Sonrisas Perfectas', 'ciudad' => 'Guadalajara', 'cedula' => '2345678',
                            'dir' => 'Av. Vallarta 3300, Col. Chapalita', 'desc' => 'Especialistas en ortodoncia y estética dental. Más de 10 años transformando sonrisas en Guadalajara.'],
                'plan'  => ['plan' => 'premium', 'limite' => 100],
                'tratamientos' => [
                    ['nombre' => 'Revisión ortodoncia',    'min' => 30,  'precio' => 400,   'desc' => 'Evaluación del estado de la ortodoncia y ajustes necesarios.'],
                    ['nombre' => 'Colocación de brackets', 'min' => 90,  'precio' => 8500,  'desc' => 'Brackets metálicos o estéticos. Incluye estudio radiográfico y modelos de estudio.'],
                    ['nombre' => 'Carillas porcelana',     'min' => 60,  'precio' => 3500,  'desc' => 'Laminillas de porcelana para corregir forma, tamaño y color de los dientes.'],
                    ['nombre' => 'Limpieza profunda',      'min' => 60,  'precio' => 650,   'desc' => 'Limpieza periodontal subgingival para tratar enfermedad de las encías.'],
                ],
                'horarios' => [
                    ['dia' => 'lunes',     'inicio' => '08:00', 'fin' => '17:00'],
                    ['dia' => 'martes',    'inicio' => '08:00', 'fin' => '17:00'],
                    ['dia' => 'miercoles', 'inicio' => '08:00', 'fin' => '17:00'],
                    ['dia' => 'jueves',    'inicio' => '08:00', 'fin' => '17:00'],
                    ['dia' => 'viernes',   'inicio' => '08:00', 'fin' => '14:00'],
                ],
            ],
            [
                'user'  => ['name' => 'Dr. Roberto Castillo', 'email' => 'roberto.castillo@odonto.com', 'telefono' => '8112345678'],
                'cons'  => ['nombre' => 'Dental Norte MTY', 'ciudad' => 'Monterrey', 'cedula' => '3456789',
                            'dir' => 'Av. Constitución 450, Col. Centro', 'desc' => 'Clínica dental de alta especialidad en Monterrey. Implantes, prótesis y cirugía oral.'],
                'plan'  => ['plan' => 'pro', 'limite' => 999999],
                'tratamientos' => [
                    ['nombre' => 'Implante dental',    'min' => 120, 'precio' => 15000, 'desc' => 'Implante de titanio con corona de porcelana. Solución permanente para dientes perdidos.'],
                    ['nombre' => 'Prótesis removible', 'min' => 45,  'precio' => 5500,  'desc' => 'Prótesis parcial o total removible. Toma de impresiones y ajuste personalizado.'],
                    ['nombre' => 'Endodoncia',         'min' => 90,  'precio' => 2800,  'desc' => 'Tratamiento de conductos para salvar piezas con infección profunda.'],
                    ['nombre' => 'Revisión general',   'min' => 20,  'precio' => 400,   'desc' => 'Evaluación completa con diagnóstico y plan de tratamiento.'],
                    ['nombre' => 'Blanqueamiento LED', 'min' => 90,  'precio' => 3000,  'desc' => 'Blanqueamiento con tecnología LED de última generación.'],
                ],
                'horarios' => [
                    ['dia' => 'lunes',     'inicio' => '10:00', 'fin' => '19:00'],
                    ['dia' => 'martes',    'inicio' => '10:00', 'fin' => '19:00'],
                    ['dia' => 'miercoles', 'inicio' => '10:00', 'fin' => '19:00'],
                    ['dia' => 'jueves',    'inicio' => '10:00', 'fin' => '19:00'],
                    ['dia' => 'viernes',   'inicio' => '10:00', 'fin' => '19:00'],
                    ['dia' => 'sabado',    'inicio' => '09:00', 'fin' => '13:00'],
                ],
            ],
            [
                'user'  => ['name' => 'Dra. Valeria Torres', 'email' => 'valeria.torres@smile.com', 'telefono' => '2221234567'],
                'cons'  => ['nombre' => 'Smile Studio Puebla', 'ciudad' => 'Puebla', 'cedula' => '4567890',
                            'dir' => 'Blvd. Atlixcáyotl 2900, Reserva Territorial Atlixcáyotl', 'desc' => 'Estética dental avanzada en Puebla. Diseño de sonrisa digital y tratamientos sin dolor.'],
                'plan'  => ['plan' => 'basico', 'limite' => 20],
                'tratamientos' => [
                    ['nombre' => 'Diseño de sonrisa', 'min' => 60,  'precio' => 1200,  'desc' => 'Diagnóstico digital con simulación del resultado antes del tratamiento.'],
                    ['nombre' => 'Limpieza dental',   'min' => 45,  'precio' => 480,   'desc' => 'Profilaxis dental completa con pulido y aplicación de flúor.'],
                    ['nombre' => 'Empaste estético',  'min' => 40,  'precio' => 750,   'desc' => 'Resina compuesta del color del diente, invisible y duradera.'],
                    ['nombre' => 'Revisión general',  'min' => 20,  'precio' => 350,   'desc' => 'Chequeo completo con rayos X y plan de tratamiento personalizado.'],
                ],
                'horarios' => [
                    ['dia' => 'lunes',     'inicio' => '09:00', 'fin' => '18:00'],
                    ['dia' => 'miercoles', 'inicio' => '09:00', 'fin' => '18:00'],
                    ['dia' => 'viernes',   'inicio' => '09:00', 'fin' => '18:00'],
                    ['dia' => 'sabado',    'inicio' => '09:00', 'fin' => '15:00'],
                ],
            ],
        ];

        $consObjs = [];
        $tratObjs = [];

        foreach ($consultorios as $i => $datos) {
            $existingUser = User::where('email', $datos['user']['email'])->first();

            if ($existingUser) {
                // Ya existe — cargarlo para crear las citas después
                $this->command->warn("⚠️  Ya existe: {$datos['user']['email']} — cargando para citas");
                $c = Consultorio::where('user_id', $existingUser->id)->first();
                if ($c) {
                    $consObjs[$i] = $c;
                    $tratObjs[$i] = Tratamiento::where('consultorio_id', $c->id)->get()->all();
                }
                continue;
            }

            $u = User::create([
                'name'     => $datos['user']['name'],
                'email'    => $datos['user']['email'],
                'password' => Hash::make('Demo1234!'),
                'role'     => 'consultorio',
                'telefono' => $datos['user']['telefono'],
            ]);

            $c = Consultorio::create([
                'user_id'            => $u->id,
                'nombre'             => $datos['cons']['nombre'],
                'direccion'          => $datos['cons']['dir'],
                'ciudad'             => $datos['cons']['ciudad'],
                'cedula_profesional' => $datos['cons']['cedula'],
                'telefono'           => $datos['user']['telefono'],
                'descripcion'        => $datos['cons']['desc'],
                'activo'             => true,
            ]);

            Membrecia::create([
                'consultorio_id'    => $c->id,
                'plan'              => $datos['plan']['plan'],
                'limite_citas_mes'  => $datos['plan']['limite'],
                'fecha_inicio'      => $hoy,
                'fecha_vencimiento' => $hoy->copy()->addYear(),
                'activa'            => true,
            ]);

            foreach ($datos['horarios'] as $h) {
                Horario::create([
                    'consultorio_id' => $c->id,
                    'dia_semana'     => $h['dia'],
                    'hora_inicio'    => $h['inicio'],
                    'hora_fin'       => $h['fin'],
                    'activo'         => true,
                ]);
            }

            $tratObjs[$i] = [];
            foreach ($datos['tratamientos'] as $t) {
                $tratObjs[$i][] = Tratamiento::create([
                    'consultorio_id'   => $c->id,
                    'nombre'           => $t['nombre'],
                    'duracion_minutos' => $t['min'],
                    'precio'           => $t['precio'],
                    'descripcion'      => $t['desc'],
                    'activo'           => true,
                ]);
            }

            $consObjs[$i] = $c;
            $this->command->info("✅ Consultorio creado: {$datos['cons']['nombre']} ({$datos['cons']['ciudad']})");
        }

        // ══════════════════════════════════════════════════════════════
        //   5 PACIENTES EXTRA
        // ══════════════════════════════════════════════════════════════

        $pacientesData = [
            ['name' => 'María Fernández',  'email' => 'maria.fernandez@demo.com',  'tel' => '5591234567'],
            ['name' => 'Luis Herrera',     'email' => 'luis.herrera@demo.com',     'tel' => '5523456789'],
            ['name' => 'Patricia Soto',    'email' => 'patricia.soto@demo.com',    'tel' => '5534567890'],
            ['name' => 'Jorge Ramírez',    'email' => 'jorge.ramirez@demo.com',    'tel' => '5545678901'],
            ['name' => 'Daniela Morales',  'email' => 'daniela.morales@demo.com',  'tel' => '5556789012'],
        ];

        $pacientesObjs = [];
        foreach ($pacientesData as $pd) {
            if (User::where('email', $pd['email'])->exists()) {
                $up = User::where('email', $pd['email'])->first();
            } else {
                $up = User::create([
                    'name'     => $pd['name'],
                    'email'    => $pd['email'],
                    'password' => Hash::make('Demo1234!'),
                    'role'     => 'paciente',
                    'telefono' => $pd['tel'],
                ]);
            }
            $pac = Paciente::firstOrCreate(['user_id' => $up->id]);
            $pacientesObjs[] = $pac;
        }
        $this->command->info('✅ ' . count($pacientesObjs) . ' pacientes listos');

        // ══════════════════════════════════════════════════════════════
        //   CITAS EXTRA (pasadas con calificación + futuras)
        // ══════════════════════════════════════════════════════════════

        $totalCitas = 0;

        foreach ($consObjs as $i => $cons) {
            if (!isset($tratObjs[$i]) || empty($tratObjs[$i])) continue;
            if (empty($pacientesObjs)) continue;

            // Saltar si ya tiene citas (evita duplicados en re-ejecución)
            if (Cita::where('consultorio_id', $cons->id)->exists()) {
                $this->command->warn("⚠️  Ya existen citas para: {$cons->nombre} — omitiendo");
                continue;
            }

            $tratsC = $tratObjs[$i];
            $npac   = count($pacientesObjs);

            $califs   = [5, 4, 5, 3, 5];
            $comments = [
                'Excelente atención, muy profesional.',
                'Muy buena clínica, regresaré.',
                'El doctor fue muy amable y puntual.',
                'Buen servicio aunque tardaron un poco.',
                'Todo perfecto, lo recomiendo ampliamente.',
            ];

            // — 5 citas PASADAS completadas con calificación —
            for ($d = 1; $d <= 5; $d++) {
                $pac   = $pacientesObjs[($d - 1) % $npac];
                $trat  = $tratsC[($d - 1) % count($tratsC)];
                $fecha = $hoy->copy()->subDays($d * 3);
                $finH  = Carbon::createFromFormat('H:i', '10:00')->addMinutes($trat->duracion_minutos)->format('H:i');

                Cita::create([
                    'consultorio_id'          => $cons->id,
                    'paciente_id'             => $pac->id,
                    'tratamiento_id'          => $trat->id,
                    'fecha'                   => $fecha->toDateString(),
                    'hora_inicio'             => '10:00',
                    'hora_fin'                => $finH,
                    'estado'                  => 'completada',
                    'calificacion'            => $califs[$d - 1],
                    'comentario_calificacion' => $comments[$d - 1],
                ]);
                $totalCitas++;
            }

            // — 3 citas FUTURAS confirmadas —
            for ($d = 1; $d <= 3; $d++) {
                $pac         = $pacientesObjs[$d % $npac];
                $trat        = $tratsC[$d % count($tratsC)];
                $fecha       = $lunes->copy()->addDays($d - 1);
                $inicioStr   = sprintf('%02d:00', $d + 8);  // "09:00", "10:00", "11:00"
                $finStr      = Carbon::createFromFormat('H:i', $inicioStr)->addMinutes($trat->duracion_minutos)->format('H:i');

                Cita::create([
                    'consultorio_id' => $cons->id,
                    'paciente_id'    => $pac->id,
                    'tratamiento_id' => $trat->id,
                    'fecha'          => $fecha->toDateString(),
                    'hora_inicio'    => $inicioStr,
                    'hora_fin'       => $finStr,
                    'estado'         => 'confirmada',
                ]);
                $totalCitas++;
            }

            // — 2 citas FUTURAS pendientes —
            for ($d = 1; $d <= 2; $d++) {
                $pac   = $pacientesObjs[($d + 2) % $npac];
                $trat  = $tratsC[0];
                $fecha = $lunes->copy()->addDays($d + 2);
                $finH  = Carbon::createFromFormat('H:i', '14:00')->addMinutes($trat->duracion_minutos)->format('H:i');

                Cita::create([
                    'consultorio_id' => $cons->id,
                    'paciente_id'    => $pac->id,
                    'tratamiento_id' => $trat->id,
                    'fecha'          => $fecha->toDateString(),
                    'hora_inicio'    => '14:00',
                    'hora_fin'       => $finH,
                    'estado'         => 'pendiente',
                ]);
                $totalCitas++;
            }
        }

        $this->command->info("✅ $totalCitas citas extra creadas");
        $this->command->info('');
        $this->command->info('🎉 ExtraDataSeeder completado');
        $this->command->table(
            ['Consultorio', 'Ciudad', 'Plan', 'Email', 'Pass'],
            [
                ['Sonrisas Perfectas',  'Guadalajara', 'premium', 'sofia.mendoza@dental.com',    'Demo1234!'],
                ['Dental Norte MTY',    'Monterrey',   'pro',     'roberto.castillo@odonto.com', 'Demo1234!'],
                ['Smile Studio Puebla', 'Puebla',      'básico',  'valeria.torres@smile.com',    'Demo1234!'],
            ]
        );
    }
}
