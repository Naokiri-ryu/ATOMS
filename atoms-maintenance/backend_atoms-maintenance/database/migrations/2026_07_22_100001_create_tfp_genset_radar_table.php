<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tfp_genset_radar_records', function (Blueprint $table) {
            $table->id();
            $table->string('form_number')->unique();
            $table->date('tanggal');
            $table->enum('shift', ['P', 'S', 'M']); // Pagi, Siang, Malam
            $table->time('jam')->nullable();
            $table->string('engine')->default('DEUTZ');
            $table->string('alternator')->default('LEROY SUMMER');
            $table->string('kapasitas')->default('150 KVA');
            $table->enum('status_operasi', ['PLN OFF', 'RUN UP'])->nullable();
            $table->enum('status_master_slave', ['Master', 'Slave'])->nullable();
            $table->enum('status', ['draft', 'completed'])->default('draft');
            $table->foreignId('manager_teknik_id')->nullable()->constrained('local_users')->nullOnDelete();
            $table->foreignId('supervisor_id')->nullable()->constrained('local_users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('tfp_genset_radar_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('record_id')->constrained('tfp_genset_radar_records')->cascadeOnDelete();
            $table->integer('nomor');
            $table->text('uraian_pekerjaan');
            $table->boolean('kondisi_baik')->default(false);
            $table->boolean('kondisi_tidak_baik')->default(false);
            $table->text('keterangan')->nullable();
            $table->string('satuan')->nullable();
            $table->string('nilai')->nullable();
            $table->timestamps();
        });

        Schema::create('tfp_genset_radar_technicians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('record_id')->constrained('tfp_genset_radar_records')->cascadeOnDelete();
            $table->foreignId('technician_id')->constrained('local_users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tfp_genset_radar_technicians');
        Schema::dropIfExists('tfp_genset_radar_items');
        Schema::dropIfExists('tfp_genset_radar_records');
    }
};
