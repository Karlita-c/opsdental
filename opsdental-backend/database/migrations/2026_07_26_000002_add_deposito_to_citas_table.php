<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('citas', function (Blueprint $table) {
            $table->decimal('deposito_monto', 8, 2)->nullable()->after('notas');
            $table->enum('deposito_estado', ['pendiente', 'pagado', 'devuelto', 'retenido'])
                  ->nullable()
                  ->after('deposito_monto');
            $table->string('deposito_pago_id', 100)->nullable()->after('deposito_estado');
            $table->string('deposito_preference_id', 150)->nullable()->after('deposito_pago_id');
        });
    }

    public function down(): void
    {
        Schema::table('citas', function (Blueprint $table) {
            $table->dropColumn(['deposito_monto', 'deposito_estado', 'deposito_pago_id', 'deposito_preference_id']);
        });
    }
};
