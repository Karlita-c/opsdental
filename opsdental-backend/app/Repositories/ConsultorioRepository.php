<?php

namespace App\Repositories;

use App\Models\Consultorio;
use Illuminate\Database\Eloquent\Collection;

class ConsultorioRepository extends BaseRepository
{
    public function __construct(Consultorio $model)
    {
        parent::__construct($model);
    }

    public function activos(array $relations = []): Collection
    {
        return $this->model->where('activo', true)->with($relations)->get();
    }

    public function porCiudad(string $ciudad): Collection
    {
        return $this->model
            ->where('activo', true)
            ->where('ciudad', 'ilike', "%{$ciudad}%")
            ->with([
                'tratamientos' => fn($q) => $q->where('activo', true),
                'horarios'     => fn($q) => $q->where('activo', true),
                'membrecia',
                'citas'        => fn($q) => $q->select('id','consultorio_id','calificacion')
                                               ->whereNotNull('calificacion'),
            ])
            ->get();
    }

    public function porUsuario(int $userId): ?Consultorio
    {
        return $this->model
            ->where('user_id', $userId)
            ->with(['tratamientos', 'horarios', 'membrecia'])
            ->first();
    }
}
