<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ConsultorioActivado extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User   $user,
        public readonly string $token,
    ) {}

    public function build(): static
    {
        return $this
            ->subject('Tu consultorio en OpsDental ha sido activado')
            ->view('emails.consultorio_activado');
    }
}
