<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CitaController;
use App\Http\Controllers\Api\ConsultorioController;
use App\Http\Controllers\Api\DepositoController;
use App\Http\Controllers\Api\DisponibilidadController;
use App\Http\Controllers\Api\EstadisticasController;
use App\Http\Controllers\Api\ExpedienteController;
use App\Http\Controllers\Api\GoogleCalendarController;
use App\Http\Controllers\Api\HorarioController;
use App\Http\Controllers\Api\ListaEsperaController;
use App\Http\Controllers\Api\MembreciaController;
use App\Http\Controllers\Api\N8NController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\TratamientoController;
use Illuminate\Support\Facades\Route;

// Keepalive — sin throttle para que el ping no se bloquee
Route::get('/health', fn() => response()->json(['status' => 'ok']));

// N8N — endpoints internos para automatización WhatsApp
Route::middleware('throttle:60,1')->prefix('n8n')->group(function () {
    Route::get('/citas-manana',            [N8NController::class, 'citasManana']);
    Route::post('/confirmar-por-whatsapp', [N8NController::class, 'confirmarPorWhatsapp']);
    Route::post('/cancelar-por-whatsapp',  [N8NController::class, 'cancelarPorWhatsapp']);
});

// Webhook Meta WhatsApp — verificación GET + mensajes entrantes POST
Route::get('/whatsapp/webhook',  [N8NController::class, 'webhookVerificacion']);
Route::post('/whatsapp/webhook', [N8NController::class, 'webhookIncoming']);

// Webhook público de Mercado Pago (sin auth — recibe notificaciones de pago)
Route::post('/deposito/webhook', [DepositoController::class, 'webhook']);

// Públicas
Route::middleware('throttle:30,1')->group(function () {
    Route::post('/login',           [AuthController::class,       'login']);
    Route::post('/register',        [AuthController::class,       'register']);
    Route::post('/forgot-password', [PasswordResetController::class, 'sendLink']);
    Route::post('/reset-password',  [PasswordResetController::class, 'reset']);
});
// Login via enlace de invitación (token de un solo uso)
Route::get('/acceso/{token}', [AuthController::class, 'loginConToken']);
// Planes disponibles (pública para la página de precios)
Route::get('/membrecia/planes', [MembreciaController::class, 'planes']);
Route::get('/consultorios',      [ConsultorioController::class, 'index']);
Route::get('/consultorios/{id}', [ConsultorioController::class, 'show']);
Route::get('/disponibilidad',      [DisponibilidadController::class, 'index']);
Route::get('/disponibilidad/dias', [DisponibilidadController::class, 'dias']);

