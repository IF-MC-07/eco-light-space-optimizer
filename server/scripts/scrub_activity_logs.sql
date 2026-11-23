-- ==============================================================================
-- Skrip Pembersihan (Scrubbing) Data Sensitif pada Tabel activity_logs
--
-- ATURAN: JANGAN DIJALANKAN SECARA OTOMATIS OLEH HARNESS ATAU MIGRATION.
-- Skrip ini dirancang untuk dijalankan manual oleh DBA/Administrator dalam transaksi.
--
-- Sasaran:
-- 1. Rute di bawah /api/auth/: details dikosongkan ('{}').
-- 2. Rute lainnya: kunci-kunci sensitif (password, secret, token, api-key, dll.)
--    disensor menjadi "[REDACTED]".
-- ==============================================================================

BEGIN;

-- 1. Scrub rute /api/auth/: kosongkan details
WITH auth_scrubbed AS (
  UPDATE activity_logs
  SET details = '{}'
  WHERE (
    action ILIKE '%/api/auth/%'
    OR action ILIKE '%/api/auth'
    OR action ILIKE '%/api/auth?%'
  )
  AND details IS NOT NULL
  AND details <> '{}'
  RETURNING log_id
)
SELECT count(*) AS total_auth_logs_scrubbed FROM auth_scrubbed;

-- 2. Scrub rute non-auth: sensor nilai kunci-kunci sensitif secara regex
-- Pola: pass|pwd|secret|token|authorization|jwt|otp|credential|api[-_]?key|cookie|session
WITH non_auth_scrubbed AS (
  UPDATE activity_logs
  SET details = REGEXP_REPLACE(
    details,
    '("(?i:[^"]*(?:pass|pwd|secret|token|authorization|jwt|otp|credential|api[-_]?key|cookie|session)[^"]*)":\s*)("(?:[^"\\]|\\.)*"|[0-9]+|true|false|null)',
    '\1"[REDACTED]"',
    'g'
  )
  WHERE (
    action NOT ILIKE '%/api/auth/%'
    AND action NOT ILIKE '%/api/auth'
    AND action NOT ILIKE '%/api/auth?%'
    OR action IS NULL
  )
  AND details IS NOT NULL
  AND details ~* '(pass|pwd|secret|token|authorization|jwt|otp|credential|api[-_]?key|cookie|session)'
  RETURNING log_id
)
SELECT count(*) AS total_non_auth_logs_scrubbed FROM non_auth_scrubbed;

-- Selesai: lakukan commit jika semua pembaruan berhasil
COMMIT;
