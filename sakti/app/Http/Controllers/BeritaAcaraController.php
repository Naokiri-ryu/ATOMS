<?php

namespace App\Http\Controllers;

use App\Models\BeritaAcara;
use App\Models\Borrowing;
use App\Models\Installation;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BeritaAcaraController extends Controller
{
    /**
     * Display paginated list of berita acara with filters.
     * Used by both admin and teknisi.
     */
    public function index(Request $request)
    {
        $query = BeritaAcara::with('user');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        $beritaAcara = $query->latest()->paginate(10)->withQueryString();

        // Append computed attributes
        $beritaAcara->getCollection()->transform(function ($ba) {
            $ba->type_label = $ba->type_label;
            $ba->formatted_size = $ba->formatted_size;
            return $ba;
        });

        $user = $request->user();
        $prefix = $user->isAdmin() ? 'admin' : 'teknisi';

        return Inertia::render("{$prefix}/berita-acara/index", [
            'beritaAcara' => $beritaAcara,
            'filters' => $request->only(['type', 'search']),
            'canDelete' => $user->isAdmin(),
        ]);
    }

    /**
     * Taruh file TTD di: storage/app/public/signatures/managers/<key>.png
     */
    private const MANAGER_SIGNATURES = [
        'Dudik Fahrudin Sukarno' => 'signatures/managers/dudik_fahrudin_sukarno.png',
        'Andi Wibowo' => 'signatures/managers/andi_wibowo.png',
        'Efried Nara Perkasa' => 'signatures/managers/efried_nara_perkasa.png',
        'Alam Fahmi' => 'signatures/managers/alam_fahmi.png',
        'Netty Septa Cristila' => 'signatures/managers/netty_septa_cristila.png',
    ];

    /**
     * Buat slug nama untuk nama file TTD teknisi.
     */
    private function nameToSlug(string $name): string
    {
        return strtolower(preg_replace('/\s+/', '_', trim($name)));
    }

    /**
     * Build nomor BA from the auto prefix and optional manual suffix.
     */
    private function buildNomorBa(string $type, ?string $suffix): string
    {
        $nomorPrefix = BeritaAcara::generateNomor($type);
        $suffix = trim((string) $suffix);

        if ($suffix === '') {
            return BeritaAcara::completeNomor($nomorPrefix, $type);
        }

        return $nomorPrefix . '/' . ltrim($suffix, '/');
    }

    /**
     * Build the GTT suffix part when the user leaves it empty.
     * Format: GTT-01/06/LPPNPI/TEK/V/2026
     */
    private function buildAutomaticNomorSuffix(string $nomorPrefix): string
    {
        return BeritaAcara::generateNomorSuffix($nomorPrefix);
    }

    /**
     * Resolve nomor BA from either the old full-number field or the current
     * suffix field. Empty input always falls back to the automatic number.
     */
    private function resolveNomorBa(Request $request): string
    {
        $manualNomor = trim((string) $request->input('nomor_ba'));

        if ($manualNomor !== '') {
            return BeritaAcara::completeNomor($manualNomor, $request->type);
        }

        return $this->buildNomorBa($request->type, $request->input('nomor_suffix'));
    }

    /**
     * Generate PDF Berita Acara with Digital Signature.
     */
    public function generate(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:pemasangan,pelepasan,serah_terima',
            'description' => 'nullable|string',
            'nomor_ba' => 'nullable|string|max:150',
            'nomor_suffix' => 'nullable|string|max:100',
            'item_keterangan' => 'nullable|string|max:255',
            'signers' => 'required|array|min:1',
            'signers.*.name' => 'required|string|max:255',
            'signers.*.title' => 'nullable|string|max:255',
            'manager_name' => 'nullable|string|max:255',
            'manager_title' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'item_merk' => 'nullable|string|max:255',
            'signature' => 'nullable|string',
            'reference_id' => 'nullable|integer',
            'reference_type' => 'nullable|string',
        ]);

        // 1. Get Reference Data (Installation or Borrowing)
        $itemData = [
            'item_name' => 'N/A',
            'item_code' => 'N/A',
            'item_category' => 'N/A',
            'item_merk' => null,
            'item_serial' => null,
            'item_keterangan' => null,
            'quantity' => 0,
            'location' => $request->location ?? '-',
        ];

        $photoFullPath = null;

        if ($request->reference_type === 'Installation') {
            $ref = Installation::with('item.category')->find($request->reference_id);
            if ($ref) {
                $itemData = array_merge($itemData, [
                    'item_name' => $ref->item->name,
                    'item_code' => $ref->item->code_unique,
                    'item_category' => $ref->item->category->name,
                    'item_merk' => $request->filled('item_merk') ? $request->item_merk : ($ref->item->product_number ?? null),
                    'item_serial' => $ref->item->serial_number,
                    'quantity' => $ref->quantity,
                    'location' => $request->location ?? $ref->location ?? '-',
                ]);
                if ($ref->photo_path) {
                    $photoFullPath = storage_path('app/public/' . $ref->photo_path);
                }
            }
        } elseif ($request->reference_type === 'Borrowing') {
            $ref = Borrowing::with('item.category')->find($request->reference_id);
            if ($ref) {
                $itemData = array_merge($itemData, [
                    'item_name' => $ref->item->name,
                    'item_code' => $ref->item->code_unique,
                    'item_category' => $ref->item->category->name,
                    'item_merk' => $request->filled('item_merk') ? $request->item_merk : ($ref->item->product_number ?? null),
                    'item_serial' => $ref->item->serial_number,
                    'quantity' => $ref->quantity,
                    'location' => $request->location ?? 'Peminjaman Peralatan',
                ]);
                if ($ref->borrow_photo_path) {
                    $photoFullPath = storage_path('app/public/' . $ref->borrow_photo_path);
                }
            }
        }

        // 2. Resolve TTD untuk setiap teknisi
        $signersData = [];
        foreach ($request->signers as $signer) {
            $slug = $this->nameToSlug($signer['name']);
            $staticRel = 'signatures/teknisi/' . $slug . '.png';
            $sigPath = Storage::disk('public')->exists($staticRel)
                ? storage_path('app/public/' . $staticRel)
                : null;
            $signersData[] = [
                'name' => $signer['name'],
                'title' => $signer['title'] ?? 'Teknisi Telekomunikasi Penerbangan',
                'signature_path' => $sigPath,
            ];
        }

        // Untuk backward-compat (signer_name dipakai di DB record)
        $primarySigner = $signersData[0];
        $signaturePath = null; // tidak disimpan per-signer di DB, cukup nama

        // 2b. Resolve TTD Manager (dari file statis jika tersedia)
        $managerSignatureFullPath = null;
        if ($request->filled('manager_name')) {
            $managerSigRelative = self::MANAGER_SIGNATURES[$request->manager_name] ?? null;
            if ($managerSigRelative && Storage::disk('public')->exists($managerSigRelative)) {
                $managerSignatureFullPath = storage_path('app/public/' . $managerSigRelative);
            }
        }

        // 3. Build tanggal dalam Bahasa Indonesia
        $now = now();
        $hariId = [
            'Sunday' => 'Minggu',
            'Monday' => 'Senin',
            'Tuesday' => 'Selasa',
            'Wednesday' => 'Rabu',
            'Thursday' => 'Kamis',
            'Friday' => 'Jumat',
            'Saturday' => 'Sabtu',
        ];
        $bulanId = [
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember',
        ];
        $angkaHuruf = [
            1 => 'Satu',
            2 => 'Dua',
            3 => 'Tiga',
            4 => 'Empat',
            5 => 'Lima',
            6 => 'Enam',
            7 => 'Tujuh',
            8 => 'Delapan',
            9 => 'Sembilan',
            10 => 'Sepuluh',
            11 => 'Sebelas',
            12 => 'Dua Belas',
            13 => 'Tiga Belas',
            14 => 'Empat Belas',
            15 => 'Lima Belas',
            16 => 'Enam Belas',
            17 => 'Tujuh Belas',
            18 => 'Delapan Belas',
            19 => 'Sembilan Belas',
            20 => 'Dua Puluh',
            21 => 'Dua Puluh Satu',
            22 => 'Dua Puluh Dua',
            23 => 'Dua Puluh Tiga',
            24 => 'Dua Puluh Empat',
            25 => 'Dua Puluh Lima',
            26 => 'Dua Puluh Enam',
            27 => 'Dua Puluh Tujuh',
            28 => 'Dua Puluh Delapan',
            29 => 'Dua Puluh Sembilan',
            30 => 'Tiga Puluh',
            31 => 'Tiga Puluh Satu',
        ];
        $tahunHuruf = [
            2024 => 'Dua Ribu Dua Puluh Empat',
            2025 => 'Dua Ribu Dua Puluh Lima',
            2026 => 'Dua Ribu Dua Puluh Enam',
            2027 => 'Dua Ribu Dua Puluh Tujuh',
            2028 => 'Dua Ribu Dua Puluh Delapan',
        ];

        $tanggalData = [
            'hari' => $hariId[$now->format('l')] ?? $now->format('l'),
            'tanggal_huruf' => $angkaHuruf[(int) $now->format('j')] ?? $now->format('j'),
            'bulan_huruf' => $bulanId[(int) $now->format('n')] ?? $now->format('F'),
            'tahun_huruf' => $tahunHuruf[$now->year] ?? $now->year,
            'tanggal_angka' => $now->format('d-m-Y'),
        ];

        // 4. Teknisi list for signature section
        $teknisiList = collect($request->signers)->pluck('name')->toArray();

        // 5. Generate nomor BA. Jika input nomor kosong, tetap pakai prefix otomatis.
        $nomorBa = $this->resolveNomorBa($request);

        // 6. Prepare PDF Data
        $data = array_merge($itemData, $tanggalData, [
            'nomor_ba' => $nomorBa,
            'title' => $request->title,
            'type' => $request->type,
            'type_label' => match ($request->type) {
                'pemasangan' => 'Pemasangan',
                'pelepasan' => 'Pelepasan',
                'serah_terima' => 'Serah Terima',
                default => $request->type,
            },
            'description' => $request->description,
            'item_keterangan' => $request->item_keterangan ?? $itemData['item_keterangan'],
            'signer_name' => $primarySigner['name'],
            'signer_title' => $primarySigner['title'],
            'manager_name' => $request->manager_name,
            'manager_title' => $request->manager_title ?? 'MANAGER TEKNIK',
            'signers_data' => $signersData,
            'signature_path' => $primarySigner['signature_path'],
            'manager_signature_path' => $managerSignatureFullPath,
            'photo_path' => $photoFullPath,
            'location_now' => 'Ruangan Depo Sparepart',
            'logo_path' => public_path('logo-airnav.jpg'),
        ]);

        // 7. Generate PDF
        $pdf = Pdf::loadView('pdf.berita-acara', $data)->setPaper('a4', 'landscape');
        $fileName = 'BA_' . time() . '_' . str_replace(' ', '_', $request->title) . '.pdf';
        $filePath = 'berita-acara/' . $fileName;

        Storage::disk('public')->put($filePath, $pdf->output());

        // 8. Create Database Record
        BeritaAcara::create([
            'user_id' => auth()->id(),
            'nomor_ba' => $nomorBa,
            'title' => $request->title,
            'type' => $request->type,
            'description' => $request->description,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_size' => Storage::disk('public')->size($filePath),
            'signer_name' => collect($signersData)->pluck('name')->implode(', '),
            'manager_name' => $request->manager_name,
            'location' => $request->location,
            'signature_path' => $signaturePath,
            'reference_id' => $request->reference_id,
            'reference_type' => $request->reference_type,
        ]);

        return redirect()->back()->with('success', 'Berita Acara berhasil di-generate dan disimpan.');
    }

    /**
     * Store a newly uploaded berita acara.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:pemasangan,pelepasan,serah_terima',
            'description' => 'nullable|string|max:1000',
            'file' => 'required|file|mimes:pdf,doc,docx|max:2048',
        ]);

        $file = $request->file('file');
        $path = $file->store('berita-acara', 'public');

        BeritaAcara::create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'type' => $validated['type'],
            'description' => $validated['description'] ?? null,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
        ]);

        return redirect()->back()->with('success', 'Berita Acara berhasil diupload.');
    }

    /**
     * Download the berita acara file.
     */
    public function download(BeritaAcara $beritaAcara)
    {
        $fullPath = Storage::disk('public')->path($beritaAcara->file_path);

        if (!Storage::disk('public')->exists($beritaAcara->file_path)) {
            return redirect()->back()->with('error', 'File tidak ditemukan.');
        }

        return response()->download($fullPath, $beritaAcara->file_name);
    }

    /**
     * Delete a berita acara (admin only — enforced by route middleware).
     */
    public function destroy(BeritaAcara $beritaAcara)
    {
        // Delete file from storage
        if (Storage::disk('public')->exists($beritaAcara->file_path)) {
            Storage::disk('public')->delete($beritaAcara->file_path);
        }

        if ($beritaAcara->signature_path && Storage::disk('public')->exists($beritaAcara->signature_path)) {
            Storage::disk('public')->delete($beritaAcara->signature_path);
        }

        $beritaAcara->delete();

        return redirect()->back()->with('success', 'Berita Acara berhasil dihapus.');
    }

    protected function saveBase64Image(string $base64, string $directory): string
    {
        $base64 = preg_replace('/^data:image\/\w+;base64,/', '', $base64);
        $imageData = base64_decode($base64);
        $filename = $directory . '/' . uniqid() . '_' . time() . '.png';
        Storage::disk('public')->put($filename, $imageData);
        return $filename;
    }
}
