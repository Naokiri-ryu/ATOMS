<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * tfp_genset_dvor_technicians — one row per TFP technician on duty for a given
 * Genset DVOR record. Technician signatures live here (not on the header
 * record) — maps to the "TEKNISI / PARAF" table (rows 1-5) on the paper form.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('tfp_genset_dvor_technicians', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('genset_dvor_record_id');
            $table->foreign('genset_dvor_record_id')
                ->references('id')
                ->on('tfp_genset_dvor_records')
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

            $table->index('genset_dvor_record_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tfp_genset_dvor_technicians');
    }
};
