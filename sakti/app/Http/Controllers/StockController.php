<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockController extends Controller
{
    public function traffic()
    {
        // Top 5 most borrowed items (peralatan)
        $mostBorrowed = Item::withCount(['borrowings as borrow_count'])
            ->where('type', 'peralatan')
            ->orderByDesc('borrow_count')
            ->take(5)
            ->get(['id', 'name', 'type', 'quantity'])
            ->map(fn($item) => [
                'id'          => $item->id,
                'name'        => $item->name,
                'type'        => $item->type,
                'borrow_count' => $item->borrow_count,
            ]);

        // Top 5 most installed items (komponen + asset)
        $mostInstalled = Item::withCount(['installations as install_count' => fn($q) => $q->where('status', 'disetujui')])
            ->whereIn('type', ['komponen', 'asset'])
            ->orderByDesc('install_count')
            ->take(5)
            ->get(['id', 'name', 'type', 'quantity'])
            ->map(fn($item) => [
                'id'           => $item->id,
                'name'         => $item->name,
                'type'         => $item->type,
                'install_count' => $item->install_count,
            ]);

        // Top 5 least used (low borrow/install count overall)
        $leastUsed = Item::withCount([
                'borrowings as borrow_count',
                'installations as install_count',
            ])
            ->orderByRaw('(borrow_count + install_count) ASC')
            ->take(5)
            ->get(['id', 'name', 'type', 'quantity'])
            ->map(fn($item) => [
                'id'          => $item->id,
                'name'        => $item->name,
                'type'        => $item->type,
                'total_usage' => $item->borrow_count + $item->install_count,
            ]);

        // Low stock items (available_quantity <= min_stock)
        $allItems = Item::with('category')->get();
        $lowStock = $allItems->filter(fn($item) => $item->is_low_stock)
            ->map(fn($item) => [
                'id'                => $item->id,
                'name'              => $item->name,
                'type'              => $item->type,
                'quantity'          => $item->quantity,
                'min_stock'         => $item->min_stock,
                'available_quantity' => $item->available_quantity,
                'category'          => $item->category?->name,
            ])
            ->values();

        // Summary stats
        $totalItems      = Item::count();
        $totalBorrowed   = \App\Models\Borrowing::where('status', 'dipinjam')->sum('quantity');
        $totalInstalled  = \App\Models\Installation::where('status', 'disetujui')->sum('quantity');
        $totalLowStock   = $lowStock->count();
        $pendingApprovals = \App\Models\Installation::where('status', 'menunggu_approval')->count();

        return Inertia::render('admin/stock/traffic', [
            'mostBorrowed'    => $mostBorrowed,
            'mostInstalled'   => $mostInstalled,
            'leastUsed'       => $leastUsed,
            'lowStock'        => $lowStock,
            'stats'           => [
                'totalItems'       => $totalItems,
                'totalBorrowed'    => $totalBorrowed,
                'totalInstalled'   => $totalInstalled,
                'totalLowStock'    => $totalLowStock,
                'pendingApprovals' => $pendingApprovals,
            ],
        ]);
    }
}
