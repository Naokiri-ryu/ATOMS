<?php

namespace App\Http\Controllers;

use App\Models\Borrowing;
use App\Models\Item;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BorrowingController extends Controller
{
    // ==================== ADMIN METHODS ====================

    public function adminIndex(Request $request)
    {
        $query = Borrowing::with(['item.category', 'user']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($q2) use ($search) {
                    $q2->where('name', 'ilike', '%' . $search . '%')
                       ->orWhere('email', 'ilike', '%' . $search . '%');
                })
                ->orWhereHas('item', function ($q2) use ($search) {
                    $q2->where('name', 'ilike', '%' . $search . '%')
                       ->orWhere('code_unique', 'ilike', '%' . $search . '%');
                });
            });
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $borrowings = $query->latest('borrowed_at')->paginate(15)->withQueryString();

        $borrowings->getCollection()->transform(function ($borrowing) {
            $borrowing->is_overdue = $borrowing->is_overdue;
            return $borrowing;
        });

        // Get all teknisi users for filter
        $users = \App\Models\User::where('role', 'teknisi')->orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/borrowings/index', [
            'borrowings' => $borrowings,
            'users' => $users,
            'filters' => $request->only(['status', 'search', 'user_id']),
        ]);
    }

    public function adminShow(Borrowing $borrowing)
    {
        $borrowing->load(['item.category', 'user']);
        $borrowing->is_overdue = $borrowing->is_overdue;

        return Inertia::render('admin/borrowings/show', [
            'borrowing' => $borrowing,
        ]);
    }

    public function adminDestroy(Borrowing $borrowing)
    {
        // Delete associated photos
        if ($borrowing->borrow_photo_path) {
            Storage::disk('public')->delete($borrowing->borrow_photo_path);
        }
        if ($borrowing->return_photo_path) {
            Storage::disk('public')->delete($borrowing->return_photo_path);
        }

        $itemName = $borrowing->item?->name ?? 'Unknown';
        $borrowing->delete();

        return redirect()->route('admin.borrowings.index')
            ->with('success', "Log peminjaman \"$itemName\" berhasil dihapus.");
    }

    // ==================== TEKNISI METHODS ====================

    public function index(Request $request)
    {
        $user = auth()->user();

        $query = Borrowing::with(['item.category', 'user']);

        if ($user->isTeknisi()) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $borrowings = $query->latest('borrowed_at')->paginate(10)->withQueryString();

        $borrowings->getCollection()->transform(function ($borrowing) {
            $borrowing->is_overdue = $borrowing->is_overdue;
            return $borrowing;
        });

        return Inertia::render('teknisi/borrowings', [
            'borrowings' => $borrowings,
            'filters' => $request->only(['status']),
        ]);
    }

    public function scanItem(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $item = Item::with('category')->where('code_unique', $request->code)->first();

        if (!$item) {
            return response()->json(['message' => 'Barang tidak ditemukan.'], 404);
        }

        $item->available_quantity = $item->available_quantity;
        $item->is_low_stock       = $item->is_low_stock;

        // Flag items that must go through installation flow
        $isInstallationItem = in_array($item->type, ['komponen', 'asset']);

        return response()->json([
            'item'                => $item,
            'is_installation_item' => $isInstallationItem,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'item_id'      => 'required|exists:items,id',
            'quantity'     => 'required|integer|min:1',
            'borrow_photo' => 'required|string', // Base64 image
            'usage_notes'  => 'nullable|string|max:500',
        ]);

        $item = Item::findOrFail($request->item_id);

        // Block non-peralatan items — they must use the installation flow
        if ($item->type !== 'peralatan') {
            $typeLabel = $item->type === 'komponen' ? 'Komponen' : 'Asset';
            return redirect()->back()
                ->with('error', "Barang jenis {$typeLabel} tidak bisa dipinjam. Gunakan menu Pengajuan Pemasangan.");
        }

        // Check availability
        if ($item->available_quantity < $request->quantity) {
            return redirect()->back()
                ->with('error', 'Stok barang tidak mencukupi. Tersedia: ' . $item->available_quantity);
        }

        // Save the photo from base64
        $photoPath = $this->saveBase64Image($request->borrow_photo, 'borrowings/borrow');

        $borrowing = Borrowing::create([
            'user_id'              => auth()->id(),
            'item_id'              => $item->id,
            'quantity'             => $request->quantity,
            'borrow_photo_path'    => $photoPath,
            'usage_notes'          => null,
            'borrowed_at'          => Carbon::now(),
            'expected_return_time' => Carbon::now()->addHours(6),
            'status'               => 'dipinjam',
        ]);

        return redirect()->route('teknisi.dashboard')
            ->with('success', 'Peminjaman berhasil dicatat.');
    }

    public function returnItem(Request $request, Borrowing $borrowing)
    {
        // Ensure user is the borrower or admin
        if (auth()->user()->isTeknisi() && $borrowing->user_id !== auth()->id()) {
            return redirect()->back()->with('error', 'Anda tidak berhak mengembalikan barang ini.');
        }

        $request->validate([
            'return_photo' => 'required|string', // Base64 image
        ]);

        // Save the return photo from base64
        $photoPath = $this->saveBase64Image($request->return_photo, 'borrowings/return');

        $borrowing->update([
            'return_photo_path' => $photoPath,
            'returned_at' => Carbon::now(),
            'status' => 'dikembalikan',
        ]);

        return redirect()->route('teknisi.dashboard')
            ->with('success', 'Pengembalian berhasil dicatat.');
    }

    public function borrowPage()
    {
        return Inertia::render('teknisi/borrow');
    }

    public function returnPage(Borrowing $borrowing)
    {
        $borrowing->load('item.category');

        return Inertia::render('teknisi/return', [
            'borrowing' => $borrowing,
        ]);
    }

    protected function saveBase64Image(string $base64, string $directory): string
    {
        // Remove data URI prefix if present
        $base64 = preg_replace('/^data:image\/\w+;base64,/', '', $base64);
        $imageData = base64_decode($base64);

        $filename = $directory . '/' . uniqid() . '_' . time() . '.jpg';
        Storage::disk('public')->put($filename, $imageData);

        return $filename;
    }
}
