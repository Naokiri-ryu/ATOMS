<?php

namespace App\Http\Requests\Branch;

use App\Models\Branch\BranchModule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBranchModulesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'modules'               => ['required', 'array'],
            'modules.*.type'        => ['required', 'string', Rule::in(BranchModule::MODULE_TYPES)],
            'modules.*.key'         => ['required', 'string', Rule::in(BranchModule::allKeys())],
            'modules.*.is_available' => ['required', 'boolean'],
        ];
    }

    /**
     * Reject entries whose key does not belong to the declared family, e.g.
     * type "cnsd" with key "tfp-tower". Without this the sync loop would
     * silently drop the row.
     */
    public function after(): array
    {
        return [function (Validator $validator) {
            foreach ($this->input('modules', []) as $index => $module) {
                if (!is_array($module)) {
                    continue;
                }

                $type = $module['type'] ?? null;
                $key  = $module['key'] ?? null;

                if (!is_string($type) || !is_string($key)) {
                    continue;
                }

                if (!in_array($key, BranchModule::keys($type), true)) {
                    $validator->errors()->add(
                        "modules.{$index}.key",
                        "Modul [{$key}] bukan bagian dari kelompok {$type}."
                    );
                }
            }
        }];
    }

    public function messages(): array
    {
        return [
            'modules.*.key.in' => 'Modul tidak dikenal. Muat ulang daftar modul dari server.',
        ];
    }
}