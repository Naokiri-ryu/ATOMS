<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('berita_acara', function (Blueprint $table) {
            $table->string('nomor_ba')->nullable()->after('id');
            $table->string('manager_name')->nullable()->after('signer_name');
            $table->string('location')->nullable()->after('manager_name');
        });
    }

    public function down(): void
    {
        Schema::table('berita_acara', function (Blueprint $table) {
            $table->dropColumn(['nomor_ba', 'manager_name', 'location']);
        });
    }
};
