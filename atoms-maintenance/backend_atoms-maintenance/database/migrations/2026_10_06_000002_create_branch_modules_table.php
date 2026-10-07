<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('branch_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_office_id')
                ->constrained('branch_offices')
                ->cascadeOnDelete();
            $table->string('module_type', 10);        // cnsd | tfp
            $table->string('module_key', 100);        // DashboardModuleRegistry key, e.g. cnsd-recorder, tfp-tower
            $table->boolean('is_available')->default(false);
            $table->timestamps();

            $table->unique(['branch_office_id', 'module_type', 'module_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_modules');
    }
};