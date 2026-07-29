<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('token_invitacion', 64)->nullable()->unique()->after('telefono');
            $table->timestamp('token_invitacion_expires_at')->nullable()->after('token_invitacion');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['token_invitacion', 'token_invitacion_expires_at']);
        });
    }
};
