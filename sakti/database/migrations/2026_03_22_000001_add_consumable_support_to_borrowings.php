<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the existing check constraint and recreate with new value
        // Laravel's enum on PostgreSQL uses check constraints
        DB::statement("ALTER TABLE borrowings DROP CONSTRAINT IF EXISTS borrowings_status_check");
        DB::statement("ALTER TABLE borrowings ADD CONSTRAINT borrowings_status_check CHECK (status IN ('dipinjam', 'dikembalikan', 'digunakan'))");

        // Add usage_notes column for documenting installation/usage
        Schema::table('borrowings', function (Blueprint $table) {
            $table->text('usage_notes')->nullable()->after('return_photo_path');
        });
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE borrowings DROP CONSTRAINT IF EXISTS borrowings_status_check");
        DB::statement("ALTER TABLE borrowings ADD CONSTRAINT borrowings_status_check CHECK (status IN ('dipinjam', 'dikembalikan'))");

        Schema::table('borrowings', function (Blueprint $table) {
            $table->dropColumn('usage_notes');
        });
    }
};
