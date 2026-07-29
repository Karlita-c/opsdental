<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Rename existing 'gratuito' records → 'basico'
        DB::statement("UPDATE membrecias SET plan = 'basico' WHERE plan = 'gratuito'");

        // PostgreSQL: drop old CHECK and add new one with basico, premium, pro
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE membrecias DROP CONSTRAINT IF EXISTS membrecias_plan_check");
            DB::statement("ALTER TABLE membrecias ADD CONSTRAINT membrecias_plan_check CHECK (plan IN ('basico', 'premium', 'pro'))");
        }
    }

    public function down(): void
    {
        DB::statement("UPDATE membrecias SET plan = 'gratuito' WHERE plan = 'basico'");
        DB::statement("UPDATE membrecias SET plan = 'premium' WHERE plan = 'pro'");

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE membrecias DROP CONSTRAINT IF EXISTS membrecias_plan_check");
            DB::statement("ALTER TABLE membrecias ADD CONSTRAINT membrecias_plan_check CHECK (plan IN ('gratuito', 'basico', 'premium'))");
        }
    }
};
