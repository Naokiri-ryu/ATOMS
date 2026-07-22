<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * [UBAH] Opsi A — membuka batasan "1 Ground Check VHF per tanggal + shift".
     *
     * Batasan sebelumnya BUKAN unique constraint biasa, melainkan PARTIAL
     * UNIQUE INDEX (dibuat via `CREATE UNIQUE INDEX ... WHERE deleted_at IS
     * NULL`), jadi tidak muncul di pg_constraint dan tidak bisa di-drop
     * lewat $table->dropUnique() / dropIndex() Blueprint biasa — harus pakai
     * raw SQL "DROP INDEX".
     *
     *   CREATE UNIQUE INDEX ground_check_vhf_records_unique_form_per_shift
     *   ON public.ground_check_vhf_records USING btree (form_type, date, shift_type)
     *   WHERE (deleted_at IS NULL)
     */
    public function up(): void
    {
        DB::statement('DROP INDEX IF EXISTS ground_check_vhf_records_unique_form_per_shift');
    }

    /**
     * Rollback: buat ulang partial unique index-nya persis seperti semula.
     */
    public function down(): void
    {
        DB::statement(
            'CREATE UNIQUE INDEX ground_check_vhf_records_unique_form_per_shift '
            . 'ON public.ground_check_vhf_records USING btree (form_type, date, shift_type) '
            . 'WHERE (deleted_at IS NULL)'
        );
    }
};
