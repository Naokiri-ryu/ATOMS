<?php

namespace App\Console\Commands;

use App\Models\Borrowing;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class CheckOverdueBorrowings extends Command
{
    protected $signature = 'borrowings:check-overdue';
    protected $description = 'Check for overdue borrowings (> 6 hours) and notify users';

    public function handle()
    {
        $overdueBorrowings = Borrowing::overdue()->with(['user', 'item'])->get();

        if ($overdueBorrowings->isEmpty()) {
            $this->info('No overdue borrowings found.');
            return 0;
        }

        $this->info("Found {$overdueBorrowings->count()} overdue borrowings:");

        foreach ($overdueBorrowings as $borrowing) {
            $hours = $borrowing->borrowed_at->diffInHours(now());
            $message = "Barang {$borrowing->item->name} sudah dipinjam lebih dari {$hours} jam dan belum dikembalikan.";

            $this->warn(
                "- {$borrowing->user->name} meminjam {$borrowing->item->name} " .
                "sejak {$borrowing->borrowed_at->format('d/m/Y H:i')} ({$hours} jam lalu)"
            );

            // Avoid spam: Check if notification exists for THIS borrowing
            $notificationExists = $borrowing->user->notifications()
                ->whereRaw("json_extract_path_text(data::json, 'type') = 'overdue_warning'")
                ->whereRaw("json_extract_path_text(data::json, 'borrowing_id')::integer = ?", [$borrowing->id])
                ->exists();

            if (!$notificationExists) {
                $borrowing->user->notify(new \App\Notifications\OverdueBorrowingNotification($borrowing, $message));
                $this->info("   -> Notification sent to user {$borrowing->user->name}");
            }
        }

        return 0;
    }
}
