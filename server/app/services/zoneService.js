import db from '../models/index.js';

const { Zone } = db;

export const getAll = async () => {
  return await Zone.findAll();
};

export const getById = async (id) => {
  return await Zone.findByPk(id);
};

export const create = async (data) => {
  return await Zone.create(data);
};

export const update = async (id, data) => {
  const zone = await Zone.findByPk(id);
  if (!zone) return null;
  return await zone.update(data);
};

export const getZoneByCamera = async (cameraId) => {
  const camera = await db.Camera.findByPk(cameraId);
  if (!camera || !camera.room_id) return [];
  
  return await Zone.findAll({
    where: { 
      room_id: camera.room_id,
      zone_status: 'aktif'
    },
    order: [['sort_order', 'ASC']]
  });
};

export const upsertZone = async (zoneList) => {
  // If list is empty, nothing to do
  if (!zoneList || zoneList.length === 0) return;
  
  // They all belong to the same camera, get room_id
  const cameraId = zoneList[0].camera_id;
  const camera = await db.Camera.findByPk(cameraId);
  if (!camera || !camera.room_id) throw new Error('Camera or room not found');
  
  const roomId = camera.room_id;

  // Process inside a transaction
  await db.sequelize.transaction(async (t) => {
    for (let i = 0; i < zoneList.length; i++) {
      const z = zoneList[i];
      const payload = {
        room_id: roomId,
        zone_name: z.zone_name,
        x1_pct: z.x1_pct,
        y1_pct: z.y1_pct,
        x2_pct: z.x2_pct,
        y2_pct: z.y2_pct,
        color: z.color,
        sort_order: i + 1,
        zone_status: 'aktif',
        updated_at: new Date()
      };

      if (z.zone_id) {
        await Zone.update(payload, { where: { zone_id: z.zone_id }, transaction: t });
      } else {
        await Zone.create(payload, { transaction: t });
      }
    }
  });
};

export const deleteZone = async (zoneId) => {
  const zone = await Zone.findByPk(zoneId);
  if (!zone) return null;
  await zone.update({ zone_status: 'nonaktif' });
  return true;
};
