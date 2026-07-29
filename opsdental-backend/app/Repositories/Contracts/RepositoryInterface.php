<?php

namespace App\Repositories\Contracts;

interface RepositoryInterface
{
    public function all(array $relations = []): \Illuminate\Database\Eloquent\Collection;
    public function find(int $id, array $relations = []): ?\Illuminate\Database\Eloquent\Model;
    public function create(array $data): \Illuminate\Database\Eloquent\Model;
    public function update(int $id, array $data): \Illuminate\Database\Eloquent\Model;
    public function delete(int $id): bool;
}
