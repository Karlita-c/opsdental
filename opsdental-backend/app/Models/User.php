<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role', 'telefono', 'token_invitacion', 'token_invitacion_expires_at'];

    protected $hidden = ['password', 'remember_token', 'token_invitacion'];

    protected function casts(): array
    {
        return [
            'email_verified_at'              => 'datetime',
            'password'                       => 'hashed',
            'token_invitacion_expires_at'    => 'datetime',
        ];
    }

    public function isRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function consultorio()
    {
        return $this->hasOne(Consultorio::class);
    }

    public function paciente()
    {
        return $this->hasOne(Paciente::class);
    }
}
