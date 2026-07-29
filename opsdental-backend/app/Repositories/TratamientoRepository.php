<?php

namespace App\Repositories;

use App\Models\Tratamiento;
use Illuminate\Database\Eloquent\Collection;

class TratamientoRepository extends BaseRepository
{
    public function __construct(Tratamiento $model)
    {
        parent::__construct($model);
    }

    public function porConsultorio(int $consultorioId, bool $soloActivos = true): Collection
    {
        $query = $this->model->where('consultorio_id', $consultorioId);
        if ($soloActivos) {
            $query->where('activo', true);
        }
        return $query->orderBy('nombre')->get();
    }
}
