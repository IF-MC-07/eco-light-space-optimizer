/**
 * energyAggregation.util.js — VERSI FINAL
 * -----------------------------------------------------------------------
 * Perhitungan energi menggunakan integrasi trapesium atas power_watts
 * karena kolom energy_kwh selalu NULL di seluruh histori data.
 *
 * Rumus: E = ∫P dt → aproksimasi trapesium dengan Δt aktual.
 * Guard: MAX_GAP_SECONDS & MAX_PLAUSIBLE_WATTS berdasarkan kalibrasi.
 * Deduplikasi: bucket 5 detik untuk mengatasi dual-writer.
 * -----------------------------------------------------------------------
 */

import { QueryTypes } from 'sequelize';

// ====================== KONSTANTA KALIBRASI ======================
const DEDUP_BUCKET_SECONDS = 5;
const MAX_GAP_SECONDS = 60;          // Kalibrasi: p99 gap ~5 detik
const MAX_PLAUSIBLE_WATTS = 50;      // Kalibrasi: p999 ~17.6 W

// Helper konversi
const toWh = (kwh) => Number(kwh) * 1000;

/**
 * CTE bersama (dedup → ordered → intervals)
 */
const buildIntervalsCTE = (roomFilter) => `
  WITH deduped AS (
    SELECT
      room_id,
      to_timestamp(floor(extract(epoch FROM read_at) / :bucketSeconds) * :bucketSeconds) AS read_at,
      AVG(power_watts) AS power_watts
    FROM power_sensors
    WHERE power_watts IS NOT NULL
    ${roomFilter}
    GROUP BY room_id, floor(extract(epoch FROM read_at) / :bucketSeconds)
  ),
  ordered AS (
    SELECT
      room_id,
      read_at,
      power_watts,
      LAG(read_at) OVER (PARTITION BY room_id ORDER BY read_at) AS prev_read_at,
      LAG(power_watts) OVER (PARTITION BY room_id ORDER BY read_at) AS prev_power_watts
    FROM deduped
  ),
  intervals AS (
    SELECT
      room_id,
      read_at,
      CASE
        WHEN prev_read_at IS NULL THEN NULL
        WHEN EXTRACT(EPOCH FROM (read_at - prev_read_at)) <= 0 THEN NULL
        WHEN EXTRACT(EPOCH FROM (read_at - prev_read_at)) > :maxGapSeconds THEN NULL
        WHEN power_watts > :maxPlausibleWatts OR prev_power_watts > :maxPlausibleWatts THEN NULL
        ELSE
          ((power_watts + prev_power_watts) / 2.0)
          * (EXTRACT(EPOCH FROM (read_at - prev_read_at)) / 3600.0)
          / 1000.0
      END AS increment_kwh
    FROM ordered
  )
`;

/**
 * Total energi per ruangan
 */
export async function computeEnergyByRoom(sequelize, startDate, endDate, roomId = null) {
  const roomFilter = roomId ? 'AND room_id = :roomId' : '';

  const rows = await sequelize.query(
    `
    ${buildIntervalsCTE(roomFilter)}
    SELECT
      room_id,
      COALESCE(SUM(increment_kwh), 0) AS total_kwh
    FROM intervals
    WHERE read_at >= :startDate
      AND read_at < :endDate
    GROUP BY room_id
    `,
    {
      replacements: {
        startDate,
        endDate,
        roomId,
        bucketSeconds: DEDUP_BUCKET_SECONDS,
        maxGapSeconds: MAX_GAP_SECONDS,
        maxPlausibleWatts: MAX_PLAUSIBLE_WATTS,
      },
      type: QueryTypes.SELECT,
    }
  );

  return rows.map((r) => {
    const totalKwh = Number(r.total_kwh || 0);
    return {
      room_id: r.room_id,
      total_kwh: totalKwh,           // untuk kalkulasi internal
      total_wh: toWh(totalKwh),      // untuk tampilan (direkomendasikan)
    };
  });
}

/**
 * Tren energi per bucket waktu
 */
export async function computeEnergyTrend(sequelize, startDate, endDate, granularity, roomId = null) {
  if (!['hour', 'day'].includes(granularity)) {
    throw new Error(`Granularity tidak valid: "${granularity}". Gunakan "hour" atau "day".`);
  }

  const roomFilter = roomId ? 'AND room_id = :roomId' : '';

  const rows = await sequelize.query(
    `
    ${buildIntervalsCTE(roomFilter)}
    SELECT
      date_trunc('${granularity}', read_at) AS bucket,
      COALESCE(SUM(increment_kwh), 0) AS total_kwh
    FROM intervals
    WHERE read_at >= :startDate
      AND read_at < :endDate
    GROUP BY bucket
    ORDER BY bucket
    `,
    {
      replacements: {
        startDate,
        endDate,
        roomId,
        bucketSeconds: DEDUP_BUCKET_SECONDS,
        maxGapSeconds: MAX_GAP_SECONDS,
        maxPlausibleWatts: MAX_PLAUSIBLE_WATTS,
      },
      type: QueryTypes.SELECT,
    }
  );

  return rows.map((r) => {
    const totalKwh = Number(r.total_kwh || 0);
    return {
      bucket: r.bucket,
      total_kwh: totalKwh,
      total_wh: toWh(totalKwh),
    };
  });
}

/**
 * Data pembacaan sudah di-dedup + latest_read_at
 */
export async function computeDedupedReadings(sequelize, roomId = null) {
  const roomFilter = roomId ? 'AND room_id = :roomId' : '';

  const [readings, latest] = await Promise.all([
    sequelize.query(
      `
      SELECT
        room_id,
        to_timestamp(floor(extract(epoch FROM read_at) / :bucketSeconds) * :bucketSeconds) AS read_at,
        AVG(power_watts) AS power_watts
      FROM power_sensors
      WHERE power_watts IS NOT NULL
      ${roomFilter}
      GROUP BY room_id, floor(extract(epoch FROM read_at) / :bucketSeconds)
      ORDER BY read_at DESC
      `,
      {
        replacements: { roomId, bucketSeconds: DEDUP_BUCKET_SECONDS },
        type: QueryTypes.SELECT,
      }
    ),
    sequelize.query(
      `SELECT MAX(read_at) AS latest_read_at 
       FROM power_sensors 
       WHERE power_watts IS NOT NULL ${roomFilter}`,
      { replacements: { roomId }, type: QueryTypes.SELECT }
    ),
  ]);

  return {
    readings: readings.map((r) => ({
      room_id: r.room_id,
      read_at: r.read_at,
      power_watts: Number(r.power_watts),
    })),
    latestReadAt: latest[0]?.latest_read_at || null,
  };
}