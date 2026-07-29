<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('expedientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paciente_id')->constrained()->cascadeOnDelete();
            $table->foreignId('consultorio_id')->constrained()->cascadeOnDelete();
            $table->date('fecha_visita');
            $table->text('diagnostico');
            $table->text('tratamiento_realizado');
            $table->text('observaciones')->nullable();
            $table->json('archivos')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expedientes');
    }
};
