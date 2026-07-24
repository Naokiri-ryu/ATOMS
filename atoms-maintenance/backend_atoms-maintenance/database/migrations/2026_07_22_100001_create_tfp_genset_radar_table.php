<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── Records ──────────────────────────────────────────────
        Schema::create('tfp_genset_radar_records', function (Blueprint $table) {
            $table->id();

            // Identity
            $table->string('form_number', 80)->unique();
            $table->string('form_type', 30)->default('GENSET-RADAR');

            // Time + place
            $table->date('date');
            $table->string('day_name', 20)->nullable();
            $table->string('time_filled', 10)->nullable();
            $table->string('shift_type', 10);
            $table->string('location', 100)->default('GENSET RADAR');

            // Dynamic columns config
            $table->jsonb('columns_config')->nullable();

            // Lifecycle
            $table->string('status', 20)->default('ongoing');

            // Genset-specific fields
            $table->string('engine', 100)->default('DEUTZ');
            $table->string('alternator', 100)->default('LEROY SUMMER');
            $table->string('kapasitas', 100)->default('150 KVA');
            $table->text('catatan')->nullable();
            $table->string('status_operasi', 20)->nullable();
            $table->string('status_master_slave', 20)->nullable();
            $table->string('fuel_level', 10)->nullable();

            // Manager Teknik
            $table->unsignedBigInteger('manager_id')->nullable();
            $table->string('manager_name')->nullable();
            $table->longText('manager_signature')->nullable();
            $table->unsignedBigInteger('manager_signed_by')->nullable();
            $table->timestamp('manager_signed_at')->nullable();

            // Supervisor TFP
            $table->unsignedBigInteger('supervisor_id')->nullable();
            $table->string('supervisor_name')->nullable();
            $table->longText('supervisor_signature')->nullable();
            $table->unsignedBigInteger('supervisor_signed_by')->nullable();
            $table->timestamp('supervisor_signed_at')->nullable();

            // Audit
            $table->unsignedBigInteger('created_by_id')->nullable();
            $table->string('created_by_name')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('manager_id')->references('id')->on('local_users')->nullOnDelete();
            $table->foreign('supervisor_id')->references('id')->on('local_users')->nullOnDelete();
            $table->foreign('manager_signed_by')->references('id')->on('local_users')->nullOnDelete();
            $table->foreign('supervisor_signed_by')->references('id')->on('local_users')->nullOnDelete();
            $table->foreign('created_by_id')->references('id')->on('local_users')->nullOnDelete();

            // Indexes
            $table->index(['date', 'shift_type']);
            $table->index(['form_type', 'date']);
            $table->index('status');
        });

        // ── Items (measurement parameters, rows 17-33) ───────────
        Schema::create('tfp_genset_radar_items', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('genset_radar_record_id');
            $table->foreign('genset_radar_record_id')
                ->references('id')
                ->on('tfp_genset_radar_records')
                ->cascadeOnDelete();

            $table->string('parameter_number', 10)->nullable();
            $table->string('group_label', 100)->nullable();
            $table->string('parameter_name', 200);
            $table->string('unit', 30)->nullable();

            $table->jsonb('values')->nullable();
            $table->jsonb('is_disabled_map')->nullable();
            $table->jsonb('merge_map')->nullable();

            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('genset_radar_record_id');
        });

        // ── Technicians ──────────────────────────────────────────
        Schema::create('tfp_genset_radar_technicians', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('genset_radar_record_id');
            $table->foreign('genset_radar_record_id')
                ->references('id')
                ->on('tfp_genset_radar_records')
                ->cascadeOnDelete();

            $table->unsignedBigInteger('technician_id')->nullable();
            $table->foreign('technician_id')->references('id')->on('local_users')->nullOnDelete();

            $table->string('technician_name');
            $table->longText('technician_signature')->nullable();

            $table->unsignedBigInteger('technician_signed_by')->nullable();
            $table->foreign('technician_signed_by')->references('id')->on('local_users')->nullOnDelete();
            $table->timestamp('technician_signed_at')->nullable();

            $table->integer('sort_order')->default(0);

            $table->timestamps();
            $table->index('genset_radar_record_id');
        });

        // ── Facilities (checklist rows 1-16) ─────────────────────
        Schema::create('tfp_genset_radar_facilities', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('genset_radar_record_id');
            $table->foreign('genset_radar_record_id')
                ->references('id')
                ->on('tfp_genset_radar_records')
                ->cascadeOnDelete();

            $table->string('facility_name', 200);
            $table->string('kondisi', 20)->nullable();
            $table->text('keterangan')->nullable();

            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('genset_radar_record_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tfp_genset_radar_facilities');
        Schema::dropIfExists('tfp_genset_radar_technicians');
        Schema::dropIfExists('tfp_genset_radar_items');
        Schema::dropIfExists('tfp_genset_radar_records');
    }
};
