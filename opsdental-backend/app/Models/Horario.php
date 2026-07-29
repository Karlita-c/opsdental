<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Horario extends Model
{
    use HasFactory;

    protected $fillable = [
        'consultorio_id', 'dia_semana',
        'hora_inicio', 'hora_fin', 'activo',
    ];

    protected function casts(): array
    {
        return ['activo' => 'boolean'];
    }

    public function consultorio()
    {
        return $this->belongsTo(Consultorio::class);
    }
}
