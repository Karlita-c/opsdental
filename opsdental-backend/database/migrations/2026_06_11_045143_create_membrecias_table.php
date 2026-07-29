<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('membrecias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultorio_id')->constrained()->cascadeOnDelete();
            $table->enum('plan', ['gratuito', 'basico', 'premium', 'pro'])->default('gratuito');
            $table->integer('limite_citas_mes')->default(20);
            $table->date('fecha_inicio');
            $table->date('fecha_vencimiento');
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membrecias');
    }
};
