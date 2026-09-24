<?php

namespace Database\Seeders;

use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmployeeProfileSeeder extends Seeder
{
    private array $overrides = [
        'Aditya Huzairi Putra' => 'Aditya Huzairi P',
        'Khoirul Miftahul Azis' => 'Khoirul M.A',
        'Achmad Saiful Bahris' => 'Saiful Bahris',
        'Febry Dwi Cahyono' => 'Febri Dwi C',
        'Dani Ridzal Safii' => 'Dani Ridzal',
        'Amirzan Ridho Wicaksono' => 'Amirzan Ridho W',
        'Rhomadoni Surya Kahfi D.' => 'Rhomadoni S.K.D',
        'Yourdan Christian Prihadi' => 'Yourdan C.P',
        'Aldhi Deska Perwira' => 'Aldhi Deska P',
        'Pandu Indrajaya Pangestu' => 'Pandu Indra Jaya',
        'Rendy Panca Alam Putra' => 'Rendy Panca A P',
        'I Kadek Dwija Santika' => 'I Kadek Dwija S',
        'Teguh Mardiyanto' => 'Teguh M',
        'Yusri Handoko' => 'Yusri H.',
        'Dwiki Setyo Widodo' => 'Dwiki Setyo W',
        'Septi Rahman Sari' => 'Septi Rahman sari',
        'Adam Bukhori' => 'Adam bukhori',
        'Fajar Kusuma Wardana' => 'Fajar Kusuma W',
        'Agustina Anggraeni' => 'Agustina Anggreini',
        'Muh. Feizar Noor' => 'M. Feizar Noor',
        'Yoga Arifal Pratama' => 'Yoga Arifal P',
        'Ilmin Syarif H.' => 'Ilmin Syarif H',
        'Andhika Bhaskara Jaya' => 'Andhika Bhaskara J',
        'Ahmad Muji Yasin' => 'A. M. Yasin',
    ];

    public function run(): void
    {
        $employees = Employee::with('user')->get()->keyBy(fn (Employee $e) => $this->normalizeName($e->user->name));

        $loaded = 0;
        $skipped = [];

        foreach ($this->personnel() as $person) {
            $rosterName = $this->overrides[$person['name']] ?? $person['name'];
            $key = $this->normalizeName($rosterName);

            if (!isset($employees[$key])) {
                $skipped[] = $person['name'];
                continue;
            }

            $employee = $employees[$key];

            $profile = [
                'nik' => $person['nik'],
                'birth_place' => $person['birth_place'],
                'birth_date' => $this->excelSerialToDate($person['birth_date']),
                'unit_kerja' => $person['unit_kerja'],
                'jabatan' => $person['jabatan'],
            ];

            DB::transaction(function () use ($employee, $profile, $person) {
                $employee->update($profile);

                $employee->licenses()->delete();
                if ($person['licenses']) {
                    $employee->licenses()->createMany(array_map(
                        fn (array $l) => [
                            'license_name' => $l['name'],
                            'license_number' => $l['number'],
                            'valid_until' => $l['valid'],
                            'keterangan' => $l['keterangan'] ?? null,
                        ],
                        $person['licenses']
                    ));
                }

                $employee->ratings()->delete();
                if ($person['ratings']) {
                    $employee->ratings()->createMany(array_map(
                        fn (array $r) => [
                            'rating' => $r['name'],
                            'valid_until' => $this->excelSerialToDate($r['valid']),
                            'keterangan' => $r['keterangan'] ?? null,
                        ],
                        $person['ratings']
                    ));
                }
            });

            $loaded++;
        }

        $this->command->info("Loaded profile data for {$loaded} personnel.");

        if ($skipped) {
            $this->command->warn('Unmatched personnel (no roster employee found): ' . implode(', ', $skipped));
        } else {
            $this->command->info('All personnel matched to roster employees.');
        }
    }

    private function normalizeName(string $name): string
    {
        $clean = preg_replace('/[^a-z0-9 ]/', '', mb_strtolower($name));

        return preg_replace('/\s+/', ' ', trim((string) $clean));
    }

    private function excelSerialToDate(string $serial): ?string
    {
        if (!is_numeric($serial) || (int) $serial <= 0) {
            return null;
        }

        return Carbon::parse('1899-12-30')->addDays((int) $serial)->format('Y-m-d');
    }

    private function personnel(): array
    {
        return [
            [
                'name' => 'Aditya Huzairi Putra',
                'nik' => '10010998',
                'birth_place' => 'Pasuruan',
                'birth_date' => '33125',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Supervisor Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '207/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'NAVIGASI', 'valid' => '46726', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Nur Hukim',
                'nik' => '10010419',
                'birth_place' => 'Gresik',
                'birth_date' => '30649',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Supervisor Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '315/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'DATA PROCESSING', 'valid' => '46684', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Riyan Fauzi',
                'nik' => '10011057',
                'birth_place' => 'Malang',
                'birth_date' => '33235',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '348/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'COMMUNICATION', 'valid' => '46686', 'keterangan' => 'Aktif'],
                    ['name' => 'DATA PROCESSING', 'valid' => '46817'],
                ],
            ],
            [
                'name' => 'Teguh Mardiyanto',
                'nik' => '10011215',
                'birth_place' => 'Sukoharjo',
                'birth_date' => '33463',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '359/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'NAVIGASI', 'valid' => '46684', 'keterangan' => 'Aktif'],
                    ['name' => 'COMMUNICATION', 'valid' => '46686'],
                    ['name' => 'DATA PROCESSING', 'valid' => '46701'],
                ],
            ],
            [
                'name' => 'Febry Dwi Cahyono',
                'nik' => '10010899',
                'birth_place' => 'Mojokerto',
                'birth_date' => '32905',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '360/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'DATA PROCESSING', 'valid' => '46706', 'keterangan' => 'Aktif'],
                    ['name' => 'COMMUNICATION', 'valid' => '46706'],
                    ['name' => 'NAVIGASI', 'valid' => '46706'],
                ],
            ],
            [
                'name' => 'Moh. Syamsudin',
                'nik' => 'ASN83666',
                'birth_place' => 'Surabaya',
                'birth_date' => '28539',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '345/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'COMMUNICATION', 'valid' => '46696', 'keterangan' => 'Aktif'],
                    ['name' => 'SURVEILLANCE', 'valid' => '46688'],
                ],
            ],
            [
                'name' => 'Argo Pragolo',
                'nik' => '10011243',
                'birth_place' => 'Banyuwangi',
                'birth_date' => '33500',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '453/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'COMMUNICATION', 'valid' => '46698', 'keterangan' => 'Aktif'],
                    ['name' => 'DATA PROCESSING', 'valid' => '46698'],
                    ['name' => 'SURVEILLANCE', 'valid' => '46699'],
                ],
            ],
            [
                'name' => 'Khoirul Miftahul Azis',
                'nik' => '10011131',
                'birth_place' => 'Bangkalan',
                'birth_date' => '33352',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '698/TTP/DNP/VII/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'NAVIGASI', 'valid' => '46726', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Yusri Handoko',
                'nik' => '10011146',
                'birth_place' => 'B.Cermin Hilir',
                'birth_date' => '33367',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '491/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'NAVIGASI', 'valid' => '46698', 'keterangan' => 'Aktif'],
                    ['name' => 'SURVEILLANCE', 'valid' => '46699'],
                ],
            ],
            [
                'name' => 'Yourdan Christian Prihadi',
                'nik' => '10011947',
                'birth_place' => 'Surabaya',
                'birth_date' => '34223',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '429/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'DATA PROCESSING', 'valid' => '46701', 'keterangan' => 'Aktif'],
                    ['name' => 'NAVIGASI', 'valid' => '46684'],
                ],
            ],
            [
                'name' => 'Tria Sabda Utama',
                'nik' => '10011936',
                'birth_place' => 'Sampang',
                'birth_date' => '34153',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '602/TTP/DNP/VI/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'DATA PROCESSING', 'valid' => '46701', 'keterangan' => 'Aktif'],
                    ['name' => 'NAVIGASI', 'valid' => '46684'],
                    ['name' => 'COMMUNICATION', 'valid' => '46696'],
                ],
            ],
            [
                'name' => 'Rhomadoni Surya Kahfi D.',
                'nik' => '10012314',
                'birth_place' => 'Surakarta',
                'birth_date' => '34392',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '573/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'COMMUNICATION', 'valid' => '46726', 'keterangan' => 'Aktif'],
                    ['name' => 'NAVIGASI', 'valid' => '46727'],
                ],
            ],
            [
                'name' => 'Aldhi Deska Perwira',
                'nik' => '10012528',
                'birth_place' => 'Surabaya',
                'birth_date' => '34313',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '353/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'NAVIGASI', 'valid' => '46684', 'keterangan' => 'Aktif'],
                    ['name' => 'DATA PROCESSING', 'valid' => '46817'],
                ],
            ],
            [
                'name' => 'Elvita Agustina',
                'nik' => '10011669',
                'birth_place' => 'Trenggalek',
                'birth_date' => '34183',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '493/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'DATA PROCESSING', 'valid' => '46701', 'keterangan' => 'Aktif'],
                    ['name' => 'COMMUNICATION', 'valid' => '46698'],
                ],
            ],
            [
                'name' => 'I Kadek Dwija Santika',
                'nik' => '10012636',
                'birth_place' => 'Singapadu',
                'birth_date' => '34763',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '346/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'NAVIGASI', 'valid' => '46684', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Dwiki Setyo Widodo',
                'nik' => '10013262',
                'birth_place' => 'Tanjung Morawa',
                'birth_date' => '34994',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '008/TTP/DNP/XI/2016', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'COMMUNICATION', 'valid' => '46696', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Achmad Saiful Bahris',
                'nik' => '10013065',
                'birth_place' => 'Sidoarjo',
                'birth_date' => '32215',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '983/TTP/DNP/VII/2018', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'NAVIGASI', 'valid' => '46726', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Erazuardi Zulfahmi',
                'nik' => '10013923',
                'birth_place' => 'Jakarta',
                'birth_date' => '34117',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '1172/TTP/DNP/VI/2019', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'SURVEILLANCE', 'valid' => '46766', 'keterangan' => 'Aktif'],
                    ['name' => 'NAVIGASI', 'valid' => '46727'],
                ],
            ],
            [
                'name' => 'Septi Rahman Sari',
                'nik' => '10013672',
                'birth_place' => 'Nganjuk',
                'birth_date' => '34602',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '878/TTP/DNP/VIII/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'DATA PROCESSING', 'valid' => '46724', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Dani Ridzal Safii',
                'nik' => '10011977',
                'birth_place' => 'Mojokerto',
                'birth_date' => '33806',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '549/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'NAVIGASI', 'valid' => '46697', 'keterangan' => 'Aktif'],
                    ['name' => 'COMMUNICATION', 'valid' => '46698'],
                ],
            ],
            [
                'name' => 'Rendy Panca Alam Putra',
                'nik' => '10011420',
                'birth_place' => 'Surabaya',
                'birth_date' => '33766',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '495/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'DATA PROCESSING', 'valid' => '46726', 'keterangan' => 'Aktif'],
                    ['name' => 'COMMUNICATION', 'valid' => '46726'],
                ],
            ],
            [
                'name' => 'M. Yusuf Triono',
                'nik' => '10011244',
                'birth_place' => 'Sidoarjo',
                'birth_date' => '33500',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '419/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'COMMUNICATION', 'valid' => '46726', 'keterangan' => 'Aktif'],
                    ['name' => 'DATA PROCESSING', 'valid' => '46702'],
                ],
            ],
            [
                'name' => 'Adam Bukhori',
                'nik' => '10011050',
                'birth_place' => 'Jombang',
                'birth_date' => '33224',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '693/TTP/DNP/VII/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'NAVIGASI', 'valid' => '46677', 'keterangan' => 'Aktif'],
                    ['name' => 'COMMUNICATION', 'valid' => '46687'],
                ],
            ],
            [
                'name' => 'Pandu Indrajaya Pangestu',
                'nik' => '10013632',
                'birth_place' => 'Pontianak',
                'birth_date' => '35343',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknisi Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '872/TTP/DNP/VIII/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'DATA PROCESSING', 'valid' => '46703', 'keterangan' => 'Aktif'],
                    ['name' => 'SURVEILLANCE', 'valid' => '46666'],
                ],
            ],
            [
                'name' => 'Moch. Ichsan',
                'nik' => '10083472',
                'birth_place' => 'Surabaya',
                'birth_date' => '27052',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Supervisor Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '347/TTP/DNP/V/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'NAVIGASI', 'valid' => '46684', 'keterangan' => 'Aktif'],
                    ['name' => 'SURVEILLANCE', 'valid' => '46689'],
                ],
            ],
            [
                'name' => 'Silvy Retno Andriani',
                'nik' => '10011400',
                'birth_place' => 'Pasuruan',
                'birth_date' => '33731',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '072/TTP/DNP/XII/2016', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'DATA PROCESSING', 'valid' => '46706', 'keterangan' => 'Aktif'],
                    ['name' => 'COMMUNICATION', 'valid' => '46706'],
                ],
            ],
            [
                'name' => 'Windi Tri Setyawati',
                'nik' => '10012098',
                'birth_place' => 'Jombang',
                'birth_date' => '34233',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '0369/TTP/DNP/X/2023', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'COMMUNICATION', 'valid' => '46713', 'keterangan' => 'Aktif'],
                    ['name' => 'NAVIGASI', 'valid' => '46713'],
                ],
            ],
            [
                'name' => 'Nur Shella Firdaus',
                'nik' => '10012000',
                'birth_place' => 'Bojonegoro',
                'birth_date' => '34218',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '0605/TTP/DNP/X/2023', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'COMMUNICATION', 'valid' => '46696', 'keterangan' => 'Aktif'],
                    ['name' => 'NAVIGASI', 'valid' => '46684'],
                    ['name' => 'DATA PROCESSING', 'valid' => '46707'],
                ],
            ],
            [
                'name' => 'Safira Saraswati',
                'nik' => '10012108',
                'birth_place' => 'Surabaya',
                'birth_date' => '34435',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '0870/TTP/DNP/X/2023', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'NAVIGASI', 'valid' => '46697', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Amirzan Ridho Wicaksono',
                'nik' => '10012337',
                'birth_place' => 'Jombang',
                'birth_date' => '34429',
                'unit_kerja' => Employee::UNIT_CNSD,
                'jabatan' => 'Teknik Telekomunikasi',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '0953/TTP/DNP/X/2023', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'COMMUNICATION', 'valid' => '46674', 'keterangan' => 'Aktif'],
                    ['name' => 'SURVEILLANCE', 'valid' => '46666'],
                    ['name' => 'NAVIGASI', 'valid' => '46674'],
                ],
            ],
            [
                'name' => 'Fajar Kusuma Wardana',
                'nik' => '10010842',
                'birth_place' => 'Sidoarjo',
                'birth_date' => '32777',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Supervisor Teknik Fas. Penunjang',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '0197/A-LBU/III/2012', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'GNS', 'valid' => '44734', 'keterangan' => 'Aktif'],
                    ['name' => 'TRD', 'valid' => '44221'],
                ],
            ],
            [
                'name' => 'Priyoko',
                'nik' => '10010503',
                'birth_place' => 'Tuban',
                'birth_date' => '31441',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Supervisor Teknik Fas. Penunjang',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '0921/A-LBU/IX/2015', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'GNS', 'valid' => '44818', 'keterangan' => 'Aktif'],
                    ['name' => 'TRD', 'valid' => '44951'],
                    ['name' => 'PSS', 'valid' => '44492'],
                ],
            ],
            [
                'name' => 'Dwi Puji Rahayu',
                'nik' => '10011358',
                'birth_place' => 'Bantaeng',
                'birth_date' => '33659',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Teknisi Fasilitas Penunjang',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '0509/A-LBU/VIII/2013', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'TRD', 'valid' => '44801', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Fajar Nugroho',
                'nik' => '10013494',
                'birth_place' => 'Tangerang',
                'birth_date' => '35216',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Teknisi Fasilitas Penunjang',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '1123/A-LBU/IX/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'GNS', 'valid' => '44457', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Sofi Dwi Hidayati',
                'nik' => '10010992',
                'birth_place' => 'Surabaya',
                'birth_date' => '33110',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Teknisi Fasilitas Penunjang',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '0964/A-LBU/X/2015', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'TRD', 'valid' => '44751', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Andhika Bhaskara Jaya',
                'nik' => '10011421',
                'birth_place' => 'Pasuruan',
                'birth_date' => '33768',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Teknisi Fasilitas Penunjang',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '0536/A-LBU/X/2013', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'TRD', 'valid' => '44524', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Agustina Anggraeni',
                'nik' => '10010825',
                'birth_place' => 'Denpasar',
                'birth_date' => '32721',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Teknisi Fasilitas Penunjang',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '0396/A-LBU/VIII/2012', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'TRD', 'valid' => '44751', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Iqbal Mustika',
                'nik' => '10011841',
                'birth_place' => 'Tegal',
                'birth_date' => '32339',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Teknisi Fasilitas Penunjang',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '1035/A-LBU/I/2016', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'TRD', 'valid' => '44491', 'keterangan' => 'Aktif'],
                    ['name' => 'PSS', 'valid' => '44491'],
                ],
            ],
            [
                'name' => 'Karang Samudra',
                'nik' => '10013147',
                'birth_place' => 'Sidoarjo',
                'birth_date' => '28321',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Teknisi Fasilitas Penunjang',
                'licenses' => [
                    ['name' => 'TERAMPIL', 'number' => '0227/T-LBU/XII/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'PSS', 'valid' => '44550', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Ilmin Syarif H.',
                'nik' => '10013140',
                'birth_place' => 'Bangkalan',
                'birth_date' => '32752',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Teknisi Fasilitas Penunjang',
                'licenses' => [
                    ['name' => 'TERAMPIL', 'number' => '0225/T-LBU/XII/2017', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'PSS', 'valid' => '44550', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Ahmad Muji Yasin',
                'nik' => '10013883',
                'birth_place' => 'Bekasi',
                'birth_date' => '34443',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Teknisi Fasilitas Penunjang',
                'licenses' => [
                    ['name' => 'TERAMPIL', 'number' => '0015/DBU/T.LBU/V/2019', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'PSS', 'valid' => '45073', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'Frisza Vradana',
                'nik' => '10011034',
                'birth_place' => 'Lamongan',
                'birth_date' => '33202',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Teknisi Fasilitas Penunjang',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '0575/A-MBU/V/2018', 'valid' => 'SEUMUR HIDUP'],
                    ['name' => null, 'number' => '0413/A-LBU/VIII/2012', 'valid' => null],
                ],
                'ratings' => [
                    ['name' => 'TQM', 'valid' => '44705', 'keterangan' => 'Aktif'],
                    ['name' => 'TRD', 'valid' => '44535'],
                ],
            ],
            [
                'name' => 'Muh. Feizar Noor',
                'nik' => '10010916',
                'birth_place' => 'U. Pandang',
                'birth_date' => '32932',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Teknisi Fasilitas Penunjang',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '0218/A-LBU/IV/2012', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'TRD', 'valid' => '44535', 'keterangan' => 'Aktif'],
                ],
            ],
            [
                'name' => 'M. Aidin Effendi',
                'nik' => '10012258',
                'birth_place' => 'Sidoarjo',
                'birth_date' => '34120',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Teknisi Fasilitas Penunjang',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '0327/A-LBU/IX/2015', 'valid' => 'SEUMUR HIDUP'],
                    ['name' => null, 'number' => '0937/A-MBU/IX/2015', 'valid' => null],
                ],
                'ratings' => [
                    ['name' => 'TRD', 'valid' => '44085', 'keterangan' => 'Aktif'],
                    ['name' => 'ACS', 'valid' => '44085'],
                ],
            ],
            [
                'name' => 'Yoga Arifal Pratama',
                'nik' => '10012400',
                'birth_place' => 'Sidoarjo',
                'birth_date' => '34548',
                'unit_kerja' => Employee::UNIT_TFP,
                'jabatan' => 'Teknisi Fasilitas Penunjang',
                'licenses' => [
                    ['name' => 'AHLI', 'number' => '0340/A-LBU/IX/2015', 'valid' => 'SEUMUR HIDUP'],
                ],
                'ratings' => [
                    ['name' => 'TRD', 'valid' => '44815', 'keterangan' => 'Aktif'],
                    ['name' => 'ACS', 'valid' => '44815'],
                ],
            ],
        ];
    }
}