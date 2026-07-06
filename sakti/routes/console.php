<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Check for overdue borrowings every hour
Schedule::command('borrowings:check-overdue')->hourly();

// Check for low stock items every 6 hours
Schedule::command('stock:check-low')->everySixHours();
