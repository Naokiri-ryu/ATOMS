<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * tfp_genset_dvor_facilities — checklist rows for the TFP Performance Check
 * Genset DVOR form (paper form rows 1-16: "URAIAN PEKERJAAN" / "KONDISI
 * (BAIK / TIDAK BAIK)" / "KETERANGAN" — e.g. "Pemeriksaan Battery Starter",
 * "Pemeriksaan Level Oli Mesin", ... "Kondisi Genset").
 *
 * Reuses the same facility-row shape (facility_name + kondisi + keterangan)
 * as every other TFP module's "Kondisi Fasilitas" panel, even though on this
 * form the rows are the numbered work checklist rather than a side facility
 * list — the paper form's Baik/Tidak Baik + Keterangan columns map onto it
 * one-to-one. Seeded from TfpGensetDvorTemplate at create-time.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('tfp_genset_dvor_facilities', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('genset_dvor_record_id');
            $table->foreign('genset_dvor_record_id')
                ->references('id')
                ->on('tfp_genset_dvor_records')
                ->cascadeOnDelete();

            $table->string('facility_name', 200);
            $table->string('kondisi', 20)->nullable();  // Baik | Tidak Baik
            $table->text('keterangan')->nullable();

            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('genset_dvor_record_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tfp_genset_dvor_facilities');
    }
};
