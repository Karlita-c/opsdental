<?php

namespace App\Providers;

use App\Events\CitaCancelada;
use App\Events\NuevaCitaRegistrada;
use App\Listeners\EliminarEventoGoogleCalendar;
use App\Listeners\EnviarNotificacionCitaCancelada;
use App\Listeners\EnviarNotificacionNuevaCita;
use App\Listeners\NotificarListaEsperaCancelacion;
use App\Listeners\SincronizarGoogleCalendar;
use App\Services\Notifications\NotificacionFactory;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Patrón Singleton — una sola instancia de conexión a la BD reutilizada
        // por todos los repositorios durante el ciclo de vida de la petición.
        $this->app->singleton(ConnectionInterface::class, fn () => DB::connection());

        // Patrón Singleton — una sola instancia del factory de notificaciones.
        $this->app->singleton(NotificacionFactory::class);
    }

    public function boot(): void
    {
        // Patrón Observer — escucha eventos de citas y despacha notificaciones.
        Event::listen(NuevaCitaRegistrada::class, EnviarNotificacionNuevaCita::class);
        Event::listen(CitaCancelada::class,       EnviarNotificacionCitaCancelada::class);
        Event::listen(CitaCancelada::class,       NotificarListaEsperaCancelacion::class);
        Event::listen(NuevaCitaRegistrada::class, SincronizarGoogleCalendar::class);
        Event::listen(CitaCancelada::class,        EliminarEventoGoogleCalendar::class);

        ResetPassword::createUrlUsing(function ($notifiable, string $token): string {
            $base = env('FRONTEND_URL', 'http://localhost:3000');
            return "{$base}/reset-password?token={$token}&email=" . urlencode($notifiable->email);
        });
    }
}
