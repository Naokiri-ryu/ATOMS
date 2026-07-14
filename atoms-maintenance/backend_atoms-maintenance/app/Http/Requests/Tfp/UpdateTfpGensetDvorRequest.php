<?php

namespace App\Http\Requests\Tfp;

use App\Models\Tfp\TfpGensetDvorRecord;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Updating a TFP Genset DVOR record allows mutating item measurement values,
 * facility (checklist) condition values, and the Genset-specific fields
 * (catatan, status_operasi, status_master_slave, fuel_level). Personnel,
 * date, shift, signatures, and form_number are never editable here.
 */
class UpdateTfpGensetDvorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Optional explicit time override (HH:MM). Falls back to now() on the server when omitted.
            'time_filled'    => ['nullable', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],

            // Items: each carries a `values` map keyed by composite "panel_id.sub_col_key".
            'items'          => ['required', 'array', 'min:1'],
            'items.*.id'     => ['required', 'integer'],
            'items.*.values' => ['nullable', 'array'],
            'items.*.values.*' => ['nullable'],

            // Facilities (checklist rows, optional)
            'facilities'              => ['sometimes', 'array'],
            'facilities.*.id'         => ['required_with:facilities', 'integer'],
            'facilities.*.kondisi'    => ['nullable', 'string', 'in:Baik,Tidak Baik'],
            'facilities.*.keterangan' => ['nullable', 'string', 'max:500'],

            // Genset-specific fields
            'catatan'              => ['sometimes', 'nullable', 'string', 'max:2000'],
            'status_operasi'       => ['sometimes', 'nullable', 'string', Rule::in(TfpGensetDvorRecord::STATUS_OPERASI)],
            'status_master_slave'  => ['sometimes', 'nullable', 'string', Rule::in(TfpGensetDvorRecord::STATUS_MASTER_SLAVE)],
            'fuel_level'            => ['sometimes', 'nullable', 'string', Rule::in(TfpGensetDvorRecord::FUEL_LEVELS)],
        ];
    }

    public function messages(): array
    {
        return [
            'time_filled.regex'   => 'Waktu pengisian harus dalam format HH:MM.',
            'items.required'      => 'Minimal satu item harus disertakan.',
            'items.array'         => 'Items harus berupa array.',
            'items.*.id.required' => 'Setiap item wajib menyertakan id.',
            'facilities.*.kondisi.in' => 'Kondisi harus salah satu dari: Baik, Tidak Baik.',
            'status_operasi.in'      => 'Status Operasi harus PLN OFF atau RUN UP.',
            'status_master_slave.in' => 'Status harus Master atau Slave.',
            'fuel_level.in'           => 'Level BBM tidak valid.',
        ];
    }
}