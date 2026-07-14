<?php

namespace App\Http\Requests\Tfp;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the batch "Simpan Struktur" payload from the Excel-like editor
 * on the Genset DVOR detail page.
 *
 * Payload shape:
 *   {
 *     "columns_config": [
 *       { "id": "value", "label": "Nilai",
 *         "sub_columns": [{"key":"value","label":"Nilai"}] },
 *       ...
 *     ],
 *     "items": [
 *       { "id": 1, "is_disabled_map": {"value.value": true, ...},
 *                  "merge_map":      {"value.value": 2, ...} },
 *       ...
 *     ]
 *   }
 */
class SaveTfpGensetDvorStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'columns_config'                          => ['required', 'array', 'min:1'],
            'columns_config.*.id'                     => ['required', 'string', 'max:60'],
            'columns_config.*.label'                  => ['required', 'string', 'max:80'],
            'columns_config.*.sub_columns'            => ['required', 'array', 'min:1'],
            'columns_config.*.sub_columns.*.key'      => ['required', 'string', 'max:40'],
            'columns_config.*.sub_columns.*.label'    => ['required', 'string', 'max:60'],

            'items'                       => ['sometimes', 'array'],
            'items.*.id'                  => ['required_with:items', 'integer'],
            'items.*.is_disabled_map'     => ['nullable', 'array'],
            'items.*.is_disabled_map.*'   => ['boolean'],
            'items.*.merge_map'           => ['nullable', 'array'],
            'items.*.merge_map.*'         => ['integer', 'min:2', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'columns_config.required'              => 'Minimal harus ada satu kolom.',
            'columns_config.*.id.required'         => 'Setiap kolom wajib punya id.',
            'columns_config.*.label.required'      => 'Setiap kolom wajib punya label.',
            'columns_config.*.sub_columns.required'=> 'Setiap kolom wajib punya minimal satu sub-kolom.',
        ];
    }
}