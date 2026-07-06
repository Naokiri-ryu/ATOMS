<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Item;
use App\Models\ItemHistory;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ItemController extends Controller
{
    public function index(Request $request)
    {
        $query = Item::with('category');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $query->where('name', 'ilike', '%' . $request->search . '%');
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $items = $query->latest()->paginate(10)->withQueryString();

        // Add available_quantity to each item
        $items->getCollection()->transform(function ($item) {
            $item->available_quantity = $item->available_quantity;
            return $item;
        });

        $categories = Category::orderBy('name')->get();

        return Inertia::render('admin/items/index', [
            'items' => $items,
            'categories' => $categories,
            'filters' => $request->only(['type', 'search', 'category_id']),
        ]);
    }

    public function create()
    {
        $categories = Category::orderBy('name')->get();

        return Inertia::render('admin/items/create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'type' => 'required|in:peralatan,komponen,asset',
            'quantity' => 'required|integer|min:0',
            'min_stock' => 'nullable|integer|min:0',
            'product_number' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:5120',
        ]);

        $item = Item::create([
            'name' => $validated['name'],
            'category_id' => $validated['category_id'],
            'type' => $validated['type'],
            'quantity' => $validated['quantity'],
            'min_stock' => $validated['min_stock'] ?? 5,
            'product_number' => $validated['product_number'] ?? null,
            'serial_number' => $validated['serial_number'] ?? null,
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('items', 'public');
            $item->update(['image_path' => $path]);
        }

        // Generate QR Code
        $this->generateQrCode($item);

        // Record item history
        ItemHistory::create([
            'item_id' => $item->id,
            'user_id' => auth()->id(),
            'action' => 'dibuat',
            'old_data' => null,
            'new_data' => [
                'name' => $item->name,
                'type' => $item->type,
                'quantity' => $item->quantity,
                'min_stock' => $item->min_stock,
                'product_number' => $item->product_number,
                'serial_number' => $item->serial_number,
            ],
            'notes' => 'Barang baru ditambahkan ke sistem.',
        ]);

        return redirect()->route('admin.items.show', $item)
            ->with('success', 'Barang berhasil ditambahkan. Silakan cetak QR Code di bawah.');
    }

    public function show(Item $item)
    {
        $item->load('category');
        $item->available_quantity = $item->available_quantity;
        $item->is_low_stock = $item->is_low_stock;

        // Load item change histories
        $histories = $item->itemHistories()->with('user')->get();

        // Load borrowing history for this item
        $borrowingHistory = $item->borrowings()
            ->with('user')
            ->latest('borrowed_at')
            ->get();

        // Load installation history for this item
        $installationHistory = $item->installations()
            ->with(['user', 'approvedBy'])
            ->get();

        return Inertia::render('admin/items/show', [
            'item' => $item,
            'histories' => $histories,
            'borrowingHistory' => $borrowingHistory,
            'installationHistory' => $installationHistory,
        ]);
    }

    public function edit(Item $item)
    {
        $categories = Category::orderBy('name')->get();

        return Inertia::render('admin/items/edit', [
            'item' => $item,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'type' => 'required|in:peralatan,komponen,asset',
            'quantity' => 'required|integer|min:0',
            'min_stock' => 'nullable|integer|min:0',
            'product_number' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:5120',
        ]);

        // Capture old data for history before updating
        $oldData = [
            'name' => $item->name,
            'type' => $item->type,
            'quantity' => $item->quantity,
            'min_stock' => $item->min_stock,
            'product_number' => $item->product_number,
            'serial_number' => $item->serial_number,
            'category_id' => $item->category_id,
        ];

        $item->update([
            'name' => $validated['name'],
            'category_id' => $validated['category_id'],
            'type' => $validated['type'],
            'quantity' => $validated['quantity'],
            'min_stock' => $validated['min_stock'] ?? $item->min_stock,
            'product_number' => $validated['product_number'] ?? null,
            'serial_number' => $validated['serial_number'] ?? null,
        ]);

        if ($request->hasFile('image')) {
            // Delete old image
            if ($item->image_path) {
                Storage::disk('public')->delete($item->image_path);
            }
            $path = $request->file('image')->store('items', 'public');
            $item->update(['image_path' => $path]);
        }

        $newData = [
            'name' => $item->name,
            'type' => $item->type,
            'quantity' => $item->quantity,
            'min_stock' => $item->min_stock,
            'product_number' => $item->product_number,
            'serial_number' => $item->serial_number,
            'category_id' => $item->category_id,
        ];

        // Determine action type based on quantity change
        $action = 'diperbarui';
        if ($newData['quantity'] > $oldData['quantity']) {
            $action = 'stok_bertambah';
        } elseif ($newData['quantity'] < $oldData['quantity']) {
            $action = 'stok_berkurang';
        }

        ItemHistory::create([
            'item_id' => $item->id,
            'user_id' => auth()->id(),
            'action' => $action,
            'old_data' => $oldData,
            'new_data' => $newData,
            'notes' => 'Data barang diperbarui.',
        ]);

        return redirect()->route('admin.items.show', $item)
            ->with('success', 'Barang berhasil diperbarui.');
    }

    public function destroy(Item $item)
    {
        // Check if there are active borrowings
        if ($item->activeBorrowings()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Barang tidak dapat dihapus karena sedang dipinjam.');
        }

        // Delete associated files
        if ($item->image_path) {
            Storage::disk('public')->delete($item->image_path);
        }
        if ($item->qr_code_path) {
            Storage::disk('public')->delete($item->qr_code_path);
        }

        $item->delete();

        return redirect()->route('admin.items.index')
            ->with('success', 'Barang berhasil dihapus.');
    }

    public function qrCode(Item $item)
    {
        $options = new QROptions([
            'outputType' => QRCode::OUTPUT_MARKUP_SVG,
            'eccLevel' => QRCode::ECC_M,
            'scale' => 10,
            'imageBase64' => false,
        ]);

        $qrCode = new QRCode($options);
        $svg = $qrCode->render($item->code_unique);

        return response($svg, 200, ['Content-Type' => 'image/svg+xml']);
    }

    protected function generateQrCode(Item $item): void
    {
        $options = new QROptions([
            'outputType' => QRCode::OUTPUT_MARKUP_SVG,
            'eccLevel' => QRCode::ECC_M,
            'scale' => 10,
            'imageBase64' => false, // Get raw SVG markup instead of data URI
        ]);

        $qrCode = new QRCode($options);
        $svg = $qrCode->render($item->code_unique);

        $filename = 'qrcodes/' . $item->code_unique . '.svg';
        Storage::disk('public')->put($filename, $svg);

        $item->update(['qr_code_path' => $filename]);
    }

    /**
     * Get export metadata (title, subtitle, filename prefix) based on type filter.
     */
    private function getExportMeta(string $type): array
    {
        return match ($type) {
            'asset' => [
                'title' => 'SAKTI — Data Inventaris Asset',
                'subtitle' => 'Daftar Asset Tetap',
                'sheet' => 'Data Asset',
                'prefix' => 'data_asset_sakti',
            ],
            'equipment' => [
                'title' => 'SAKTI — Data Inventaris Peralatan & Komponen',
                'subtitle' => 'Daftar Peralatan dan Komponen',
                'sheet' => 'Data Peralatan & Komponen',
                'prefix' => 'data_peralatan_komponen_sakti',
            ],
            default => [
                'title' => 'SAKTI — Data Inventaris Barang',
                'subtitle' => 'Semua Barang',
                'sheet' => 'Data Barang',
                'prefix' => 'data_barang_sakti',
            ],
        };
    }

    /**
     * Get the human-readable type label.
     */
    private function typeLabel(string $type): string
    {
        return match ($type) {
            'peralatan' => 'Peralatan',
            'komponen' => 'Komponen',
            'asset' => 'Asset',
            default => $type,
        };
    }

    /**
     * Build the item query filtered by export type.
     */
    private function exportQuery(string $type)
    {
        $query = Item::with('category')->orderBy('name');

        return match ($type) {
            'asset' => $query->where('type', 'asset'),
            'equipment' => $query->whereIn('type', ['peralatan', 'komponen']),
            default => $query,
        };
    }

    public function exportExcel(Request $request)
    {
        $type = $request->query('type', 'all'); // 'asset', 'equipment', or 'all'
        $meta = $this->getExportMeta($type);
        $items = $this->exportQuery($type)->get();

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle($meta['sheet']);

        // ===== Title Row =====
        $sheet->mergeCells('A1:I1');
        $sheet->setCellValue('A1', $meta['title']);
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->getColor()->setRGB('0284C7');
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A2:I2');
        $sheet->setCellValue('A2', 'Dicetak: ' . now()->format('d/m/Y H:i:s') . ' | Total: ' . $items->count() . ' barang');
        $sheet->getStyle('A2')->getFont()->setSize(10)->getColor()->setRGB('64748B');
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        // ===== Header Row (Row 4) =====
        $headers = ['No', 'Nama Barang', 'Kode Unik', 'Kategori', 'Jenis', 'Total Stok', 'Tersedia', 'Dipinjam', 'Tanggal Dibuat'];
        $columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

        foreach ($headers as $i => $header) {
            $sheet->setCellValue($columns[$i] . '4', $header);
        }

        // Header styling - blue background, white bold text
        $headerStyle = $sheet->getStyle('A4:I4');
        $headerStyle->getFont()->setBold(true)->setSize(11)->getColor()->setRGB('FFFFFF');
        $headerStyle->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setRGB('0284C7');
        $headerStyle->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
        $headerStyle->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN)->getColor()->setRGB('FFFFFF');

        // ===== Data Rows =====
        $row = 5;
        foreach ($items as $index => $item) {
            $borrowed = $item->quantity - $item->available_quantity;

            $sheet->setCellValue('A' . $row, $index + 1);
            $sheet->setCellValue('B' . $row, $item->name);
            $sheet->setCellValueExplicit('C' . $row, $item->code_unique, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->setCellValue('D' . $row, $item->category?->name ?? '-');
            $sheet->setCellValue('E' . $row, $this->typeLabel($item->type));
            $sheet->setCellValue('F' . $row, $item->quantity);
            $sheet->setCellValue('G' . $row, $item->available_quantity);
            $sheet->setCellValue('H' . $row, $borrowed);
            $sheet->setCellValue('I' . $row, $item->created_at->format('d/m/Y H:i'));

            // Center align number columns
            foreach (['A', 'F', 'G', 'H'] as $col) {
                $sheet->getStyle($col . $row)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
            }
            $sheet->getStyle('E' . $row)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            // Alternating row color
            if ($index % 2 === 1) {
                $sheet->getStyle("A{$row}:I{$row}")->getFill()
                    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('F8FAFC');
            }

            // Color-code stock
            if ($item->available_quantity <= 0) {
                $sheet->getStyle('G' . $row)->getFont()->setBold(true)->getColor()->setRGB('DC2626');
            } else {
                $sheet->getStyle('G' . $row)->getFont()->setBold(true)->getColor()->setRGB('16A34A');
            }
            if ($borrowed > 0) {
                $sheet->getStyle('H' . $row)->getFont()->setBold(true)->getColor()->setRGB('D97706');
            }

            $row++;
        }

        // ===== Borders for data =====
        $lastRow = $row - 1;
        if ($lastRow >= 5) {
            $sheet->getStyle("A4:I{$lastRow}")->getBorders()->getAllBorders()
                ->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN)
                ->getColor()->setRGB('E2E8F0');
        }

        // ===== Summary Row =====
        $sumRow = $row + 1;
        $sheet->mergeCells("A{$sumRow}:E{$sumRow}");
        $sheet->setCellValue("A{$sumRow}", 'TOTAL');
        $sheet->setCellValue("F{$sumRow}", $items->sum('quantity'));
        $sheet->setCellValue("G{$sumRow}", $items->sum('available_quantity'));
        $sheet->setCellValue("H{$sumRow}", $items->sum('quantity') - $items->sum('available_quantity'));

        $sumStyle = $sheet->getStyle("A{$sumRow}:I{$sumRow}");
        $sumStyle->getFont()->setBold(true)->setSize(11);
        $sumStyle->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setRGB('F0F9FF');
        $sumStyle->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN)->getColor()->setRGB('0284C7');
        foreach (['A', 'F', 'G', 'H'] as $col) {
            $sheet->getStyle($col . $sumRow)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
        }

        // ===== Column Widths =====
        $sheet->getColumnDimension('A')->setWidth(6);
        $sheet->getColumnDimension('B')->setWidth(28);
        $sheet->getColumnDimension('C')->setWidth(18);
        $sheet->getColumnDimension('D')->setWidth(20);
        $sheet->getColumnDimension('E')->setWidth(14);
        $sheet->getColumnDimension('F')->setWidth(12);
        $sheet->getColumnDimension('G')->setWidth(12);
        $sheet->getColumnDimension('H')->setWidth(12);
        $sheet->getColumnDimension('I')->setWidth(18);

        // ===== Freeze header =====
        $sheet->freezePane('A5');

        // ===== Write to temp file and return =====
        $filename = $meta['prefix'] . '_' . date('Y-m-d') . '.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), 'sakti_');

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $writer->save($tempFile);

        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function exportPdf(Request $request)
    {
        $type = $request->query('type', 'all'); // 'asset', 'equipment', or 'all'
        $meta = $this->getExportMeta($type);
        $items = $this->exportQuery($type)->get()->map(function ($item) {
            $item->available_quantity = $item->available_quantity;
            $item->borrowed_count = $item->quantity - $item->available_quantity;
            return $item;
        });

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('exports.items-pdf', [
            'items' => $items,
            'generatedAt' => now()->format('d/m/Y H:i:s'),
            'exportTitle' => $meta['title'],
            'exportSubtitle' => $meta['subtitle'],
        ]);

        $pdf->setPaper('a4', 'landscape');

        return $pdf->download($meta['prefix'] . '_' . date('Y-m-d') . '.pdf');
    }
}
