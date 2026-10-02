<?php

namespace App\Http\Requests\Statistics;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the read-only TFP per-equipment statistics query.
 *
 * The three "point" params together address one measurement point
 * (parameter_number + parameter_name + cell_key). Only "all three or none" is
 * meaningful, so each one is `required_with` the other two — that rule fires
 * when *any* sibling is present, which turns a partial triple into a 422
 * (`required_with_all` would not: it only fires once every sibling is set).
 *
 * `year` is only type-checked here; the controller clamps out-of-range years
 * to the current one, matching StatisticsController::overview.
 */
class TfpEquipmentStatisticsRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'year'             => ['sometimes', 'integer'],
            'parameter_number' => ['required_with:parameter_name,cell_key', 'nullable', 'string', 'max:10'],
            'parameter_name'   => ['required_with:parameter_number,cell_key', 'nullable', 'string', 'max:200'],
            'cell_key'         => ['required_with:parameter_number,parameter_name', 'nullable', 'string', 'max:120'],
        ];
    }

    public function messages(): array
    {
        $all = 'Parameter number, parameter name, dan cell key harus diisi bersamaan.';

        return [
            'parameter_number.required_with' => $all,
            'parameter_name.required_with'   => $all,
            'cell_key.required_with'         => $all,
        ];
    }
}