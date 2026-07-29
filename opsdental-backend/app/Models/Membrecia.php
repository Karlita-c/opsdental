<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Membrecia extends Model
{
    use HasFactory;

    protected $fillable = [
        'consultorio_id', 'plan', 'limite_citas_mes',
        'fecha_inicio', 'fecha_vencimiento', 'activa',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio'       => 'date',
            'fecha_vencimiento'  => 'date',
            'activa'             => 'boolean',
        ];
    }

    public function consultorio()
    {
        return $this->belongsTo(Consultorio::class);
    }

    public function vigente(): bool
    {
        return $this->activa && $this->fecha_vencimiento->gte(Carbon::today());
    }
}
