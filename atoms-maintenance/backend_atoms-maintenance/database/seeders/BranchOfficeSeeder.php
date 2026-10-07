<?php

namespace Database\Seeders;

use App\Models\Branch\BranchOffice;
use Illuminate\Database\Seeder;

/**
 * BranchOfficeSeeder — Kantor Cabang registry for the atoms-maintenance app.
 *
 * Seeds the seven AirNav branch offices that already appear in the Grounding
 * form's `work_unit` dropdown (Cabang Surabaya, Kediri, Malang, Sumenep,
 * Jember, Banyuwangi, Bawean) so the new Branch Office module starts with a
 * realistic, non-invasive starting set. Module availability is intentionally
 * NOT seeded: each branch's CNSD/TFP module toggles are configured by an
 * Admin / Manager Teknik in the "Kantor Cabang" page. Only the head office
 * (Surabaya) is active by default.
 *
 * Safe to run on a non-empty database — it only inserts missing offices
 * (firstOrCreate on `code`) and never touches any existing maintenance record
 * table, nor any branch an admin has already renamed or activated.
 */
class BranchOfficeSeeder extends Seeder
{
    public function run(): void
    {
        $offices = [
            ['code' => 'SUB', 'name' => 'Cabang Surabaya', 'is_active' => true],
            ['code' => 'KDR', 'name' => 'Cabang Kediri', 'is_active' => false],
            ['code' => 'MLG', 'name' => 'Cabang Malang', 'is_active' => false],
            ['code' => 'SMN', 'name' => 'Cabang Sumenep', 'is_active' => false],
            ['code' => 'JBR', 'name' => 'Cabang Jember', 'is_active' => false],
            ['code' => 'BYW', 'name' => 'Cabang Banyuwangi', 'is_active' => false],
            ['code' => 'BWN', 'name' => 'Cabang Bawean', 'is_active' => false],
        ];

        $created = 0;
        foreach ($offices as $office) {
            $created += (int) BranchOffice::query()->firstOrCreate(
                ['code' => $office['code']],
                ['name' => $office['name'], 'is_active' => $office['is_active']],
            )->wasRecentlyCreated;
        }

        $this->command->info("BranchOfficeSeeder: {$created} branch office(s) added, " . count($offices) . ' total expected.');
    }
}