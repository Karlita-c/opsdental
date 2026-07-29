<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        // X-Powered-By lo inyecta PHP directamente — hay que removerlo antes de procesar
        header_remove('X-Powered-By');

        $response = $next($request);

        // Alerta ZAP Media — CSP no configurada
        $response->headers->set(
            'Content-Security-Policy',
            "default-src 'none'; form-action 'none'; frame-ancestors 'none'"
        );

        // Headers de seguridad adicionales
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        return $response;
    }
}
