<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateEmployeeProfileRequest;
use App\Http\Requests\UploadEmployeeAvatarRequest;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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

    /**
     * POST /employees/{id}/avatar
     * Upload/replace the employee photo. Allowed only for the employee
     * themself or an admin.
     */
    public function uploadAvatar(UploadEmployeeAvatarRequest $request, $id)
    {
        $employee = Employee::withTrashed()->with('user')->findOrFail($id);

        $currentUser = $request->user();
        $isAdmin = $currentUser && $currentUser->role === User::ROLE_ADMIN;
        if (!$isAdmin && (!$currentUser || $employee->user_id !== $currentUser->id)) {
            abort(403, 'Anda tidak memiliki izin untuk mengubah foto profil ini');
        }

        $oldPath = $employee->avatar_path;
        $file = $request->file('avatar');
        $path = $this->storeAvatar($file, $employee->id);

        $employee->forceFill(['avatar_path' => $path])->save();

        if ($oldPath && $oldPath !== $path && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        $employee->load('user', 'licenses', 'ratings');

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil diunggah',
            'data' => [
                'avatar_path' => $employee->avatar_path,
                'avatar_url' => Storage::disk('public')->url($employee->avatar_path),
                'employee' => $employee,
            ],
        ]);
    }

    /**
     * DELETE /employees/{id}/avatar
     * Remove the employee photo. Allowed only for the employee themself
     * or an admin.
     */
    public function deleteAvatar(Request $request, $id)
    {
        $employee = Employee::withTrashed()->with('user')->findOrFail($id);

        $currentUser = $request->user();
        $isAdmin = $currentUser && $currentUser->role === User::ROLE_ADMIN;
        if (!$isAdmin && (!$currentUser || $employee->user_id !== $currentUser->id)) {
            abort(403, 'Anda tidak memiliki izin untuk menghapus foto profil ini');
        }

        $oldPath = $employee->avatar_path;

        if ($oldPath) {
            $employee->forceFill(['avatar_path' => null])->save();

            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        $employee->load('user', 'licenses', 'ratings');

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil dihapus',
            'data' => [
                'avatar_path' => null,
                'avatar_url' => null,
                'employee' => $employee,
            ],
        ]);
    }

    private function storeAvatar(UploadedFile $file, int $employeeId): string
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'jpg');
        $filename = 'avatar_' . time() . '_' . uniqid() . '.' . $extension;

        return $file->storeAs(
            'avatars/employees/' . $employeeId,
            $filename,
            'public'
        );
    }
}