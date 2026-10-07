<?php

namespace App\Http\Controllers\Api\V1\Branch;

use App\Http\Controllers\Controller;
use App\Http\Requests\Branch\StoreBranchOfficeRequest;
use App\Http\Requests\Branch\UpdateBranchModulesRequest;
use App\Http\Requests\Branch\UpdateBranchOfficeRequest;
use App\Models\Branch\BranchModule;
use App\Models\Branch\BranchOffice;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchOfficeController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/branches
     * List branch offices with per-family module availability summary.
     */
    public function index(Request $request): JsonResponse
    {
        $query = BranchOffice::query();

        if ($request->has('search')) {
            $search = $request->string('search')->trim();
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"));
        }

        $offices = $query->withCount([
            'modules as cnsd_available_count' => fn ($q) => $q->where('module_type', 'cnsd')->where('is_available', true),
            'modules as tfp_available_count'  => fn ($q) => $q->where('module_type', 'tfp')->where('is_available', true),
        ])
            ->orderBy('code')
            ->get()
            ->map(fn (BranchOffice $office) => $this->summarize($office));

        return $this->success($offices, 'Branch offices retrieved successfully');
    }

    /**
     * GET /api/v1/branches/module-catalog
     * Configurable CNSD / TFP modules (key + label + group + route), derived
     * from DashboardModuleRegistry so the frontend never hardcodes module
     * names. Used to build the per-branch availability toggles.
     */
    public function moduleCatalog(): JsonResponse
    {
        return $this->success([
            'cnsd' => BranchModule::catalog('cnsd'),
            'tfp'  => BranchModule::catalog('tfp'),
        ], 'Module catalog retrieved successfully');
    }

    /**
     * POST /api/v1/branches
     */
    public function store(StoreBranchOfficeRequest $request): JsonResponse
    {
        $office = BranchOffice::create($request->validated());

        return $this->success($this->summarize($office), 'Branch office created successfully', 201);
    }

    /**
     * GET /api/v1/branches/{id}
     */
    public function show(int $id): JsonResponse
    {
        $office = BranchOffice::with('modules')->find($id);
        if (!$office) {
            return $this->error('Branch office tidak ditemukan.', null, 404);
        }

        return $this->success($this->detail($office), 'Branch office retrieved successfully');
    }

    /**
     * PUT /api/v1/branches/{id}
     */
    public function update(UpdateBranchOfficeRequest $request, int $id): JsonResponse
    {
        $office = BranchOffice::find($id);
        if (!$office) {
            return $this->error('Branch office tidak ditemukan.', null, 404);
        }

        $office->update($request->validated());

        return $this->success($this->summarize($office), 'Branch office updated successfully');
    }

    /**
     * PUT /api/v1/branches/{id}/modules
     *
     * Synchronizes module availability for a branch from a submitted keyed
     * map. Incoming keys not in the canonical catalog are ignored.
     */
    public function updateModules(UpdateBranchModulesRequest $request, int $id): JsonResponse
    {
        $office = BranchOffice::find($id);
        if (!$office) {
            return $this->error('Branch office tidak ditemukan.', null, 404);
        }

        $incoming = collect($request->validated('modules'));

        foreach (BranchModule::MODULE_TYPES as $moduleType) {
            foreach (BranchModule::keys($moduleType) as $moduleKey) {
                $submitted = $incoming->first(
                    fn ($m) => $m['type'] === $moduleType && $m['key'] === $moduleKey
                );

                BranchModule::updateOrCreate(
                    ['branch_office_id' => $office->id, 'module_type' => $moduleType, 'module_key' => $moduleKey],
                    ['is_available' => (bool) ($submitted['is_available'] ?? false)],
                );
            }
        }

        $office->load('modules');

        return $this->success($this->detail($office), 'Module availability updated successfully');
    }

    /**
     * DELETE /api/v1/branches/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $office = BranchOffice::find($id);
        if (!$office) {
            return $this->error('Branch office tidak ditemukan.', null, 404);
        }

        $office->delete();

        return $this->success(null, 'Branch office deleted successfully');
    }

    // ─── Transformers ─────────────────────────────────────────

    private function summarize(BranchOffice $office): array
    {
        return [
            'id'                  => $office->id,
            'code'                => $office->code,
            'name'                => $office->name,
            'is_active'           => $office->is_active,
            'cnsd_available_count' => (int) ($office->cnsd_available_count ?? 0),
            'tfp_available_count'  => (int) ($office->tfp_available_count ?? 0),
            'created_at'          => $office->created_at?->toISOString(),
            'updated_at'          => $office->updated_at?->toISOString(),
        ];
    }

    private function detail(BranchOffice $office): array
    {
        $modules = $office->modules
            ->groupBy('module_type')
            ->map(fn ($group) => $group->map(fn (BranchModule $m) => [
                'key'          => $m->module_key,
                'is_available' => $m->is_available,
            ])->values()->toArray());

        return array_merge($this->summarize($office), [
            'modules' => [
                'cnsd' => $modules->get('cnsd', []),
                'tfp'  => $modules->get('tfp', []),
            ],
        ]);
    }
}
