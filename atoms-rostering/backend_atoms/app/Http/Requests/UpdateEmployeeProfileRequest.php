<?php

namespace App\Http\Requests;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // The public route uses {id}, the admin route uses {employee}; resolve
        // whichever is bound so the NIK uniqueness check excludes this employee.
        $employeeId = $this->route('employee') ?? $this->route('id');
        if ($employeeId instanceof Model) {
            $employeeId = $employeeId->getKey();
        }

        return [
            'nik' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('employees', 'nik')->ignore($employeeId)],
            'birth_place' => 'sometimes|nullable|string|max:255',
            'birth_date' => 'sometimes|nullable|date',
            'unit_kerja' => 'sometimes|nullable|in:CNSD,TFP',
            'jabatan' => 'sometimes|nullable|string|max:255',
            'licenses' => 'sometimes|array',
            'licenses.*.license_name' => 'nullable|string|max:255',
            'licenses.*.license_number' => 'nullable|string|max:255',
            'licenses.*.valid_until' => 'nullable|string|max:50',
            'licenses.*.keterangan' => 'nullable|string|max:255',
            'ratings' => 'sometimes|array',
            'ratings.*.rating' => 'required_with:ratings|string|max:255',
            'ratings.*.valid_until' => 'nullable|string|max:50',
            'ratings.*.keterangan' => 'nullable|string|max:255',
        ];
    }
}