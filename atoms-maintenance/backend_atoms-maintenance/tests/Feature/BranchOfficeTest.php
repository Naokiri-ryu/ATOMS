<?php

namespace Tests\Feature;

use App\Models\Branch\BranchModule;
use App\Models\Branch\BranchOffice;
use App\Models\LocalUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PDO;
use Tests\TestCase;

class BranchOfficeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        // phpunit.xml points DB_CONNECTION at in-memory sqlite, which
        // RefreshDatabase needs. The dev server only ships pdo_pgsql — and
        // pointing RefreshDatabase at the real Postgres DB would wipe it — so
        // skip instead of failing when the driver is unavailable.
        if (! in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('pdo_sqlite is required for the in-memory test database.');
        }

        // MockAuthMiddleware reads DEV_MOCK_AUTH through env(). Force mock mode
        // BEFORE the app boots so the test never attempts a real rostering
        // token validation over HTTP.
        putenv('DEV_MOCK_AUTH=true');
        $_ENV['DEV_MOCK_AUTH'] = 'true';
        $_SERVER['DEV_MOCK_AUTH'] = 'true';

        parent::setUp();
    }

    /**
     * Authenticate as $user for an HTTP request.
     *
     * The route group runs `auth:sanctum` and then `mockauth`, so both have to
     * be satisfied: the sanctum guard is primed with actingAs, and the mock
     * bearer token is seeded into the cache the same way the login flow does
     * (MockAuthMiddleware looks the token up before parsing the user id).
     */
    private function asUser(LocalUser $user): static
    {
        $token = "mock-token-{$user->rostering_user_id}";
        Cache::put($token, $token, 3600);

        return $this->actingAs($user, 'sanctum')
            ->withHeader('Authorization', "Bearer {$token}");
    }

    private function adminUser(): LocalUser
    {
        return LocalUser::create([
            'rostering_user_id' => 9001,
            'name'              => 'Admin Branch',
            'email'             => 'branch-admin@example.test',
            'role'              => 'Admin',
            'division'          => null,
            'is_active'         => true,
            'synced_at'         => now(),
        ]);
    }

    private function teknisiUser(): LocalUser
    {
        return LocalUser::create([
            'rostering_user_id' => 9002,
            'name'              => 'Teknisi Branch',
            'email'             => 'branch-teknisi@example.test',
            'role'              => 'Teknisi CNSD',
            'division'          => 'CNSD',
            'is_active'         => true,
            'synced_at'         => now(),
        ]);
    }

    public function test_catalog_exposes_labeled_cnsd_and_tfp_modules(): void
    {
        $response = $this->asUser($this->teknisiUser())
            ->getJson('/api/v1/branches/module-catalog');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'cnsd' => [['key', 'label', 'group', 'route']],
                    'tfp'  => [['key', 'label', 'group', 'route']],
                ],
            ]);

        $cnsd = $response->json('data.cnsd');
        $tfp  = $response->json('data.tfp');

        // CNSD = Readiness (1) + Meter Reading (16); TFP = Performance (10).
        $this->assertCount(17, $cnsd);
        $this->assertCount(10, $tfp);

        $this->assertContains('cnsd-radar', array_column($cnsd, 'key'));
        $this->assertContains('tfp-tower', array_column($tfp, 'key'));

        // Labels come from DashboardModuleRegistry, never hardcoded here.
        $radar = collect($cnsd)->firstWhere('key', 'cnsd-radar');
        $this->assertSame('Meter Reading Radar', $radar['label']);
        $this->assertSame('CNSD Meter Reading', $radar['group']);

        // Ground Check / Grounding are intentionally out of scope.
        $allKeys = array_merge(array_column($cnsd, 'key'), array_column($tfp, 'key'));
        $this->assertEmpty(array_intersect($allKeys, ['gc-adc', 'grounding']));
    }

    public function test_admin_can_create_branch_office(): void
    {
        $response = $this->asUser($this->adminUser())
            ->postJson('/api/v1/branches', [
                'code'      => 'KDR',
                'name'      => 'Cabang Kediri',
                'is_active' => true,
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'KDR');

        $this->assertDatabaseHas('branch_offices', ['code' => 'KDR', 'name' => 'Cabang Kediri']);
    }

    public function test_teknisi_cannot_create_branch_office(): void
    {
        $response = $this->asUser($this->teknisiUser())
            ->postJson('/api/v1/branches', [
                'code' => 'XXX',
                'name' => 'Unauthorized Branch',
            ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('branch_offices', ['code' => 'XXX']);
    }

    public function test_index_lists_offices_with_availability_counts(): void
    {
        $office = BranchOffice::create(['code' => 'SUB', 'name' => 'Cabang Surabaya', 'is_active' => true]);
        BranchModule::create(['branch_office_id' => $office->id, 'module_type' => 'cnsd', 'module_key' => 'cnsd-radar', 'is_available' => true]);
        BranchModule::create(['branch_office_id' => $office->id, 'module_type' => 'tfp', 'module_key' => 'tfp-tower', 'is_available' => true]);
        BranchModule::create(['branch_office_id' => $office->id, 'module_type' => 'tfp', 'module_key' => 'tfp-dvor', 'is_available' => false]);

        $response = $this->asUser($this->teknisiUser())->getJson('/api/v1/branches');

        $response->assertOk();
        $row = collect($response->json('data'))->firstWhere('code', 'SUB');

        $this->assertNotNull($row);
        $this->assertSame(1, $row['cnsd_available_count']);
        $this->assertSame(1, $row['tfp_available_count']);
    }

    public function test_update_modules_syncs_availability_for_full_catalog(): void
    {
        $office = BranchOffice::create(['code' => 'MLG', 'name' => 'Cabang Malang', 'is_active' => true]);

        $modules = [];
        foreach (BranchModule::keys('cnsd') as $key) {
            $modules[] = ['type' => 'cnsd', 'key' => $key, 'is_available' => true];
        }
        foreach (BranchModule::keys('tfp') as $key) {
            $modules[] = ['type' => 'tfp', 'key' => $key, 'is_available' => false];
        }

        $response = $this->asUser($this->adminUser())
            ->putJson("/api/v1/branches/{$office->id}/modules", ['modules' => $modules]);

        $response->assertOk()->assertJsonPath('success', true);

        // Every CNSD module available, every TFP module unavailable.
        $this->assertSame(
            count(BranchModule::keys('cnsd')),
            BranchModule::where('branch_office_id', $office->id)->where('module_type', 'cnsd')->where('is_available', true)->count()
        );
        $this->assertSame(
            0,
            BranchModule::where('branch_office_id', $office->id)->where('module_type', 'tfp')->where('is_available', true)->count()
        );
    }

    public function test_update_modules_rejects_unknown_module_key(): void
    {
        $office = BranchOffice::create(['code' => 'BYW', 'name' => 'Cabang Banyuwangi', 'is_active' => true]);

        $response = $this->asUser($this->adminUser())
            ->putJson("/api/v1/branches/{$office->id}/modules", [
                'modules' => [['type' => 'cnsd', 'key' => 'radar-meter', 'is_available' => true]],
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('modules.0.key');
        $this->assertSame(0, BranchModule::where('branch_office_id', $office->id)->count());
    }

    public function test_update_modules_rejects_key_from_the_other_family(): void
    {
        $office = BranchOffice::create(['code' => 'BWN', 'name' => 'Cabang Bawean', 'is_active' => true]);

        // Valid key, but it belongs to TFP — must not be filed under CNSD.
        $response = $this->asUser($this->adminUser())
            ->putJson("/api/v1/branches/{$office->id}/modules", [
                'modules' => [['type' => 'cnsd', 'key' => 'tfp-tower', 'is_available' => true]],
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('modules.0.key');
        $this->assertSame(0, BranchModule::where('branch_office_id', $office->id)->count());
    }

    public function test_teknisi_cannot_update_modules(): void
    {
        $office = BranchOffice::create(['code' => 'JBR', 'name' => 'Cabang Jember', 'is_active' => true]);

        $response = $this->asUser($this->teknisiUser())
            ->putJson("/api/v1/branches/{$office->id}/modules", [
                'modules' => [['type' => 'cnsd', 'key' => 'cnsd-radar', 'is_available' => true]],
            ]);

        $response->assertForbidden();
        $this->assertSame(0, BranchModule::where('branch_office_id', $office->id)->count());
    }

    public function test_destroy_removes_office_and_its_modules(): void
    {
        $office = BranchOffice::create(['code' => 'SMN', 'name' => 'Cabang Sumenep', 'is_active' => false]);
        BranchModule::create(['branch_office_id' => $office->id, 'module_type' => 'cnsd', 'module_key' => 'cnsd-dme', 'is_available' => true]);

        $response = $this->asUser($this->adminUser())
            ->deleteJson("/api/v1/branches/{$office->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('branch_offices', ['id' => $office->id]);
        $this->assertSame(0, BranchModule::where('branch_office_id', $office->id)->count());
    }
}