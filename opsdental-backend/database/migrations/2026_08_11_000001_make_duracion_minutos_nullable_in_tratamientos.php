<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tratamientos', function (Blueprint $table) {
            $table->integer('duracion_minutos')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('tratamientos', function (Blueprint $table) {
            $table->integer('duracion_minutos')->nullable(false)->change();
        });
    }
};