// Autenticadas
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout',  [AuthController::class, 'logout']);
    Route::get('/me',       [AuthController::class, 'me']);
    Route::patch('/perfil', [AuthController::class, 'actualizarPerfil']);

    // Paciente
    Route::middleware('role:paciente')->group(function () {
        Route::get('/paciente/mi-consultorio',    [ConsultorioController::class, 'miConsultorio']);
        Route::get('/citas',                      [CitaController::class, 'index']);
        Route::post('/citas',                     [CitaController::class, 'store']);
        Route::get('/citas/{id}',                 [CitaController::class, 'show']);
        Route::patch('/citas/{id}/cancelar',      [CitaController::class, 'cancelar']);
        Route::patch('/citas/{id}/reagendar',     [CitaController::class, 'reagendar']);
        Route::post('/citas/{id}/calificar',      [CitaController::class, 'calificar']);

        // Depósito anti no-show
        Route::post('/citas/{id}/deposito',       [DepositoController::class, 'iniciarPago']);

        // Lista de espera
        Route::post('/lista-espera',              [ListaEsperaController::class, 'unirse']);
        Route::get('/lista-espera/mi-posicion',   [ListaEsperaController::class, 'miPosicion']);
        Route::delete('/lista-espera/{id}',       [ListaEsperaController::class, 'salir']);
    });

    // Consultorio
    Route::middleware('role:consultorio')->group(function () {
        Route::get('/consultorio/agenda',                    [CitaController::class, 'index']);
        Route::patch('/consultorio/perfil',                  [ConsultorioController::class, 'update']);
        Route::post('/consultorio/logo',                    [ConsultorioController::class, 'uploadLogo']);
        Route::patch('/consultorio/citas/{id}/estado',       [CitaController::class, 'actualizarEstado']);
        Route::patch('/consultorio/citas/{id}/cancelar',    [CitaController::class, 'cancelarPorConsultorio']);

        Route::get('/tratamientos',                 [TratamientoController::class, 'index']);
        Route::post('/tratamientos',                [TratamientoController::class, 'store']);
        Route::put('/tratamientos/{id}',            [TratamientoController::class, 'update']);
        Route::delete('/tratamientos/{id}',         [TratamientoController::class, 'destroy']);

        Route::get('/horarios',                     [HorarioController::class, 'index']);
        Route::post('/horarios',                    [HorarioController::class, 'store']);
        Route::put('/horarios/{id}',                [HorarioController::class, 'update']);
        Route::delete('/horarios/{id}',             [HorarioController::class, 'destroy']);

        Route::get('/consultorio/pacientes',            [EstadisticasController::class, 'pacientes']);
        Route::post('/consultorio/pacientes/invitar',   [EstadisticasController::class, 'invitar']);
        Route::get('/consultorio/pacientes/{id}',       [EstadisticasController::class, 'historialPaciente']);
        Route::get('/consultorio/estadisticas',     [EstadisticasController::class, 'estadisticas']);

        // Membresía — autogestión del consultorio
        Route::get('/consultorio/membrecia',        [MembreciaController::class, 'mi']);
        Route::put('/consultorio/membrecia/plan',   [MembreciaController::class, 'cambiarPlan']);

        // Depósito anti no-show — gestión desde el consultorio
        Route::patch('/consultorio/citas/{id}/deposito/retener',  [DepositoController::class, 'retener']);
        Route::patch('/consultorio/citas/{id}/deposito/devolver', [DepositoController::class, 'devolver']);

        // Lista de espera del consultorio
        Route::get('/consultorio/lista-espera',     [ListaEsperaController::class, 'lista']);

        // Expediente digital del paciente
        Route::get('/consultorio/pacientes/{pacienteId}/expediente',        [ExpedienteController::class, 'index']);
        Route::post('/consultorio/pacientes/{pacienteId}/expediente',       [ExpedienteController::class, 'store']);
        Route::get('/consultorio/pacientes/{pacienteId}/expediente/{id}',   [ExpedienteController::class, 'show']);
        Route::patch('/consultorio/pacientes/{pacienteId}/expediente/{id}', [ExpedienteController::class, 'update']);

        // Google Calendar sync
        Route::get('/google/conectar',      [GoogleCalendarController::class, 'redirigir']);
        Route::get('/google/estado',        [GoogleCalendarController::class, 'estado']);
        Route::delete('/google/desconectar',[GoogleCalendarController::class, 'desconectar']);
    });

    // Callback de Google OAuth (con auth para saber a qué usuario asignar el token)
    Route::get('/auth/google/callback', [GoogleCalendarController::class, 'callback']);

    // Gestor (admin)
    Route::middleware('role:gestor')->prefix('admin')->group(function () {
        Route::get('/consultorios',                          [AdminController::class, 'consultorios']);
        Route::get('/consultorios/{id}',                     [AdminController::class, 'showConsultorio']);
        Route::patch('/consultorios/{id}/activar',           [AdminController::class, 'activarConsultorio']);
        Route::patch('/consultorios/{id}/bloquear',          [AdminController::class, 'bloquearConsultorio']);
        Route::patch('/consultorios/{id}/membrecia',         [AdminController::class, 'editarMembrecia']);
    });
});
