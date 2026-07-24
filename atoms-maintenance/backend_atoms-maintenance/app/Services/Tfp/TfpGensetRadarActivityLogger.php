<?php

namespace App\Services\Tfp;

use App\Models\LocalUser;
use App\Models\Logbook\LogbookTfp;
use App\Services\Logbook\LogbookTfpService;
use Illuminate\Support\Facades\Log;

class TfpGensetRadarActivityLogger
{
    public function __construct(
        protected LogbookTfpService $logbookService,
    ) {}

    public function appendLogbookNote(string $facility, string $date, string $shift, LocalUser $creator): void
    {
        try {
            $logbook = $this->ensureLogbook($date, $creator);
            if (!$logbook) {
                return;
            }

            $logbook->notes()->create([
                'shift'    => $shift,
                'time'     => now()->format('H:i'),
                'activity' => "[Auto] {$facility} oleh {$creator->name}",
            ]);
        } catch (\Throwable $e) {
            Log::warning('TfpGensetRadarActivityLogger: appendLogbookNote failed', [
                'facility' => $facility, 'date' => $date, 'shift' => $shift, 'error' => $e->getMessage(),
            ]);
        }
    }

    private function ensureLogbook(string $date, LocalUser $creator): ?LogbookTfp
    {
        $existing = LogbookTfp::whereDate('date', $date)->first();
        if ($existing) {
            return $existing;
        }

        try {
            return $this->logbookService->createLogbook($date, $creator);
        } catch (\Throwable) {
            return LogbookTfp::whereDate('date', $date)->first();
        }
    }
}
