<?php

namespace App\Console\Commands;

use App\Models\Item;
use App\Models\User;
use App\Notifications\LowStockNotification;
use Illuminate\Console\Command;

class CheckLowStock extends Command
{
    protected $signature = 'stock:check-low';
    protected $description = 'Check for low stock items and notify all users';

    public function handle(): int
    {
        $allItems = Item::with('category')->get();
        $lowStockItems = $allItems->filter(fn($item) => $item->is_low_stock);

        if ($lowStockItems->isEmpty()) {
            $this->info('No low stock items found.');
            return 0;
        }

        $this->info("Found {$lowStockItems->count()} low stock item(s):");

        // Notify all users (admin + teknisi)
        $users = User::all();

        foreach ($lowStockItems as $item) {
            $available = $item->available_quantity;
            $message = "Stok barang \"{$item->name}\" hampir habis. Tersisa {$available} unit (minimum: {$item->min_stock} unit).";

            $this->warn("- {$item->name}: {$available} unit tersisa (min: {$item->min_stock})");

            foreach ($users as $user) {
                // Anti-spam: skip if unread notification for this item already exists
                // Cast data column to jsonb for PostgreSQL text column
                $alreadyNotified = $user->unreadNotifications()
                    ->whereRaw("json_extract_path_text(data::json, 'type') = 'low_stock'")
                    ->whereRaw("json_extract_path_text(data::json, 'item_id')::integer = ?", [$item->id])
                    ->exists();

                if (!$alreadyNotified) {
                    $user->notify(new LowStockNotification($item, $message));
                    $this->info("   -> Notifikasi dikirim ke {$user->name}");
                } else {
                    $this->line("   -> Skip {$user->name} (notifikasi belum dibaca)");
                }
            }
        }

        return 0;
    }
}
