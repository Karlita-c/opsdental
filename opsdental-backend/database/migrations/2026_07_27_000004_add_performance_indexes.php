<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Índices de rendimiento para producción.
 * En PostgreSQL los FK no crean índice automáticamente en la tabla hija,
 * por lo que las columnas de join más usadas necesitan índice explícito.
 */
return new class extends Migration {
    public function up(): void
    {
        // citas — tabla más consultada; (consultorio_id, fecha) es el filtro diario de agenda
        Schema::table('citas', function (Blueprint $table) {
            $table->index(['consultorio_id', 'fecha'],  'idx_citas_consultorio_fecha');
            $table->index(['paciente_id', 'estado'],    'idx_citas_paciente_estado');
            $table->index('estado',                     'idx_citas_estado');
        });

        // membrecias — búsqueda de vencidas y por vencer
        Schema::table('membrecias', function (Blueprint $table) {
            $table->index('fecha_vencimiento', 'idx_membrecias_vencimiento');
            $table->index('activa',            'idx_membrecias_activa');
        });

        // consultorios — filtrar por activo en listado público
        Schema::table('consultorios', function (Blueprint $table) {
            $table->index('activo', 'idx_consultorios_activo');
        });

        // users — filtrar por role (paciente/consultorio/gestor)
        Schema::table('users', function (Blueprint $table) {
            $table->index('role', 'idx_users_role');
        });

        // tratamientos — listado público por consultorio activo
        Schema::table('tratamientos', function (Blueprint $table) {
            $table->index(['consultorio_id', 'activo'], 'idx_tratamientos_consultorio_activo');
        });

        // lista_espera — posición por consultorio y tratamiento
        Schema::table('lista_espera', function (Blueprint $table) {
            $table->index(['consultorio_id', 'tratamiento_id'], 'idx_lista_espera_cons_trat');
        });
    }

    public function down(): void
    {
        Schema::table('citas', function (Blueprint $table) {
            $table->dropIndex('idx_citas_consultorio_fecha');
            $table->dropIndex('idx_citas_paciente_estado');
            $table->dropIndex('idx_citas_estado');
        });
        Schema::table('membrecias', function (Blueprint $table) {
            $table->dropIndex('idx_membrecias_vencimiento');
            $table->dropIndex('idx_membrecias_activa');
        });
        Schema::table('consultorios', function (Blueprint $table) {
            $table->dropIndex('idx_consultorios_activo');
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role');
        });
        Schema::table('tratamientos', function (Blueprint $table) {
            $table->dropIndex('idx_tratamientos_consultorio_activo');
        });
        Schema::table('lista_espera', function (Blueprint $table) {
            $table->dropIndex('idx_lista_espera_cons_trat');
        });
    }
};
