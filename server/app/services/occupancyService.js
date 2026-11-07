import db from '../models/index.js';

const getStaleThresholdSeconds = () => {
  const envVal = Number(process.env.DSLB_STALE_SECONDS);
  return !isNaN(envVal) && envVal > 0 ? envVal : 60;
};

const formatOccupancyRow = (row) => {
  const isStale = Boolean(row.is_stale);
  const status = row.confirmed_status || 'Tidak tersedia';
  const isSpecialStatus = status === 'Tidak tersedia' || status === 'Kapasitas belum dikonfigurasi';

  let displayPct = null;
  if (!isSpecialStatus && row.occupancy_pct_raw !== null && row.occupancy_pct_raw !== undefined) {
    displayPct = Math.min(100, Math.floor(Number(row.occupancy_pct_raw) * 10) / 10);
  }

  return {
    room_id: row.room_id,
    room_name: row.room_name,
    location: row.location,
    building: row.building,
    floor: row.floor,
    is_simulated: Boolean(row.is_simulated),
    capacity: row.capacity !== null ? Number(row.capacity) : null,
    status: status,
    confirmed_status: status,
    candidate_status: row.candidate_status,
    candidate_count: row.candidate_count !== null ? Number(row.candidate_count) : 0,
    person_count: isSpecialStatus ? null : (row.person_count !== null ? Number(row.person_count) : null),
    available_seats: isSpecialStatus ? null : (row.available_seats !== null ? Number(row.available_seats) : null),
    occupancy_pct_raw: isSpecialStatus ? null : (row.occupancy_pct_raw !== null ? Number(row.occupancy_pct_raw) : null),
    occupancy_pct_display: displayPct,
    recommendations: isSpecialStatus ? [] : (Array.isArray(row.recommendations) ? row.recommendations : (typeof row.recommendations === 'string' ? JSON.parse(row.recommendations) : [])),
    is_stale: isStale,
    age_seconds: row.age_seconds !== null && row.age_seconds !== undefined ? Math.round(Number(row.age_seconds)) : null,
    updated_at: row.updated_at
  };
};

export const getAllRoomOccupancy = async (filterSimulated = null) => {
  const staleSeconds = getStaleThresholdSeconds();

  let query = `
    SELECT
      r.room_id,
      r.room_name,
      r.location,
      r.building,
      r.floor,
      r.is_simulated,
      r.capacity,
      r.status AS room_status,
      o.occ_id,
      o.candidate_status,
      o.candidate_count,
      o.occupancy_pct_raw,
      o.recommendations,
      o.updated_at,
      EXTRACT(EPOCH FROM (NOW() - o.updated_at)) AS age_seconds,
      CASE
        WHEN o.updated_at IS NULL THEN TRUE
        WHEN EXTRACT(EPOCH FROM (NOW() - o.updated_at)) > :staleSeconds THEN TRUE
        ELSE COALESCE(o.is_stale, FALSE)
      END AS is_stale,
      CASE
        WHEN o.updated_at IS NULL OR EXTRACT(EPOCH FROM (NOW() - o.updated_at)) > :staleSeconds THEN 'Tidak tersedia'
        WHEN r.capacity IS NULL OR r.capacity <= 0 THEN 'Kapasitas belum dikonfigurasi'
        ELSE o.confirmed_status
      END AS confirmed_status,
      CASE
        WHEN o.updated_at IS NULL OR EXTRACT(EPOCH FROM (NOW() - o.updated_at)) > :staleSeconds OR r.capacity IS NULL OR r.capacity <= 0 THEN NULL
        ELSE o.person_count
      END AS person_count,
      CASE
        WHEN o.updated_at IS NULL OR EXTRACT(EPOCH FROM (NOW() - o.updated_at)) > :staleSeconds OR r.capacity IS NULL OR r.capacity <= 0 THEN NULL
        ELSE o.available_seats
      END AS available_seats
    FROM rooms r
    LEFT JOIN room_occupancy_current o ON r.room_id = o.room_id
    WHERE r.status = 'ACTIVE'
  `;

  const replacements = { staleSeconds };

  if (filterSimulated !== null) {
    query += ` AND r.is_simulated = :filterSimulated`;
    replacements.filterSimulated = filterSimulated;
  }

  query += ` ORDER BY r.room_name ASC`;

  const rows = await db.sequelize.query(query, {
    replacements,
    type: db.sequelize.QueryTypes.SELECT
  });

  return rows.map(formatOccupancyRow);
};

export const getRoomOccupancyById = async (roomId) => {
  const staleSeconds = getStaleThresholdSeconds();

  const query = `
    SELECT
      r.room_id,
      r.room_name,
      r.location,
      r.building,
      r.floor,
      r.is_simulated,
      r.capacity,
      r.status AS room_status,
      o.occ_id,
      o.candidate_status,
      o.candidate_count,
      o.occupancy_pct_raw,
      o.recommendations,
      o.updated_at,
      EXTRACT(EPOCH FROM (NOW() - o.updated_at)) AS age_seconds,
      CASE
        WHEN o.updated_at IS NULL THEN TRUE
        WHEN EXTRACT(EPOCH FROM (NOW() - o.updated_at)) > :staleSeconds THEN TRUE
        ELSE COALESCE(o.is_stale, FALSE)
      END AS is_stale,
      CASE
        WHEN o.updated_at IS NULL OR EXTRACT(EPOCH FROM (NOW() - o.updated_at)) > :staleSeconds THEN 'Tidak tersedia'
        WHEN r.capacity IS NULL OR r.capacity <= 0 THEN 'Kapasitas belum dikonfigurasi'
        ELSE o.confirmed_status
      END AS confirmed_status,
      CASE
        WHEN o.updated_at IS NULL OR EXTRACT(EPOCH FROM (NOW() - o.updated_at)) > :staleSeconds OR r.capacity IS NULL OR r.capacity <= 0 THEN NULL
        ELSE o.person_count
      END AS person_count,
      CASE
        WHEN o.updated_at IS NULL OR EXTRACT(EPOCH FROM (NOW() - o.updated_at)) > :staleSeconds OR r.capacity IS NULL OR r.capacity <= 0 THEN NULL
        ELSE o.available_seats
      END AS available_seats
    FROM rooms r
    LEFT JOIN room_occupancy_current o ON r.room_id = o.room_id
    WHERE r.room_id = :roomId
  `;

  const rows = await db.sequelize.query(query, {
    replacements: { roomId, staleSeconds },
    type: db.sequelize.QueryTypes.SELECT
  });

  if (!rows || rows.length === 0) {
    return null;
  }

  return formatOccupancyRow(rows[0]);
};

