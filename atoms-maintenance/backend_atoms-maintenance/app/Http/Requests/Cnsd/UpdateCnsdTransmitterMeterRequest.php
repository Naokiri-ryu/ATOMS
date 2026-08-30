<?php

namespace App\Http\Requests\Cnsd;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCnsdTransmitterMeterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items'                => ['sometimes', 'array'],
            'items.*.id'           => ['required_with:items', 'integer'],
            'items.*.status_value' => ['sometimes', 'nullable', 'string', 'max:30'],
            'items.*.power_output' => ['sometimes', 'nullable', 'string', 'max:60'],
            'items.*.modulasi'     => ['sometimes', 'nullable', 'string', 'max:60'],
            'items.*.keterangan'   => ['sometimes', 'nullable', 'string', 'max:255'],
            'items.*.hasil'        => ['sometimes', 'nullable', 'string', 'max:60'],
            // Receiver section fields (VHF ER Gedung Radar)
            'items.*.status_a'     => ['sometimes', 'nullable', 'string', 'max:60'],
            'items.*.status_b'     => ['sometimes', 'nullable', 'string', 'max:60'],
            'items.*.squelch_tx1'  => ['sometimes', 'nullable', 'string', 'max:60'],
            'items.*.squelch_tx2'  => ['sometimes', 'nullable', 'string', 'max:60'],
        ];
    }
}
