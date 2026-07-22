<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * tfp_genset_dvor_records — header table for TFP Performance Check Genset DVOR
 * Teknik Fasilitas Penunjang forms (paper form: "PERFORMANCE CHECK GENSET DVOR
 * TEKNIK FASILITAS PENUNJANG — AIRNAV CABANG SURABAYA").
 *
 * One record per (form_type, date, shift_type) — uniqueness enforced via
 * partial unique index that ignores soft-deleted rows.
 *
 * Mirrors tfp_aob_ground_records exactly (same architecture as the other
 * 8 TFP Performance Check modules), plus a handful of Genset-specific
 * columns that have no equivalent elsewhere: `catatan` (free-text notes),
 * `status_operasi` (PLN OFF / RUN UP) and `status_master_slave`
 * (Master / Slave), and `fuel_level` (visual fuel gauge reading).
 *
 * The items table already ships with the final dynamic-columns schema
 * (values / merge_map / is_disabled_map JSON, keyed by columns_config) —
 * unlike the older TFP modules there is no separate "add dynamic columns"
 * migration needed since this table is created fresh.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('tfp_genset_dvor_records', function (Blueprint $table) {
            $table->id();

            // Identity
            $table->string('form_number', 80)->unique();
            $table->string('form_type', 30)->default('GENSET-DVOR');

            // Time + place
            $table->date('date');
            $table->string('day_name', 20)->nullable();   // auto-filled from date (Indonesian)
            $table->string('time_filled', 10)->nullable(); // HH:MM, set at create time
            $table->string('shift_type', 10);              // pagi | siang | malam
            $table->string('location', 100)->default('GENSET DVOR');

            // Dynamic columns config for the measurement parameter table
            // (rows 17-33 on the paper form). Default: single "Nilai" column.
            $table->jsonb('columns_config')->nullable();

            // Lifecycle
            $table->string('status', 20)->default('ongoing'); // ongoing | on_hold | completed

            // Genset-specific fields (no equivalent in the other TFP modules)
            $table->text('catatan')->nullable();
            $table->string('status_operasi', 20)->nullable();      // PLN_OFF | RUN_UP
            $table->string('status_master_slave', 20)->nullable(); // Master | Slave
            $table->string('fuel_level', 10)->nullable();          // E | 1/4 | 1/2 | 3/4 | F

            // Manager Teknik (nullable)
            $table->unsignedBigInteger('manager_id')->nullable();
            $table->string('manager_name')->nullable();
            $table->longText('manager_signature')->nullable();
            $table->unsignedBigInteger('manager_signed_by')->nullable();
            $table->timestamp('manager_signed_at')->nullable();

            // Supervisor TFP (nullable)
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

            // Foreign keys to local_users
            $table->foreign('manager_id')->references('id')->on('local_users')->nullOnDelete();
            $table->foreign('supervisor_id')->references('id')->on('local_users')->nullOnDelete();
            $table->foreign('manager_signed_by')->references('id')->on('local_users')->nullOnDelete();
            $table->foreign('supervisor_signed_by')->references('id')->on('local_users')->nullOnDelete();
            $table->foreign('created_by_id')->references('id')->on('local_users')->nullOnDelete();

            // Search / list filters
            $table->index(['date', 'shift_type']);
            $table->index(['form_type', 'date']);
            $table->index('status');
        });

        // PostgreSQL partial unique index — one *active* form per
        // (form_type, date, shift_type). Soft-deleted rows excluded
        // so a record can be re-created after delete.
        \Illuminate\Support\Facades\DB::statement(
            'CREATE UNIQUE INDEX tfp_genset_dvor_records_unique_form_per_shift '
            . 'ON tfp_genset_dvor_records (form_type, date, shift_type) '
            . 'WHERE deleted_at IS NULL'
        );
    }

    public function down(): void
    {
        \Illuminate\Support\Facades\DB::statement(
            'DROP INDEX IF EXISTS tfp_genset_dvor_records_unique_form_per_shift'
        );
        Schema::dropIfExists('tfp_genset_dvor_records');
    }
};
