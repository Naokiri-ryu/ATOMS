<?php

namespace App\Http\Controllers;

use App\Models\Borrowing;
use App\Models\Item;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        if ($user->isAdmin()) {
            return $this->adminDashboard();
        }

        return $this->teknisiDashboard();
    }

    protected function adminDashboard()
    {
        $allItems = Item::with('category')->get();
        $totalItems = $allItems->count();
        $totalQuantity = Item::sum('quantity');

        $lowStockItems = $allItems->filter(fn($item) => $item->is_low_stock);
        $lowStockCount = $lowStockItems->count();

        $activeBorrowings = Borrowing::active()->count();
        $overdueBorrowings = Borrowing::overdue()->with(['user', 'item'])->get();

        $pendingInstallationsCount = \App\Models\Installation::where('status', 'menunggu_approval')->count();
        $pendingInstallations = \App\Models\Installation::with(['user', 'item'])
            ->where('status', 'menunggu_approval')
            ->latest()
            ->take(5)
            ->get();

        $recentBorrowings = Borrowing::with(['user', 'item'])
            ->latest('borrowed_at')
            ->take(10)
            ->get();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'totalItems' => $totalItems,
                'totalQuantity' => $totalQuantity,
                'activeBorrowings' => $activeBorrowings,
                'overdueCount' => $overdueBorrowings->count(),
                'lowStockCount' => $lowStockCount,
                'pendingInstallationsCount' => $pendingInstallationsCount,
            ],
            'overdueBorrowings' => $overdueBorrowings,
            'recentBorrowings' => $recentBorrowings,
            'lowStockItems' => $lowStockItems->values()->take(5),
            'pendingInstallations' => $pendingInstallations,
        ]);
    }

    protected function teknisiDashboard()
    {
        $user = auth()->user();

        $availableItems = Item::with(['category', 'borrowings', 'installations'])
            ->get()
            ->map(function ($item) {
                $item->available_quantity = $item->available_quantity;
                $item->is_low_stock = $item->is_low_stock;
                return $item;
            })
            ->filter(fn($item) => $item->available_quantity > 0)
            ->values();

        return Inertia::render('teknisi/dashboard', [
            'availableItems' => $availableItems,
            'myBorrowings' => Borrowing::with('item.category')
                ->where('user_id', $user->id)
                ->where('status', 'dipinjam')
                ->get()
                ->map(function ($b) {
                    $b->is_overdue = $b->is_overdue;
                    return $b;
                }),
            'overdueCount' => Borrowing::where('user_id', $user->id)
                ->where('status', 'dipinjam')
                ->get()
                ->filter->is_overdue
                ->count(),
            'pendingInstallationsCount' => \App\Models\Installation::where('user_id', $user->id)
                ->where('status', 'menunggu_approval')
                ->count(),
        ]);
    }
}
