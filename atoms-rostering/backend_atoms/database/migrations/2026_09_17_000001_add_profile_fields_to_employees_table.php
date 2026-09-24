<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('nik')->nullable()->unique()->after('user_id');
            $table->string('birth_place')->nullable()->after('employee_type');
            $table->date('birth_date')->nullable()->after('birth_place');
            $table->string('unit_kerja')->nullable()->after('birth_date');
            $table->string('jabatan')->nullable()->after('unit_kerja');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropUnique(['nik']);
            $table->dropColumn(['nik', 'birth_place', 'birth_date', 'unit_kerja', 'jabatan']);
        });
    }
};