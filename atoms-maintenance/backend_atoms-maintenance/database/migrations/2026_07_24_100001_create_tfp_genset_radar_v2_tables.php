<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('tfp_genset_radar_facilities');
        Schema::dropIfExists('tfp_genset_radar_technicians');
        Schema::dropIfExists('tfp_genset_radar_items');
        Schema::dropIfExists('tfp_genset_radar_records');

        Schema::create('tfp_genset_radar_records', function (Blueprint $table) {
            $table->id();
            $table->string('form_number')->unique();
            $table->string('form_type')->default('GENSET-RADAR');
            $table->date('date');
            $table->string('day_name')->nullable();
            $table->string('time_filled')->nullable();
            $table->string('shift_type');
            $table->string('location')->default('GENSET RADAR');
            $table->jsonb('columns_config')->nullable();
            $table->string('status')->default('ongoing');

            $table->text('catatan')->nullable();
            $table->string('status_operasi')->nullable();
            $table->string('status_master_slave')->nullable();
            $table->string('fuel_level')->nullable();
            $table->string('engine')->default('DEUTZ');
            $table->string('alternator')->default('LEROY SUMMER');
            $table->string('kapasitas')->default('150 KVA');

            $table->foreignId('manager_id')->nullable()->constrained('local_users')->nullOnDelete();
            $table->string('manager_name')->nullable();
            $table->text('manager_signature')->nullable();
            $table->foreignId('manager_signed_by')->nullable()->constrained('local_users')->nullOnDelete();
            $table->timestamp('manager_signed_at')->nullable();

            $table->foreignId('supervisor_id')->nullable()->constrained('local_users')->nullOnDelete();
            $table->string('supervisor_name')->nullable();
            $table->text('supervisor_signature')->nullable();
            $table->foreignId('supervisor_signed_by')->nullable()->constrained('local_users')->nullOnDelete();
            $table->timestamp('supervisor_signed_at')->nullable();

            $table->foreignId('created_by_id')->nullable()->constrained('local_users')->nullOnDelete();
            $table->string('created_by_name')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['form_type', 'date', 'shift_type'], 'tfp_genset_radar_active_unique');
        });

        Schema::create('tfp_genset_radar_technicians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('genset_radar_record_id')->constrained('tfp_genset_radar_records')->cascadeOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('local_users')->nullOnDelete();
            $table->string('technician_name');
            $table->text('technician_signature')->nullable();
            $table->foreignId('technician_signed_by')->nullable()->constrained('local_users')->nullOnDelete();
            $table->timestamp('technician_signed_at')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('tfp_genset_radar_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('genset_radar_record_id')->constrained('tfp_genset_radar_records')->cascadeOnDelete();
            $table->string('parameter_number')->nullable();
            $table->string('group_label')->nullable();
            $table->string('parameter_name');
            $table->string('unit')->nullable();
            $table->jsonb('values')->nullable();
            $table->jsonb('is_disabled_map')->nullable();
            $table->jsonb('merge_map')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('tfp_genset_radar_facilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('genset_radar_record_id')->constrained('tfp_genset_radar_records')->cascadeOnDelete();
            $table->string('facility_name');
            $table->string('kondisi')->nullable();
            $table->text('keterangan')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tfp_genset_radar_facilities');
        Schema::dropIfExists('tfp_genset_radar_items');
        Schema::dropIfExists('tfp_genset_radar_technicians');
        Schema::dropIfExists('tfp_genset_radar_records');
    }
};
