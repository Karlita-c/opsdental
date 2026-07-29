<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Consultorio;

class Paciente extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'consultorio_id', 'fecha_nacimiento', 'notas'];

    protected function casts(): array
    {
        return ['fecha_nacimiento' => 'date'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
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
