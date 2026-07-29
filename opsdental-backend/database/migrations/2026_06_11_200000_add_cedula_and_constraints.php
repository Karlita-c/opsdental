<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Cédula profesional del titular y restricción de un consultorio por usuario
        Schema::table('consultorios', function (Blueprint $table) {
            $table->string('cedula_profesional', 20)->nullable()->after('ciudad');
            $table->unique('user_id'); // Un usuario solo puede tener un consultorio
        });

        // Un consultorio no puede tener dos horarios para el mismo día
        Schema::table('horarios', function (Blueprint $table) {
            $table->unique(['consultorio_id', 'dia_semana'], 'horarios_consultorio_dia_unique');
        });
    }

    public function down(): void
    {
        Schema::table('horarios', function (Blueprint $table) {
            $table->dropUnique('horarios_consultorio_dia_unique');
        });

        Schema::table('consultorios', function (Blueprint $table) {
            $table->dropUnique(['user_id']);
            $table->dropColumn('cedula_profesional');
        });
    }
};
