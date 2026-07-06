<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'asset' to items type enum
        DB::statement("ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check");
        DB::statement("ALTER TABLE items ADD CONSTRAINT items_type_check CHECK (type IN ('peralatan', 'komponen', 'asset'))");

        // Add serial_number column
        Schema::table('items', function (Blueprint $table) {
            $table->string('serial_number')->nullable()->after('code_unique');
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('serial_number');
        });

        DB::statement("ALTER TABLE items DROP CONSTRAINT IF EXISTS items_type_check");
        DB::statement("ALTER TABLE items ADD CONSTRAINT items_type_check CHECK (type IN ('peralatan', 'komponen'))");
    }
};
