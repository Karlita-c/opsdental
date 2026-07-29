<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('citas', function (Blueprint $table) {
            $table->unsignedTinyInteger('calificacion')->nullable()->after('notas');
            $table->text('comentario_calificacion')->nullable()->after('calificacion');
        });
    }

    public function down(): void
    {
        Schema::table('citas', function (Blueprint $table) {
            $table->dropColumn(['calificacion', 'comentario_calificacion']);
        });
    }
};
