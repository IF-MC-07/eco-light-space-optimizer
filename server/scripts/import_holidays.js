/**
 * server/scripts/import_holidays.js
 * 
 * Skrip migrasi dan impor upsert data libur (Tahap 4).
 * Menolak berjalan kecuali koneksi menggunakan role dslb_test dan schema_test.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../app/models/index.js';
import { generateCustomId } from '../app/utils/idGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper sederhana untuk parse CSV dengan quotes
function parseCSV(content) {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let insideQuotes = false;
    let currentVal = '';

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim());

    const row = {};
    headers.forEach((h, idx) => {
      let val = values[idx] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      row[h] = val;
    });
    rows.push(row);
  }
  return rows;
}

async function main() {
  console.log('====================================================');
  console.log('=== MIGRATION & IMPORT HOLIDAYS (TAHAP 4) ==========');
  console.log('====================================================');

  // 1. Guard Koneksi DB: Wajib role 'dslb_test' dan schema 'schema_test'
  const [userResult] = await db.sequelize.query('SELECT current_user, current_schema();');
  const currentUser = userResult[0]?.current_user;
  const currentSchema = userResult[0]?.current_schema;

  console.log(`Current User:   ${currentUser}`);
  console.log(`Current Schema: ${currentSchema}`);

  if (currentUser !== 'dslb_test' || currentSchema !== 'schema_test') {
    console.error(`\n[FATAL ERROR] Koneksi database ditolak!`);
    console.error(`Diharapkan user 'dslb_test' dan schema 'schema_test'.`);
    console.error(`Ditemukan: user '${currentUser}' dan schema '${currentSchema}'.`);
    console.error(`Aborting execution.`);
    process.exit(1);
  }
  console.log('[OK] Verifikasi role dslb_test dan schema_test berhasil.\n');

  // 2. Eksekusi DDL Migration di schema_test
  console.log('Menjalankan migrasi pembuatan tabel holidays...');
  const migrationUpPath = path.resolve(__dirname, '../app/schemas/migrations/002_holidays.up.sql');
  const migrationSql = fs.readFileSync(migrationUpPath, 'utf-8');
  await db.sequelize.query(migrationSql);
  console.log('[OK] Tabel holidays terverifikasi di database.\n');

  // 3. Cari dan parse semua CSV di server/data/holidays_*.csv
  const dataDir = path.resolve(__dirname, '../data');
  const files = fs.readdirSync(dataDir).filter((f) => f.startsWith('holidays_') && f.endsWith('.csv'));

  console.log(`Ditemukan ${files.length} file CSV libur: ${files.join(', ')}`);

  let totalUpserted = 0;

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCSV(content);

    console.log(`\nMemproses ${file} (${rows.length} baris)...`);

    for (const r of rows) {
      const holidayId = generateCustomId('HLD');
      const holidayDate = r.holiday_date;
      const name = r.name;
      const type = r.type;
      const suspendRules = r.suspend_rules === 'true' || r.suspend_rules === true;
      const sourceRef = r.source_ref || null;

      await db.sequelize.query(
        `INSERT INTO holidays (holiday_id, holiday_date, name, type, suspend_rules, source_ref)
         VALUES (:holidayId, :holidayDate, :name, :type, :suspendRules, :sourceRef)
         ON CONFLICT (holiday_date, name)
         DO UPDATE SET
           type = EXCLUDED.type,
           suspend_rules = EXCLUDED.suspend_rules,
           source_ref = EXCLUDED.source_ref;`,
        {
          replacements: {
            holidayId,
            holidayDate,
            name,
            type,
            suspendRules,
            sourceRef,
          },
        }
      );
      totalUpserted++;
    }
    console.log(`  -> Berhasil upsert ${rows.length} entri.`);
  }

  // 4. Tampilkan Ringkasan Libur dari Database
  console.log('\n====================================================');
  console.log('=== DAFTAR LIBUR DALAM DATABASE (schema_test) ======');
  console.log('====================================================');
  const [allHolidays] = await db.sequelize.query(
    `SELECT 
       holiday_id,
       holiday_date,
       name,
       type,
       suspend_rules,
       source_ref
     FROM holidays
     ORDER BY holiday_date ASC;`
  );

  console.table(
    allHolidays.map((h) => ({
      ID: h.holiday_id,
      Date: h.holiday_date,
      Name: h.name,
      Type: h.type,
      Suspend: h.suspend_rules,
      Source: h.source_ref ? h.source_ref.slice(0, 30) + '...' : '-',
    }))
  );

  console.log(`\nTotal libur tersimpan: ${allHolidays.length} hari.`);
  console.log('[SELESAI] Migrasi dan upsert data libur selesai.');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n[FATAL ERROR] Kegagalan eksekusi skrip:');
  console.error(err);
  process.exit(1);
});
