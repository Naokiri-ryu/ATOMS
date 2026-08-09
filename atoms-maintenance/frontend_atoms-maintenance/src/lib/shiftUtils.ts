import type { ShiftType } from '@/types';

/**
 * Shift utilities — single source of truth on the frontend.
 *
 * Why this lives on the frontend:
 *   The maintenance backend runs in UTC (config/app.php → 'timezone' => 'UTC').
 *   If we let the backend auto-detect the current shift via `Carbon::now()`,
 *   it picks the wrong shift in Indonesian working hours (e.g. 17:00 WIB =
 *   10:00 UTC → backend thinks it's 'pagi' when it's really 'siang').
 *
 *   So the frontend MUST compute date+shift from the user's local clock and
 *   pass them explicitly to /api/v1/personnel/shift-today.
 *
 * The three shift windows match atoms-rostering's `shifts` table:
 *   pagi  : 07:00 - 13:00
 *   siang : 13:00 - 19:00
 *   malam : 19:00 - 07:00 (wraps to next day)
 */

export function getCurrentShiftType(now: Date = new Date()): ShiftType {
  const h = now.getHours();
  if (h >= 7 && h < 13) return 'pagi';
  if (h >= 13 && h < 19) return 'siang';
  return 'malam';
}

/**
 * Get the work date the active shift belongs to.
 *
 * For shift `malam` running 19:00-07:00, hours 00:00-06:59 belong to the
 * previous calendar day's malam shift. All other hours belong to the
 * current calendar day.
 *
 * Returns YYYY-MM-DD in the user's local timezone (no UTC drift).
 */
export function getCurrentShiftDate(now: Date = new Date()): string {
  const d = new Date(now);
  if (d.getHours() < 7) {
    // Early-morning hours belong to yesterday's malam shift
    d.setDate(d.getDate() - 1);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getShiftLabel(shift: ShiftType): {
  label: string;
  start: string;
  end: string;
  emoji: string;
} {
  if (shift === 'pagi') return { label: 'Shift Pagi', start: '07:00', end: '13:00', emoji: '☀️' };
  if (shift === 'siang') return { label: 'Shift Siang', start: '13:00', end: '19:00', emoji: '🌤️' };
  return { label: 'Shift Malam', start: '19:00', end: '07:00', emoji: '🌙' };
}

/**
 * Effective sort minutes for a logbook note time inside its shift.
 *
 * The malam shift (19:00-07:00) wraps past midnight, so a note logged at
 * 00:45 actually happens AFTER one at 19:05 and must sort at the BOTTOM of
 * the malam list — not at the top. Any malam time earlier than the shift
 * start (19:00) is therefore treated as belonging to the next day (+24h).
 * Returns null when there is no parseable time so callers can sort those
 * last.
 */
export function noteSortMinutes(shift: ShiftType, time: string | null): number | null {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return null;
  const minutes = Number(m[1]) * 60 + Number(m[2]);
  if (shift === 'malam' && minutes < 19 * 60) {
    return minutes + 24 * 60;
  }
  return minutes;
}
