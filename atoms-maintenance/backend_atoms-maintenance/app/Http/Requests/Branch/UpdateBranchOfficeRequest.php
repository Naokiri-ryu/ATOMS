<?php

namespace App\Http\Requests\Branch;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBranchOfficeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'code'      => ['required', 'string', 'max:20', Rule::unique('branch_offices', 'code')->ignore($id)],
            'name'      => ['required', 'string', 'max:200'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}