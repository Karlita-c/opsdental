<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expediente extends Model
{
    use HasFactory;

    protected $fillable = [
        'paciente_id', 'consultorio_id',
        'fecha_visita', 'diagnostico', 'tratamiento_realizado',
        'observaciones', 'archivos',
    ];

    protected function casts(): array
    {
        return [
            'fecha_visita' => 'date',
            'archivos'     => 'array',
        ];
    }

    public function paciente()
    {
        return $this->belongsTo(Paciente::class);
    }

    public function consultorio()
    {
        return $this->belongsTo(Consultorio::class);
    }
}
