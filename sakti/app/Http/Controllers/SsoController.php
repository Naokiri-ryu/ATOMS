<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SsoController extends Controller
{
    public function handle(Request $request)
    {
        $tokenfix = $request->query('tokenfix');

        if (!$tokenfix) {
            return redirect('/')->withErrors('SSO: tokenfix not provided.');
        }

        if (!preg_match('/^mock-token-(\d+)$/', $tokenfix, $matches)) {
            return redirect('/')->withErrors('SSO: invalid tokenfix format.');
        }

        $rosteringUserId = (int) $matches[1];

        $name = $request->query('name', 'User ' . $rosteringUserId);
        $email = $request->query('email', "sso-{$rosteringUserId}@sakti.local");
        $role = $request->query('role', 'teknisi');
        $saktiRole = ($role === 'Admin') ? 'admin' : 'teknisi';

        $user = User::updateOrCreate(
            ['rostering_user_id' => $rosteringUserId],
            ['name' => $name, 'email' => $email, 'role' => $saktiRole],
        );

        Auth::login($user);

        return redirect('/dashboard');
    }
}
