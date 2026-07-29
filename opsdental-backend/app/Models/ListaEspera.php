<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ListaEspera extends Model
{
    use HasFactory;

    protected $table = 'lista_espera';

    protected $fillable = [
        'consultorio_id', 'paciente_id', 'tratamiento_id',
        'fecha_preferida', 'estado', 'posicion',
        'notificado_en', 'expira_en', 'notas',
    ];

    protected function casts(): array
    {
        return [
            'fecha_preferida' => 'date',
            'notificado_en'   => 'datetime',
            'expira_en'       => 'datetime',
        ];
    }

    public function consultorio()
    {
        return $this->belongsTo(Consultorio::class);
    }

    public function paciente()
    {
        return $this->belongsTo(Paciente::class);
    }

    public function tratamiento()
    {
        return $this->belongsTo(Tratamiento::class);
    }

    public function estaVigente(): bool
    {
        return $this->estado === 'notificado' && $this->expira_en?->isFuture();
    }
}
