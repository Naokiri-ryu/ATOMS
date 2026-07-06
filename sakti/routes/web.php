<?php

use App\Http\Controllers\BeritaAcaraController;
use App\Http\Controllers\BorrowingController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InstallationController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\StockAuditController;
use App\Http\Controllers\StockController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Notifications
    Route::post('/notifications/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
    Route::post('/notifications/{id}/mark-read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
    // Dashboard - routes based on role
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Admin routes
    Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Items CRUD
        Route::resource('items', ItemController::class);
        Route::get('items/{item}/qr-code', [ItemController::class, 'qrCode'])->name('items.qrcode');
        Route::get('items-export/excel', [ItemController::class, 'exportExcel'])->name('items.export.excel');
        Route::get('items-export/pdf', [ItemController::class, 'exportPdf'])->name('items.export.pdf');

        // Categories CRUD
        Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::put('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

        // Stock Audit
        Route::get('audit', [StockAuditController::class, 'index'])->name('audit.index');

        // Borrowings Management
        Route::get('borrowings', [BorrowingController::class, 'adminIndex'])->name('borrowings.index');
        Route::get('borrowings/{borrowing}', [BorrowingController::class, 'adminShow'])->name('borrowings.show');
        Route::delete('borrowings/{borrowing}', [BorrowingController::class, 'adminDestroy'])->name('borrowings.destroy');

        // Installations Management (Pemasangan)
        Route::get('installations', [InstallationController::class, 'index'])->name('installations.index');
        Route::post('installations/{installation}/approve', [InstallationController::class, 'approve'])->name('installations.approve');
        Route::post('installations/{installation}/reject', [InstallationController::class, 'reject'])->name('installations.reject');
        Route::delete('installations/{installation}', [InstallationController::class, 'adminDestroy'])->name('installations.destroy');

        // Stock Traffic Analytics
        Route::get('stock/traffic', [StockController::class, 'traffic'])->name('stock.traffic');

        // Berita Acara
        Route::get('berita-acara', [BeritaAcaraController::class, 'index'])->name('berita-acara.index');
        Route::post('berita-acara', [BeritaAcaraController::class, 'store'])->name('berita-acara.store');
        Route::post('berita-acara/generate', [BeritaAcaraController::class, 'generate'])->name('berita-acara.generate');
        Route::get('berita-acara/{beritaAcara}/download', [BeritaAcaraController::class, 'download'])->name('berita-acara.download');
        Route::delete('berita-acara/{beritaAcara}', [BeritaAcaraController::class, 'destroy'])->name('berita-acara.destroy');
    });

    // Teknisi routes
    Route::prefix('teknisi')->name('teknisi.')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Borrowings
        Route::get('borrowings', [BorrowingController::class, 'index'])->name('borrowings.index');
        Route::get('borrow', [BorrowingController::class, 'borrowPage'])->name('borrow');
        Route::post('borrow', [BorrowingController::class, 'store'])->name('borrow.store');
        Route::get('return/{borrowing}', [BorrowingController::class, 'returnPage'])->name('return');
        Route::post('return/{borrowing}', [BorrowingController::class, 'returnItem'])->name('return.store');

        // QR Scanner API (peminjaman)
        Route::post('scan-item', [BorrowingController::class, 'scanItem'])->name('scan.item');

        // Installations (Pemasangan — komponen & asset)
        Route::get('install', [InstallationController::class, 'createPage'])->name('install');
        Route::post('install', [InstallationController::class, 'store'])->name('install.store');
        Route::get('installations', [InstallationController::class, 'teknisiIndex'])->name('installations.index');

        // Berita Acara
        Route::get('berita-acara', [BeritaAcaraController::class, 'index'])->name('berita-acara.index');
        Route::post('berita-acara', [BeritaAcaraController::class, 'store'])->name('berita-acara.store');
        Route::post('berita-acara/generate', [BeritaAcaraController::class, 'generate'])->name('berita-acara.generate');
        Route::get('berita-acara/{beritaAcara}/download', [BeritaAcaraController::class, 'download'])->name('berita-acara.download');
    });
});

require __DIR__.'/settings.php';
