<?php

namespace App\Notifications;

use App\Models\Borrowing;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OverdueBorrowingNotification extends Notification
{
    use Queueable;

    public $borrowing;
    public $message;

    /**
     * Create a new notification instance.
     */
    public function __construct(Borrowing $borrowing, string $message)
    {
        $this->borrowing = $borrowing;
        $this->message = $message;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database']; // We only want database notification for now (the UI Bell)
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'borrowing_id' => $this->borrowing->id,
            'item_name' => $this->borrowing->item->name,
            'message' => $this->message,
            'borrowed_at' => $this->borrowing->borrowed_at,
            'type' => 'overdue_warning',
        ];
    }
}
