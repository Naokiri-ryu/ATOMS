<?php

namespace App\Http\Controllers;

use App\Models\Installation;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class InstallationController extends Controller
{
    // ==================== ADMIN METHODS ====================

    public function index(Request $request)
    {
        $query = Installation::with(['item.category', 'user', 'approvedBy']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', fn($q2) => $q2->where('name', 'ilike', "%$search%"))
                  ->orWhereHas('item', fn($q2) => $q2->where('name', 'ilike', "%$search%"));
            });
        }

        $installations = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('admin/installations/index', [
            'installations' => $installations,
            'filters'       => $request->only(['status', 'search']),
            'pendingCount'  => Installation::where('status', 'menunggu_approval')->count(),
        ]);
    }

    public function approve(Request $request, Installation $installation)
    {
        if ($installation->status !== 'menunggu_approval') {
            return redirect()->back()->with('error', 'Pengajuan ini sudah diproses.');
        }

        $item = $installation->item;

        // Check stock availability
        if ($item->available_quantity < $installation->quantity) {
            return redirect()->back()->with('error', 'Stok tidak mencukupi. Tersedia: ' . $item->available_quantity);
        }

        $installation->update([
            'status'      => 'disetujui',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'installed_at' => now(),
        ]);

        // Record stock change in item history
        $oldQty = $item->available_quantity;
        \App\Models\ItemHistory::create([
            'item_id'  => $item->id,
            'user_id'  => auth()->id(),
            'action'   => 'stok_berkurang',
            'old_data' => ['available_quantity' => $oldQty],
            'new_data' => ['available_quantity' => $oldQty - $installation->quantity],
            'notes'    => "Pemasangan disetujui oleh admin. Pengajuan oleh: {$installation->user->name}. Lokasi: {$installation->location}",
        ]);

        return redirect()->back()->with('success', 'Pemasangan berhasil disetujui.');
    }

    public function reject(Request $request, Installation $installation)
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        if ($installation->status !== 'menunggu_approval') {
            return redirect()->back()->with('error', 'Pengajuan ini sudah diproses.');
        }

        $installation->update([
            'status'           => 'ditolak',
            'approved_by'      => auth()->id(),
            'approved_at'      => now(),
            'rejection_reason' => $request->rejection_reason,
        ]);

        return redirect()->back()->with('success', 'Pengajuan pemasangan ditolak.');
    }

    public function adminDestroy(Installation $installation)
    {
        if ($installation->photo_path) {
            Storage::disk('public')->delete($installation->photo_path);
        }
        $installation->delete();

        return redirect()->back()->with('success', 'Log pemasangan berhasil dihapus.');
    }

    // ==================== TEKNISI METHODS ====================

    public function createPage(Request $request)
    {
        // Pre-populate item if code is passed from QR scan
        $item = null;
        if ($request->filled('code')) {
            $item = Item::with('category')
                ->where('code_unique', $request->code)
                ->whereIn('type', ['komponen', 'asset'])
                ->first();
        }

        return Inertia::render('teknisi/install', [
            'prefillItem' => $item,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'item_id'  => 'required|exists:items,id',
            'quantity' => 'required|integer|min:1',
            'location' => 'nullable|string|max:255',
            'notes'    => 'nullable|string|max:1000',
            'photo'    => 'nullable|string', // base64
        ]);

        $item = Item::findOrFail($request->item_id);

        // Ensure item is komponen or asset
        if ($item->type === 'peralatan') {
            return redirect()->back()->with('error', 'Barang jenis Peralatan harus melalui alur Peminjaman, bukan Pemasangan.');
        }

        // Check stock
        if ($item->available_quantity < $request->quantity) {
            return redirect()->back()->with('error', 'Stok tidak mencukupi. Tersedia: ' . $item->available_quantity);
        }

        $photoPath = null;
        if ($request->filled('photo')) {
            $photoPath = $this->saveBase64Image($request->photo, 'installations');
        }

        Installation::create([
            'user_id'  => auth()->id(),
            'item_id'  => $item->id,
            'quantity' => $request->quantity,
            'location' => $request->location,
            'notes'    => $request->notes,
            'photo_path' => $photoPath,
            'status'   => 'menunggu_approval',
        ]);

        return redirect()->route('teknisi.installations.index')
            ->with('success', 'Pengajuan pemasangan berhasil dikirim. Menunggu persetujuan admin.');
    }

    public function teknisiIndex(Request $request)
    {
        $user = auth()->user();

        $query = Installation::with(['item.category', 'approvedBy'])
            ->where('user_id', $user->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $installations = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('teknisi/installations', [
            'installations' => $installations,
            'filters'       => $request->only(['status']),
        ]);
    }

    public function scanItem(Request $request)
    {
        $request->validate(['code' => 'required|string']);

        $item = Item::with('category')->where('code_unique', $request->code)->first();

        if (!$item) {
            return response()->json(['message' => 'Barang tidak ditemukan.'], 404);
        }

        $item->available_quantity = $item->available_quantity;
        $item->is_low_stock = $item->is_low_stock;

        return response()->json(['item' => $item]);
    }

    protected function saveBase64Image(string $base64, string $directory): string
    {
        $base64 = preg_replace('/^data:image\/\w+;base64,/', '', $base64);
        $imageData = base64_decode($base64);
        $filename = $directory . '/' . uniqid() . '_' . time() . '.jpg';
        Storage::disk('public')->put($filename, $imageData);
        return $filename;
    }
}
