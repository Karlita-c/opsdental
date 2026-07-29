<?php

namespace App\Repositories;

use App\Models\Horario;
use Illuminate\Database\Eloquent\Collection;

class HorarioRepository extends BaseRepository
{
    public function __construct(Horario $model)
    {
        parent::__construct($model);
    }

    public function porConsultorio(int $consultorioId): Collection
    {
        return $this->model
            ->where('consultorio_id', $consultorioId)
            ->where('activo', true)
            ->orderByRaw("CASE dia_semana
                WHEN 'lunes'     THEN 1
                WHEN 'martes'    THEN 2
                WHEN 'miercoles' THEN 3
                WHEN 'jueves'    THEN 4
                WHEN 'viernes'   THEN 5
                WHEN 'sabado'    THEN 6
                WHEN 'domingo'   THEN 7
                ELSE 8 END")
            ->get();
    }
}
