<?php

return [
    /*
     * Rutas que aceptan peticiones cross-origin.
     * Debe incluir 'api/*' para el frontend y 'sanctum/csrf-cookie'
     * si en algún momento se usa autenticación SPA con cookies.
     */
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    /*
     * Orígenes permitidos en desarrollo.
     * En producción cambia a la URL real del frontend.
     */
    'allowed_origins' => array_filter(array_unique([
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        env('FRONTEND_URL'),
    ])),

    // En producción: agregar aquí el patrón del dominio OpsDental
    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    /*
     * TTL del preflight OPTIONS en segundos (24 h).
     * El navegador no repite el preflight durante este tiempo.
     */
    'max_age' => 86400,

    /*
     * false porque usamos Bearer token, no cookies de sesión.
     * Si se activa, allowed_origins no puede ser ['*'].
     */
    'supports_credentials' => false,
];
