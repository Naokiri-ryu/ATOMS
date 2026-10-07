<?php

namespace App\Http\Requests\Branch;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBranchOfficeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'code'      => ['required', 'string', 'max:20', Rule::unique('branch_offices', 'code')],
            'name'      => ['required', 'string', 'max:200'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}