<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consultorio extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'nombre', 'direccion', 'ciudad',
        'cedula_profesional', 'telefono', 'descripcion', 'foto', 'activo',
    ];

    protected function casts(): array
    {
        return ['activo' => 'boolean'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tratamientos()
    {
        return $this->hasMany(Tratamiento::class);
    }

    public function horarios()
    {
        return $this->hasMany(Horario::class);
    }

    public function citas()
    {
        return $this->hasMany(Cita::class);
    }

    public function membrecia()
    {
        return $this->hasOne(Membrecia::class);
    }
}
