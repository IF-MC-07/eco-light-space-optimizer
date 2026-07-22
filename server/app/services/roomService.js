import db from '../models/index.js';

const { Room } = db;

export const getRoomAvailability = async (roomId) => {
  try {
    const query = `
      SELECT DISTINCT ON (COALESCE(dl.zone_id, dl.camera_id, 'default')) 
             dl.occupancy_count, dl.zone_status, dl.detection_time
      FROM detection_logs dl
      LEFT JOIN zones z ON dl.zone_id = z.zone_id
      LEFT JOIN cameras c ON dl.camera_id = c.camera_id
      WHERE (z.room_id = :roomId OR c.room_id = :roomId)
        AND dl.detection_time >= (NOW() - INTERVAL '15 minutes')
      ORDER BY COALESCE(dl.zone_id, dl.camera_id, 'default'), dl.detection_time DESC
    `;
    const logs = await db.sequelize.query(query, {
      replacements: { roomId },
      type: db.sequelize.QueryTypes.SELECT
    });

    if (!logs || logs.length === 0) {
      return 'available';
    }

    const isOccupied = logs.some(
      (log) => (Number(log.occupancy_count) > 0) || (log.zone_status && log.zone_status.toLowerCase() === 'occupied')
    );

    return isOccupied ? 'occupied' : 'available';
  } catch (error) {
    console.error(`Error calculating availability for room ${roomId}:`, error);
    return 'available';
  }
};

export const getAll = async () => {
  const rooms = await Room.findAll();
  return await Promise.all(
    rooms.map(async (r) => {
      const roomObj = r.toJSON ? r.toJSON() : r;
      const availability = await getRoomAvailability(roomObj.room_id);
      return {
        ...roomObj,
        availability,
      };
    })
  );
};

export const getById = async (id) => {
  const room = await Room.findByPk(id);
  if (!room) return null;
  const roomObj = room.toJSON ? room.toJSON() : room;
  const availability = await getRoomAvailability(id);
  return {
    ...roomObj,
    availability,
  };
};

export const create = async (data) => {
  return await Room.create(data);
};

export const update = async (id, data) => {
  const room = await Room.findByPk(id);
  if (!room) return null;
  return await room.update(data);
};

export const remove = async (id) => {
  const room = await Room.findByPk(id);
  if (!room) return null;
  await room.destroy();
  return true;
};
