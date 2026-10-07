<?php

namespace App\Console\Commands;

use App\Models\Cnsd\CnsdReadinessRecord;
use App\Services\Cnsd\CnsdReadinessValueNormalizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * php artisan cnsd:normalize-readiness-values
 *
 * Rewrites legacy free-text values in the EQ-1 "Kesiapan Peralatan" pick-list
 * columns (status_peralatan, kondisi_operasional_1, kondisi_operasional_2) to
 * their canonical options — NORMAL / TIDAK NORMAL, DUAL / SINGLE, REDUNDANT /
 * MAIN-STANDBY.
 *
 * The frontend already normalizes on read, so this is not required for the UI
 * to look right; this command fixes the stored data for records whose rows are
 * never re-saved, which keeps the print output and any future export clean.
 *
 * Only unambiguous synonyms are mapped. A value that matches nothing is left
 * exactly as it is and reported as "unmapped" so it can be reviewed by hand.
 *
 * Safe by default: pass --dry-run to preview, --force to write. Idempotent.
 */
class NormalizeCnsdReadinessValuesCommand extends Command
{
    protected $signature = 'cnsd:normalize-readiness-values
                            {--dry-run : Preview the changes without writing}
                            {--force : Actually write the normalized values}';

    protected $description = 'Normalize legacy free-text EQ-1 pick-list values to NORMAL / DUAL / SINGLE / REDUNDANT / MAIN-STANDBY.';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');

        if (! $dry && ! $force) {
            $this->error('Pass --dry-run to preview or --force to apply changes.');

            return self::FAILURE;
        }

        $this->info('Scanning cnsd_readiness_items for legacy pick-list values...');

        $records = CnsdReadinessRecord::query()
            ->select('id', 'form_number', 'sections_meta')
            ->get();

        if ($records->isEmpty()) {
            $this->info('No readiness records found. Nothing to normalize.');

            return self::SUCCESS;
        }

        $changed = 0;
        $unchanged = 0;
        $blanked = [];
        $report = [];
        $updates = [];

        foreach ($records as $record) {
            $optionMap = CnsdReadinessValueNormalizer::optionMapForRecord($record->sections_meta);
            if ($optionMap === []) {
                continue;
            }

            $items = DB::table('cnsd_readiness_items')
                ->where('readiness_record_id', $record->id)
                ->select('id', 'section_name', 'status_peralatan', 'kondisi_operasional_1', 'kondisi_operasional_2')
                ->get();

            foreach ($items as $item) {
                $itemArray = (array) $item;
                $normalized = CnsdReadinessValueNormalizer::normalizedFieldsForItem($itemArray, $optionMap);

                $patch = [];
                foreach ($normalized as $field => $newValue) {
                    $oldValue = $itemArray[$field] ?? null;
                    if ($newValue === $oldValue) {
                        continue;
                    }

                    $patch[$field] = $newValue;

                    if ($newValue === null && trim((string) $oldValue) === '') {
                        // Whitespace-only legacy value, now a clean NULL.
                        $blanked[] = sprintf(
                            '[blanked] record=%d item=%d %s was "%s"',
                            $record->id, $item->id, $field, $oldValue
                        );

                        continue;
                    }

                    $report[] = sprintf(
                        '[%s] record=%d item=%d %s: "%s" → "%s"',
                        $dry ? 'dry' : 'fix',
                        $record->id,
                        $item->id,
                        $field,
                        (string) $oldValue,
                        (string) $newValue
                    );
                }

                if ($patch === []) {
                    $unchanged++;

                    continue;
                }

                $changed++;
                if (! $dry) {
                    DB::table('cnsd_readiness_items')
                        ->where('id', $item->id)
                        ->update($patch);
                }
                $updates[$record->id] = true;
            }
        }

        $this->newLine();
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->line('  cnsd:normalize-readiness-values summary');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->line(sprintf('  Records scanned : %d', $records->count()));
        $this->line(sprintf('  Records touched : %d', count($updates)));
        $this->line(sprintf('  Items changed   : %d', $changed));
        $this->line(sprintf('  Items untouched : %d', $unchanged));
        $this->line(sprintf('  Whitespace-only values blanked : %d', count($blanked)));
        if ($dry) {
            $this->warn('  DRY RUN — no changes written. Re-run with --force to apply.');
        } else {
            $this->info('  Changes written.');
        }
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        $lines = array_merge($report, $blanked);
        if ($lines !== []) {
            $this->newLine();
            foreach ($lines as $line) {
                $this->line($line);
            }
            $this->newLine();
            $this->line('Values not listed above were either already canonical or');
            $this->line('unrecognized free text left untouched for manual review.');
        }

        return self::SUCCESS;
    }
}
