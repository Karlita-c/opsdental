<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoogleToken extends Model
{
    protected $fillable = ['user_id', 'access_token', 'refresh_token', 'expires_at'];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function estaExpirado(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}
