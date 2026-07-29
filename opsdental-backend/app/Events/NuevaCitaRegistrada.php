<?php

namespace App\Events;

use App\Models\Cita;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NuevaCitaRegistrada
{
    use Dispatchable, SerializesModels;

    public function __construct(public Cita $cita) {}
}
