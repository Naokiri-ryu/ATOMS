<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * tfp_genset_dvor_items — per-parameter rows for the TFP Performance Check
 * Genset DVOR form (paper form rows 17-33: "Pengukuran Tegangan Output
 * Genset", "Pengukuran Arus Beban", "Pemeriksaan Frequency", ... "Pemeriksaan
 * Cadangan Oli Pelumas").
 *
 * Ships directly with the final dynamic-columns schema used by the other TFP
 * modules (`values` / `is_disabled_map` / `merge_map` JSON keyed by composite
 * "panel_id.sub_col_key", panels described by the record's `columns_config`)
 * so the Manager Teknik / Supervisor TFP "Edit Mode" table editor works the
 * same way here as on every other TFP Performance Check page — even though
 * the default template only needs a single "Nilai" column.
 *
 * `group_label` is Genset-specific: several paper-form rows are visually
 * grouped under one heading that spans multiple sub-readings (e.g. rows
 * "V R-N", "V R-S", "V S-N", "V R-T", "V T-N", "V S-T" all fall under
 * "Pengukuran Tegangan Output Genset"). The frontend renders a header
 * divider whenever group_label changes from the previous row.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('tfp_genset_dvor_items', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('genset_dvor_record_id');
            $table->foreign('genset_dvor_record_id')
                ->references('id')
                ->on('tfp_genset_dvor_records')
                ->cascadeOnDelete();

            // Parameter identity
            $table->string('parameter_number', 10)->nullable();
            $table->string('group_label', 100)->nullable();
            $table->string('parameter_name', 200);
            $table->string('unit', 30)->nullable();

            // Cell values, keyed by composite "panel_id.sub_col_key"
            $table->jsonb('values')->nullable();

            // Disabled / merged cell maps (jsonb) — same composite keying as `values`
            $table->jsonb('is_disabled_map')->nullable();
            $table->jsonb('merge_map')->nullable();

            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('genset_dvor_record_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tfp_genset_dvor_items');
    }
};
