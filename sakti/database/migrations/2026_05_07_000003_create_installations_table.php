<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('item_id')->constrained()->onDelete('cascade');
            $table->integer('quantity')->default(1);
            $table->text('notes')->nullable();
            $table->string('location')->nullable();
            $table->string('photo_path')->nullable();
            $table->enum('status', ['menunggu_approval', 'disetujui', 'ditolak'])->default('menunggu_approval');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('installed_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('item_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installations');
    }
};
