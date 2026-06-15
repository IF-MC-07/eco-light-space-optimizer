import responseFormatter from '../utils/response.js';
import * as cameraService from '../services/cameraService.js';
import { decryptCameraUrl } from '../utils/cameraCrypto.js';

export const getAiStreamUrls = async (req, res, next) => {
  try {
    const aiSecret = req.headers['x-ai-secret'];
    if (!aiSecret || aiSecret !== process.env.CAMERA_SECRET_KEY) {
      return responseFormatter.error(res, 'Forbidden: Invalid AI Secret', 403);
    }
    
    const cameras = await cameraService.getAllRaw();
    const activeCameras = cameras.filter(c => 
        (c.status === 'aktif' || c.status === 'active') && 
        c.ip_address && c.ip_address !== '0' && c.ip_address !== ''
    );
    
    const result = activeCameras.map(cam => {
      const decryptedUrl = decryptCameraUrl(cam.ip_address);
      return {
        camera_id: cam.camera_id,
        camera_hash: cam.camera_hash,
        ip_address: decryptedUrl
      };
    });
    
    return responseFormatter.success(res, result, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const { room_id } = req.query;
    const data = await cameraService.getAll(room_id);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await cameraService.getById(req.params.id);
    if (!data) return responseFormatter.error(res, 'Camera not found' , 404);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await cameraService.create(req.body);
    return responseFormatter.success(res, data, 'Created', 201);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await cameraService.update(req.params.id, req.body);
    if (!data) return responseFormatter.error(res, 'Camera not found' , 404);
    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const isDeleted = await cameraService.remove(req.params.id);
    if (!isDeleted) return responseFormatter.error(res, 'Camera not found' , 404);
    return responseFormatter.success(res, null, 'Camera deleted successfully' );
  } catch (error) {
    next(error);
  }
};
