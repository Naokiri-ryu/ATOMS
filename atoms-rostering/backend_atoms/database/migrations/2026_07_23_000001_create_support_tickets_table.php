<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            // Ticket info
            $table->enum('category', ['bug_report', 'feature_request']);
            $table->string('title', 255);
            $table->text('description');

            // Status tracking
            $table->enum('status', ['open', 'in_progress', 'resolved', 'closed'])->default('open');

            // File attachment
            $table->string('attachment_path', 500)->nullable();
            $table->string('attachment_original_name', 255)->nullable();

            // Admin response
            $table->text('admin_response')->nullable();
            $table->foreignId('responded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('responded_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Audit fields
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();

            // Indexes
            $table->index('user_id');
            $table->index('category');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};
