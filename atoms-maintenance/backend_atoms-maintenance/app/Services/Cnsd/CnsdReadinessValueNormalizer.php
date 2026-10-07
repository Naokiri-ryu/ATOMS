<?php

namespace App\Services\Cnsd;

/**
 * CnsdReadinessValueNormalizer — canonical value handling for the EQ-1
 * "Kesiapan Peralatan" pick-list columns.
 *
 * Columns status_peralatan / kondisi_operasional_1 / kondisi_operasional_2 were
 * originally free text, so records created before those columns became
 * pick-lists hold hand-typed variants ("dual", " Dual ", "REDUNDANT", "Main
 * Standby", ...). This class maps those onto the canonical option so a record
 * always reads NORMAL / DUAL / SINGLE / REDUNDANT regardless of who typed it.
 *
 * Mirrors frontend_atoms-maintenance/src/lib/cnsdReadinessValues.ts — keep the
 * alias tables in the two files in step.
 *
 * Which column carries which option set is derived from the record's
 * sections_meta labels (not hardcoded section names), so a renamed section
 * header keeps the right value set.
 */
class CnsdReadinessValueNormalizer
{
    public const STATUS_OPTIONS = ['NORMAL', 'TIDAK NORMAL'];

    public const DUAL_STATE_OPTIONS = ['REDUNDANT', 'MAIN-STANDBY'];

    public const DUAL_STATUS_OPTIONS = ['DUAL', 'SINGLE'];

    private const DUAL_STATE_LABEL = 'DUAL STATE';

    private const DUAL_STATUS_LABEL = 'DUAL STATUS';

    /**
     * Unambiguous free-text synonyms that predate the pick-lists.
     * Anything not listed here is returned untouched — we never drop data.
     */
    private const LEGACY_ALIASES = [
        'DUAL' => ['DUAL STATE', 'DUAL CHANNEL', 'DUAL+REDUNDANT', 'REDUNDANT'],
        'SINGLE' => ['SINGLE STATE', 'SINGLE CHANNEL', 'MAIN-STANDBY', 'MAIN STANDBY', 'MAIN'],
        'NORMAL' => ['OK', 'NORMAL (OK)', 'GOOD'],
        'TIDAK NORMAL' => ['NOT NORMAL', 'TIDAK NORMAL (GANGGUAN)', 'GANGGUAN'],
        'REDUNDANT' => ['REDUNDANT (DUAL)', 'DUAL'],
        'MAIN-STANDBY' => ['MAIN STANDBY', 'SINGLE'],
    ];

    /** Case- and whitespace-insensitive comparison key. */
    public static function canonicalKey(?string $value): string
    {
        return strtoupper(trim(preg_replace('/\s+/', ' ', (string) $value) ?? ''));
    }

    public static function isDualStateColumn(?string $label): bool
    {
        return self::canonicalKey($label) === self::DUAL_STATE_LABEL;
    }

    public static function isDualStatusColumn(?string $label): bool
    {
        return self::canonicalKey($label) === self::DUAL_STATUS_LABEL;
    }

    /**
     * Maps a stored value onto the canonical option it represents, or returns it
     * unchanged when nothing matches. Returns null only for empty input.
     */
    public static function normalize(?string $value, array $options): ?string
    {
        if ($value === null) {
            return null;
        }

        $key = self::canonicalKey($value);
        if ($key === '') {
            return null;
        }

        foreach ($options as $option) {
            if (self::canonicalKey($option) === $key) {
                return $option;
            }
        }

        foreach (self::LEGACY_ALIASES as $canonical => $aliases) {
            $isInSet = false;
            foreach ($options as $option) {
                if (self::canonicalKey($option) === $canonical) {
                    $isInSet = true;
                    break;
                }
            }
            if (! $isInSet) {
                continue;
            }

            foreach ($aliases as $alias) {
                if (self::canonicalKey($alias) === $key) {
                    return $canonical;
                }
            }
        }

        return $value;
    }

    /**
     * Per-section option sets derived from a record's sections_meta payload.
     * Returns [sectionName => ['k1' => options|null, 'k2' => options|null]].
     */
    public static function optionMapForRecord(?array $sectionsMeta): array
    {
        $map = [];
        foreach ((array) $sectionsMeta as $section) {
            $name = $section['name'] ?? null;
            if ($name === null || trim($name) === '') {
                continue;
            }

            $map[$name] = [
                'k1' => self::isDualStatusColumn($section['columns_label_1'] ?? null)
                    ? self::DUAL_STATUS_OPTIONS
                    : null,
                'k2' => self::isDualStateColumn($section['columns_label_2'] ?? null)
                    ? self::DUAL_STATE_OPTIONS
                    : null,
            ];
        }

        return $map;
    }

    /**
     * Returns the canonicalized pick-list fields for one item, keyed by column.
     * Only columns that are actually pick-lists for that section are included.
     *
     * @return array<string, string|null> field => new value
     */
    public static function normalizedFieldsForItem(array $item, array $optionMap): array
    {
        $out = [
            'status_peralatan' => self::normalize($item['status_peralatan'] ?? null, self::STATUS_OPTIONS),
        ];

        $sets = $optionMap[$item['section_name'] ?? ''] ?? null;
        if ($sets === null) {
            return $out;
        }

        if ($sets['k1'] !== null) {
            $out['kondisi_operasional_1'] = self::normalize(
                $item['kondisi_operasional_1'] ?? null,
                $sets['k1']
            );
        }

        if ($sets['k2'] !== null) {
            $out['kondisi_operasional_2'] = self::normalize(
                $item['kondisi_operasional_2'] ?? null,
                $sets['k2']
            );
        }

        return $out;
    }
}
