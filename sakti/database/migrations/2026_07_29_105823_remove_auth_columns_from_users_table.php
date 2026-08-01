<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint \) {
            \->dropColumn(['password', 'two_factor_secret', 'two_factor_recovery_codes',
                                'two_factor_confirmed_at', 'remember_token', 'email_verified_at']);
        });

        Schema::dropIfExists('password_reset_tokens');
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint \) {
            \->string('password')->nullable();
            \->text('two_factor_secret')->nullable();
            \->text('two_factor_recovery_codes')->nullable();
            \->timestamp('two_factor_confirmed_at')->nullable();
            \->rememberToken();
            \->timestamp('email_verified_at')->nullable();
        });

        Schema::create('password_reset_tokens', function (Blueprint \) {
            \->string('email')->primary();
            \->string('token');
            \->timestamp('created_at')->nullable();
        });
    }
};
