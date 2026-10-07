/**
 * Formatter bersama halaman statistik.
 *
 * Dipisah dari file komponen MinMaxAvgChart karena bereaksi cepat hanya berlaku
 * pada file yang seluruh ekspornya adalah komponen — file ini murni fungsi.
 */

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** Nilai uzup 2 desimal, atau "—" untuk bulan tanpa pembacaan. */
export const formatNilai = (value: number | null): string =>
  value === null ? '\u2014' : value.toLocaleString('id-ID', { maximumFractionDigits: 2 });

/** "2026-09-17" → "17 Sep 2026", atau "—" bila kosong/tidak valid. */
export const formatTanggal = (iso: string | null): string => {
  if (!iso) return '\u2014';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '\u2014';
  return `${d} ${BULAN[m - 1]} ${y}`;
};

export const BULAN_LABELS = BULAN;
