import responseFormatter from '../utils/response.js';
import * as occupancyService from '../services/occupancyService.js';

/**
 * Mendapatkan daftar occupancy untuk semua ruangan aktif.
 *
 * Perilaku default query parameter simulasi:
 * - Default (tanpa query param atau include_simulated=true):
 *   Semua ruangan aktif (ruangan fisik dan ruangan simulasi) disertakan dalam respon.
 *   Ruangan hasil simulasi ditandai secara eksplisit dengan atribut `is_simulated: true`.
 * - ?include_simulated=false:
 *   Hanya ruangan fisik (`is_simulated = false`) yang dikembalikan.
 * - ?only_simulated=true:
 *   Hanya ruangan hasil simulasi (`is_simulated = true`) yang dikembalikan.
 */
export const getAll = async (req, res, next) => {
  try {
    let filterSimulated = null;
    if (req.query.include_simulated === 'false') {
      filterSimulated = false;
    } else if (req.query.only_simulated === 'true') {
      filterSimulated = true;
    }

    const data = await occupancyService.getAllRoomOccupancy(filterSimulated);
    return responseFormatter.success(res, data, 'Room occupancy retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Mendapatkan data occupancy untuk satu ruangan berdasarkan room_id.
 * Mengembalikan HTTP 404 jika ruangan tidak ditemukan.
 */
export const getById = async (req, res, next) => {
  try {
    const data = await occupancyService.getRoomOccupancyById(req.params.id);
    if (!data) {
      return responseFormatter.error(res, `Room with ID '${req.params.id}' not found`, 404);
    }
    return responseFormatter.success(res, data, 'Room occupancy retrieved successfully');
  } catch (error) {
    next(error);
  }
};
