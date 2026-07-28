<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class SsoController extends Controller
{
    /**
     * Handle SSO redirect from atoms-rostering.
     *
     * URL: GET /sso?token={token}&tokenfix={mock-token-{user_id}}
     *
     * Parses the tokenfix to extract the rostering user ID,
     * finds or creates a matching SAKTI user, logs them in,
     * and redirects to the dashboard.
     */
    public function handle(Request $request)
    {
        $tokenfix = $request->query('tokenfix');

        if (!$tokenfix) {
            return redirect('/')->withErrors('SSO: tokenfix not provided.');
        }

        // Parse mock-token-{id} format
        if (!preg_match('/^mock-token-(\d+)$/', $tokenfix, $matches)) {
            return redirect('/')->withErrors('SSO: invalid tokenfix format.');
        }

        $rosteringUserId = (int) $matches[1];

        // Find existing user or create a new one
        $user = User::where('rostering_user_id', $rosteringUserId)->first();

        if (!$user) {
            $user = User::create([
                'name'              => 'User ' . $rosteringUserId,
                'email'             => "sso-{$rosteringUserId}@sakti.local",
                'password'          => bcrypt(Str::random(32)),
                'role'              => 'teknisi',
                'rostering_user_id' => $rosteringUserId,
                'email_verified_at' => now(),
            ]);
        }

        Auth::login($user);

        return redirect('/dashboard');
    }
}
