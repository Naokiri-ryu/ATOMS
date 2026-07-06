<?php

namespace App\Http\Controllers;

use App\Models\Borrowing;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockAuditController extends Controller
{
    public function index(Request $request)
    {
        $query = Borrowing::with(['user', 'item.category']);

        if ($request->filled('date_from')) {
            $query->where('borrowed_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('borrowed_at', '<=', $request->date_to . ' 23:59:59');
        }

        if ($request->filled('type')) {
            if ($request->type === 'keluar') {
                $query->where('status', 'dipinjam');
            } elseif ($request->type === 'masuk') {
                $query->where('status', 'dikembalikan');
            }
        }

        $movements = $query->latest('borrowed_at')->paginate(15)->withQueryString();

        return Inertia::render('admin/audit/index', [
            'movements' => $movements,
            'filters' => $request->only(['date_from', 'date_to', 'type']),
        ]);
    }
}
