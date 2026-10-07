import type {
  CnsdReadinessItem,
  CnsdReadinessRecordDetail,
  CnsdReadinessSectionMeta,
} from '@/types/cnsd';

// ─── Option sets for the EQ-1 pick-list columns ────────────────

export const READINESS_STATUS_OPTIONS = ['NORMAL', 'TIDAK NORMAL'] as const;
export const READINESS_DUAL_STATE_OPTIONS = ['REDUNDANT', 'MAIN-STANDBY'] as const;
export const READINESS_DUAL_STATUS_OPTIONS = ['DUAL', 'SINGLE'] as const;

// Canonical column labels. Toggle behaviour is detected from the label (not the
// section name) so renaming a section header keeps the right input control.
const DUAL_STATE_LABEL = 'DUAL STATE';
const DUAL_STATUS_LABEL = 'DUAL STATUS';

// ─── Label comparison ─────────────────────────────────────────

const canonicalKey = (v: string | null | undefined): string =>
  (v ?? '').trim().replace(/\s+/g, ' ').toUpperCase();

export const isDualStateColumn = (label: string | null | undefined): boolean =>
  canonicalKey(label) === DUAL_STATE_LABEL;

export const isDualStatusColumn = (label: string | null | undefined): boolean =>
  canonicalKey(label) === DUAL_STATUS_LABEL;

/**
 * Tolerant "is this option selected?" check — canonicalizes case and spacing so
 * values typed before these columns became pick-lists still light up correctly.
 */
export const isOptionActive = (value: string | null | undefined, option: string): boolean =>
  canonicalKey(value) === canonicalKey(option);

/**
 * True when the stored value matches one of the options (i.e. it can be shown
 * as a highlighted pill). Anything else is legacy free text that the toggle
 * cannot represent — callers surface it so it is never silently hidden.
 */
export const matchesAnyOption = (
  value: string | null | undefined,
  options: readonly string[],
): boolean => options.some((o) => isOptionActive(value, o));

// ─── Legacy value normalization ───────────────────────────────

/**
 * Free-text variants that operators typed into the option columns before they
 * became pick-lists. Only unambiguous synonyms are listed; anything unrecognized
 * is returned untouched so no historical data is ever silently dropped.
 */
const LEGACY_ALIASES: Record<string, readonly string[]> = {
  DUAL: ['DUAL STATE', 'DUAL CHANNEL', 'DUAL+REDUNDANT', 'REDUNDANT'],
  SINGLE: ['SINGLE STATE', 'SINGLE CHANNEL', 'MAIN-STANDBY', 'MAIN STANDBY', 'MAIN'],
  NORMAL: ['OK', 'NORMAL (OK)', 'GOOD'],
  'TIDAK NORMAL': ['NOT NORMAL', 'TIDAK NORMAL (GANGGUAN)', 'GANGGUAN'],
  REDUNDANT: ['REDUNDANT (DUAL)', 'DUAL'],
  'MAIN-STANDBY': ['MAIN STANDBY', 'SINGLE'],
};

/**
 * Maps a stored value onto the canonical option it represents, or returns it
 * unchanged when nothing matches.
 */
export const normalizeOptionValue = (
  value: string | null | undefined,
  options: readonly string[],
): string | null => {
  if (value == null) return null;

  const key = canonicalKey(value);
  if (key === '') return null;

  const direct = options.find((o) => canonicalKey(o) === key);
  if (direct) return direct;

  for (const [canonical, aliases] of Object.entries(LEGACY_ALIASES)) {
    if (!options.some((o) => canonicalKey(o) === canonical)) continue;
    if (aliases.some((a) => canonicalKey(a) === key)) return canonical;
  }

  return value;
};

// ─── Record normalization ─────────────────────────────────────

/**
 * Rewrites every pick-list cell of a single item to its canonical value so
 * legacy records display — and re-save — as DUAL/SINGLE instead of raw text.
 */
export const normalizeReadinessItem = (
  item: CnsdReadinessItem,
  sectionsMeta: readonly CnsdReadinessSectionMeta[],
): CnsdReadinessItem => {
  const meta = sectionsMeta.find((s) => s.name === item.section_name);
  if (!meta) return item;

  const patch: Partial<CnsdReadinessItem> = {
    status_peralatan: normalizeOptionValue(item.status_peralatan, READINESS_STATUS_OPTIONS),
  };

  if (isDualStatusColumn(meta.columns_label_1)) {
    patch.kondisi_operasional_1 = normalizeOptionValue(
      item.kondisi_operasional_1,
      READINESS_DUAL_STATUS_OPTIONS,
    );
  }

  if (isDualStateColumn(meta.columns_label_2)) {
    patch.kondisi_operasional_2 = normalizeOptionValue(
      item.kondisi_operasional_2,
      READINESS_DUAL_STATE_OPTIONS,
    );
  }

  return { ...item, ...patch };
};

/**
 * Applies normalizeReadinessItem across a whole record. Used by the service
 * layer so the form, the print view, and every subsequent save all see
 * canonical values regardless of which endpoint loaded the record.
 */
export const normalizeReadinessRecord = <T extends CnsdReadinessRecordDetail>(
  record: T,
): T => {
  if (!record?.items) return record;
  return { ...record, items: record.items.map((it) => normalizeReadinessItem(it, record.sections_meta ?? [])) };
};