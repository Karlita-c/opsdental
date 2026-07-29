<?php

namespace Tests\Unit;

use App\Models\Membrecia;
use Carbon\Carbon;
use Tests\TestCase;

class MembreciaVigenciaTest extends TestCase
{
    public function test_membrecia_activa_con_fecha_futura_es_vigente(): void
    {
        $m = new Membrecia([
            'activa'            => true,
            'fecha_vencimiento' => Carbon::tomorrow(),
        ]);

        $this->assertTrue($m->vigente());
    }

    public function test_membrecia_con_fecha_vencida_no_es_vigente(): void
    {
        $m = new Membrecia([
            'activa'            => true,
            'fecha_vencimiento' => Carbon::yesterday(),
        ]);

        $this->assertFalse($m->vigente());
    }

    public function test_membrecia_desactivada_no_es_vigente_aunque_fecha_sea_futura(): void
    {
        $m = new Membrecia([
            'activa'            => false,
            'fecha_vencimiento' => Carbon::tomorrow(),
        ]);

        $this->assertFalse($m->vigente());
    }

    public function test_membrecia_que_vence_hoy_es_vigente(): void
    {
        $m = new Membrecia([
            'activa'            => true,
            'fecha_vencimiento' => Carbon::today(),
        ]);

        $this->assertTrue($m->vigente());
    }
}
