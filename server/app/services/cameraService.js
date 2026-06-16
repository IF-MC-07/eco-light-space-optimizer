import db from "../models/index.js";
import { encryptCameraUrl, generateCameraHash } from "../utils/cameraCrypto.js";

const { Camera } = db;

export const getAllRaw = async () => {
  return await Camera.findAll();
};

export const getAll = async (roomId) => {
  const whereClause = {};

  if (roomId) {
    whereClause.room_id = roomId;
  }

  const cameras = await Camera.findAll({
    where: whereClause,
  });

  return cameras.map(cam => {
    const data = cam.toJSON();
    delete data.ip_address;
    return data;
  });
};

export const getById = async (id) => {
  const camera = await Camera.findByPk(id);
  if (!camera) return null;
  const data = camera.toJSON();
  delete data.ip_address;
  return data;
};

export const create = async (data) => {
  if (data.ip_address) {
     data.ip_address = encryptCameraUrl(data.ip_address);
  }
  const newCamera = await Camera.create(data);
  
  if (newCamera.ip_address) {
     newCamera.camera_hash = generateCameraHash(newCamera.camera_id, newCamera.ip_address);
     await newCamera.save();
  }

  const returnData = newCamera.toJSON();
  delete returnData.ip_address;
  return returnData;
};

export const update = async (id, data) => {
  const camera = await Camera.findByPk(id);
  if (!camera) return null;

  if (data.ip_address) {
     data.ip_address = encryptCameraUrl(data.ip_address);
     data.camera_hash = generateCameraHash(camera.camera_id, data.ip_address);
  }

  await camera.update(data);
  
  const returnData = camera.toJSON();
  delete returnData.ip_address;
  return returnData;
};

export const remove = async (id) => {
  const camera = await Camera.findByPk(id);
  if (!camera) return null;
  await camera.destroy();
  return true;
};
