<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tratamiento extends Model
{
    use HasFactory;

    protected $fillable = [
        'consultorio_id', 'nombre', 'duracion_minutos',
        'precio', 'deposito_monto', 'descripcion', 'activo',
    ];

    protected function casts(): array
    {
        return [
            'precio'         => 'decimal:2',
            'deposito_monto' => 'decimal:2',
            'activo'         => 'boolean',
        ];
    }

    public function consultorio()
    {
        return $this->belongsTo(Consultorio::class);
    }

    public function citas()
    {
        return $this->hasMany(Cita::class);
    }
}
