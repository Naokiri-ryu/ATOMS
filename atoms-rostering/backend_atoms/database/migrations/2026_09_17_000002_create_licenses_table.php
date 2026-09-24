<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('licenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->string('license_name')->nullable();
            $table->string('license_number')->nullable();
            $table->string('valid_until', 50)->nullable();
            $table->string('keterangan')->nullable();
            $table->timestamps();

            $table->index('employee_id');
            $table->index('license_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('licenses');
    }
};