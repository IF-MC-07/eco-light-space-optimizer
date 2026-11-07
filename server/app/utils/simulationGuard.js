import db from '../models/index.js';

const cache = new Map();
const lastWarnTime = new Map();

export const getGuardTtlMs = () => {
  const sec = Number(process.env.DSLB_GUARD_CACHE_SECONDS);
  return (!isNaN(sec) && sec >= 0 ? sec : 30) * 1000;
};

export const clearGuardCache = () => {
  cache.clear();
  lastWarnTime.clear();
};

const logWarningRateLimited = (key, message, minIntervalMs = 60000) => {
  const now = Date.now();
  const last = lastWarnTime.get(key) || 0;
  if (now - last >= minIntervalMs) {
    lastWarnTime.set(key, now);
    console.warn(`[DSLB Guard] ${message}`);
  }
};

/**
 * Checks whether a room is simulated.
 * Returns true if simulated, false if physical or on error/unknown room.
 *
 * @param {string} roomId
 * @returns {Promise<boolean>}
 */
export const isSimulatedRoom = async (roomId) => {
  if (!roomId) return false;

  const now = Date.now();
  const cached = cache.get(roomId);
  if (cached && now < cached.expiresAt) {
    return cached.isSimulated;
  }

  try {
    const query = 'SELECT is_simulated FROM rooms WHERE room_id = :roomId LIMIT 1';
    const rows = await db.sequelize.query(query, {
      replacements: { roomId },
      type: db.sequelize.QueryTypes.SELECT
    });

    if (!rows || rows.length === 0) {
      logWarningRateLimited(roomId, `Room '${roomId}' not found; treating as non-simulated.`);
      const val = false;
      cache.set(roomId, { isSimulated: val, expiresAt: now + getGuardTtlMs() });
      return val;
    }

    const val = Boolean(rows[0].is_simulated);
    cache.set(roomId, { isSimulated: val, expiresAt: now + getGuardTtlMs() });
    return val;
  } catch (error) {
    logWarningRateLimited(roomId, `DB error checking simulation status for '${roomId}': ${error.message}`);
    return false;
  }
};

export default {
  isSimulatedRoom,
  clearGuardCache,
  getGuardTtlMs
};

