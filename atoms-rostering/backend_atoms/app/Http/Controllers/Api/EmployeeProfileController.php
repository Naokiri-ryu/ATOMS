<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateEmployeeProfileRequest;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class EmployeeProfileController extends Controller
{
    /**
     * GET /employees/{id}/profile (all authenticated users)
     */
    public function show($id)
    {
        $employee = Employee::withTrashed()->with('user', 'licenses', 'ratings')->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Employee profile retrieved successfully',
            'data' => $employee,
        ]);
    }

    /**
     * PUT /employees/{id}/profile
     * Allowed only for the employee themself or an admin.
     */
    public function update(UpdateEmployeeProfileRequest $request, $id)
    {
        // The admin users list includes soft-deleted employees (withTrashed),
        // so profile reads/writes must resolve them too.
        $employee = Employee::withTrashed()->with('user')->findOrFail($id);

        $currentUser = $request->user();
        $isAdmin = $currentUser && $currentUser->role === User::ROLE_ADMIN;
        if (!$isAdmin && (!$currentUser || $employee->user_id !== $currentUser->id)) {
            abort(403, 'Anda tidak memiliki izin untuk mengubah profil ini');
        }

        try {
            DB::transaction(function () use ($request, $employee) {
                $employee->update(
                    $request->only(['nik', 'birth_place', 'birth_date', 'unit_kerja', 'jabatan'])
                );

                if ($request->has('licenses')) {
                    $employee->licenses()->delete();
                    $licenses = $request->input('licenses', []);
                    if (!empty($licenses)) {
                        $employee->licenses()->createMany($licenses);
                    }
                }

                if ($request->has('ratings')) {
                    $employee->ratings()->delete();
                    $ratings = $request->input('ratings', []);
                    if (!empty($ratings)) {
                        $employee->ratings()->createMany($ratings);
                    }
                }
            });

            // Profile changes may alter rating/NIK shown in user lists
            AdminUserController::clearUsersCache();

            $employee->load('user', 'licenses', 'ratings');

            return response()->json([
                'success' => true,
                'message' => 'Employee profile updated successfully',
                'data' => $employee,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update employee profile',
                'errors' => ['error' => [$e->getMessage()]],
            ], 500);
        }
    }
}