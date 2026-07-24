<?php

namespace App\Http\Requests\Tfp;

use App\Models\Tfp\TfpGensetRadarRecord;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateTfpGensetRadarRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'date'       => ['required', 'date'],
            'shift_type' => ['required', 'string', Rule::in(TfpGensetRadarRecord::SHIFT_TYPES)],
            'form_type'  => ['sometimes', 'string'],
            'location'   => ['sometimes', 'string', 'max:100'],
            'engine'     => ['sometimes', 'string', 'max:100'],
            'alternator' => ['sometimes', 'string', 'max:100'],
            'kapasitas'  => ['sometimes', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'date.required'       => 'Tanggal harus diisi.',
            'date.date'           => 'Tanggal harus dalam format tanggal yang valid.',
            'shift_type.required' => 'Shift harus dipilih.',
            'shift_type.in'       => 'Shift harus pagi, siang, atau malam.',
        ];
    }
}
