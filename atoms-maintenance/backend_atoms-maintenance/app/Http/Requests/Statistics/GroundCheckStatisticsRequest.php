<?php

namespace App\Http\Requests\Statistics;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the read-only Ground Check per-module statistics query.
 *
 * `metric_key` addresses one measurement column of the module (e.g. tx1_error
 * on DVOR, tx1_rf_level_db on Localizer). It is a single value, so unlike the
 * TFP point triple there is nothing to keep in sync — `sometimes` + `string` is
 * enough. An unknown key is not rejected here: the service returns an empty
 * series, which renders as "no readings" rather than an error.
 *
 * `year` is only type-checked; the controller clamps out-of-range years to the
 * current one, matching the other statistics endpoints.
 */
class GroundCheckStatisticsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'year' => ['sometimes', 'integer'],
            'metric_key' => ['sometimes', 'nullable', 'string', 'max:40'],
        ];
    }
}
