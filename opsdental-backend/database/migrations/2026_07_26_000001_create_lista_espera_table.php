<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lista_espera', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultorio_id')->constrained('consultorios')->cascadeOnDelete();
            $table->foreignId('paciente_id')->constrained('pacientes')->cascadeOnDelete();
            $table->foreignId('tratamiento_id')->nullable()->constrained('tratamientos')->nullOnDelete();
            $table->date('fecha_preferida')->nullable();
            $table->enum('estado', ['en_espera', 'notificado', 'convertido', 'cancelado'])
                  ->default('en_espera');
            $table->unsignedSmallInteger('posicion')->default(0);
            $table->timestamp('notificado_en')->nullable();
            $table->timestamp('expira_en')->nullable();
            $table->string('notas', 300)->nullable();
            $table->timestamps();

            $table->index(['consultorio_id', 'estado', 'posicion']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lista_espera');
    }
};
