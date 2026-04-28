import db from '../models/index.js';

const { Zona } = db;

export const getAll = async () => {
  return await Zona.findAll();
};

export const getById = async (id) => {
  return await Zona.findByPk(id);
};

export const create = async (data) => {
  return await Zona.create(data);
};

export const update = async (id, data) => {
  const zona = await Zona.findByPk(id);
  if (!zona) return null;
  return await zona.update(data);
};

export const getZonaByKamera = async (idKamera) => {
  const kamera = await db.Kamera.findByPk(idKamera);
  if (!kamera || !kamera.id_ruangan) return [];
  
  return await Zona.findAll({
    where: { 
      id_ruangan: kamera.id_ruangan,
      status_zona: 'aktif'
    },
    order: [['urutan', 'ASC']]
  });
};

export const upsertZona = async (zonaList) => {
  // If list is empty, nothing to do
  if (!zonaList || zonaList.length === 0) return;
  
  // They all belong to the same camera, get id_ruangan
  const idKamera = zonaList[0].id_kamera;
  const kamera = await db.Kamera.findByPk(idKamera);
  if (!kamera || !kamera.id_ruangan) throw new Error('Camera or room not found');
  
  const idRuangan = kamera.id_ruangan;

  // Process inside a transaction
  await db.sequelize.transaction(async (t) => {
    for (let i = 0; i < zonaList.length; i++) {
      const z = zonaList[i];
      const payload = {
        id_ruangan: idRuangan,
        nama_zona: z.nama_zona,
        x1_pct: z.x1_pct,
        y1_pct: z.y1_pct,
        x2_pct: z.x2_pct,
        y2_pct: z.y2_pct,
        warna: z.warna,
        urutan: i + 1,
        status_zona: 'aktif',
        diperbarui_pada: new Date()
      };

      if (z.id_zona) {
        await Zona.update(payload, { where: { id_zona: z.id_zona }, transaction: t });
      } else {
        await Zona.create(payload, { transaction: t });
      }
    }
  });
};

export const deleteZona = async (idZona) => {
  const zona = await Zona.findByPk(idZona);
  if (!zona) return null;
  await zona.update({ status_zona: 'nonaktif' });
  return true;
};
