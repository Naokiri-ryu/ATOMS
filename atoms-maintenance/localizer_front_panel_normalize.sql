-- ─────────────────────────────────────────────────────────────────────
-- Normalisasi FRONT PANEL (group 1) — CNSD Localizer Meter Reading
--
-- Latar belakang: kolom TX1/TX2 di FRONT PANEL kini memakai toggle
-- (NORMAL/ALARM, √/-, LOCAL/REMOTE). Nilai lama yang tercatat bebas
-- (mis. "normal", "V", "R", "remote") perlu dinormalkan ke nilai kanonik
-- AGAR tampil aktif di toggle.
--
-- Cakupan: HANYA record yang DIBUAT mulai cutoff toggle:
--   created_at >= '2026-09-08 00:00:00'  (Asia/Jakarta)
-- Record lama TIDAK diubah — di layar tetap memakai input teks.
--
-- Nilai yang TIDAK bisa dipetakan (TX1, 28V, 27,9, kosong, dsb.)
-- dibiarkan apa adanya supaya tidak ada data yang hilang atau dizalimi.
--
-- Menjalankan (host/WSL, stream via stdin):
--   cat localizer_front_panel_normalize.sql \
--     | docker exec -i teknik2026-atoms-db-1 psql -U atoms -d atoms
--
-- Versi cek dulu (harus 0 baris sebelum SELECT → 0 UPDATE):
--   SELECT count(*) FROM cnsd_localizer_meter_items i
--   JOIN cnsd_localizer_meter_records r ON r.id = i.localizer_meter_record_id
--   WHERE r.created_at >= '2026-09-08 00:00:00' AND i.group_number = 1;
-- ─────────────────────────────────────────────────────────────────────

UPDATE cnsd_localizer_meter_items i
SET hasil_1 = CASE
        WHEN lower(trim(i.hasil_1)) IN ('√', '✓', 'v')                     THEN '√'
        WHEN lower(trim(i.hasil_1)) IN ('normal', 'norm', 'n')             THEN 'NORMAL'
        WHEN lower(trim(i.hasil_1)) IN ('alarm', 'alrm', 'a')              THEN 'ALARM'
        WHEN trim(i.hasil_1) = '-'                                         THEN '-'
        WHEN lower(trim(i.hasil_1)) IN ('r', 'remote', 'rem')              THEN 'REMOTE'
        WHEN lower(trim(i.hasil_1)) IN ('l', 'local')                      THEN 'LOCAL'
        WHEN lower(trim(i.hasil_1)) = 'not'                                THEN 'NOT'
        WHEN lower(trim(i.hasil_1)) = 'ok'                                 THEN 'OK'
        ELSE i.hasil_1
    END,
    hasil_2 = CASE
        WHEN lower(trim(i.hasil_2)) IN ('√', '✓', 'v')                     THEN '√'
        WHEN lower(trim(i.hasil_2)) IN ('normal', 'norm', 'n')             THEN 'NORMAL'
        WHEN lower(trim(i.hasil_2)) IN ('alarm', 'alrm', 'a')              THEN 'ALARM'
        WHEN trim(i.hasil_2) = '-'                                         THEN '-'
        WHEN lower(trim(i.hasil_2)) IN ('r', 'remote', 'rem')              THEN 'REMOTE'
        WHEN lower(trim(i.hasil_2)) IN ('l', 'local')                      THEN 'LOCAL'
        WHEN lower(trim(i.hasil_2)) = 'not'                                THEN 'NOT'
        WHEN lower(trim(i.hasil_2)) = 'ok'                                 THEN 'OK'
        ELSE i.hasil_2
    END
FROM cnsd_localizer_meter_records r
WHERE r.id = i.localizer_meter_record_id
  AND r.created_at >= '2026-09-08 00:00:00'
  AND i.group_number = 1;