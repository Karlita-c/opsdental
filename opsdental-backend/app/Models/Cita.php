<?php

namespace App\Models;

use App\Events\NuevaCitaRegistrada;
use App\Events\CitaCancelada;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cita extends Model
{
    use HasFactory;

    protected $fillable = [
        'paciente_id', 'consultorio_id', 'tratamiento_id',
        'fecha', 'hora_inicio', 'hora_fin', 'estado', 'notas',
        'calificacion', 'comentario_calificacion',
        'deposito_monto', 'deposito_estado', 'deposito_pago_id', 'deposito_preference_id',
    ];

    protected $dispatchesEvents = [
        'created' => NuevaCitaRegistrada::class,
    ];

    protected function casts(): array
    {
        return [
            'fecha'          => 'date',
            'deposito_monto' => 'decimal:2',
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

    public function tratamiento()
    {
        return $this->belongsTo(Tratamiento::class);
    }

    public function cancelar(): void
    {
        $this->update(['estado' => 'cancelada']);
        event(new CitaCancelada($this));
    }
}
