import { beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_1234567890';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret_key_1234567890';

const mockRoomService = {
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn()
};

const mockOccupancyService = {
  getAllRoomOccupancy: jest.fn(),
  getRoomOccupancyById: jest.fn()
};

const mockDb = {
  User: {
    findByPk: jest.fn()
  },
  Room: {
    findByPk: jest.fn(),
    create: jest.fn()
  },
  Zone: { findAll: jest.fn() },
  DetectionLog: { findAll: jest.fn() },
  IotDevice: { findAll: jest.fn() },
  sequelize: {
    query: jest.fn(),
    QueryTypes: { SELECT: 'SELECT' }
  }
};

jest.unstable_mockModule('../../../app/models/index.js', () => ({
  default: mockDb,
  sequelize: mockDb.sequelize
}));

jest.unstable_mockModule('../../../app/services/roomService.js', () => mockRoomService);
jest.unstable_mockModule('../../../app/services/occupancyService.js', () => mockOccupancyService);

const { authenticate } = await import('../../../app/middlewares/auth.middleware.js');
const { requireRole } = await import('../../../app/middlewares/role.middleware.js');
const roomController = await import('../../../app/controllers/roomController.js');
const occupancyController = await import('../../../app/controllers/occupancyController.js');

const createMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn().mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((data) => {
    res.body = data;
    return res;
  });
  return res;
};

describe('DSLB Auth, RBAC, and Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Middleware', () => {
    it('returns 401 when request has no token in headers or cookies', async () => {
      const req = { headers: {}, cookies: {} };
      const res = createMockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('allows role "mahasiswa" on GET /api/occupancy (allowedRoles: ["admin", "mahasiswa"])', () => {
      const middleware = requireRole(['admin', 'mahasiswa']);
      const req = { user: { role: 'mahasiswa', name: 'Student' } };
      const res = createMockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects role "mahasiswa" on POST /api/rooms (requireRole(["admin"])) with 403', () => {
      const middleware = requireRole(['admin']);
      const req = { user: { role: 'mahasiswa', name: 'Student' } };
      const res = createMockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body).toEqual({
        success: false,
        message: 'Access denied'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects role "mahasiswa" on PUT /api/rooms/:id (requireRole(["admin"])) with 403', () => {
      const middleware = requireRole(['admin']);
      const req = { user: { role: 'mahasiswa', name: 'Student' } };
      const res = createMockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.body).toEqual({
        success: false,
        message: 'Access denied'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('allows role "admin" on POST and PUT /api/rooms', () => {
      const middleware = requireRole(['admin']);
      const req = { user: { role: 'admin', name: 'Administrator' } };
      const res = createMockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Capacity Validation in Room Controller', () => {
    it('rejects POST /api/rooms with capacity 0 (returns 400)', async () => {
      const req = {
        body: {
          room_name: 'Room 101',
          capacity: 0
        }
      };
      const res = createMockRes();
      const next = jest.fn();

      await roomController.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockRoomService.create).not.toHaveBeenCalled();
    });

    it('rejects POST /api/rooms with negative capacity (returns 400)', async () => {
      const req = {
        body: {
          room_name: 'Room 102',
          capacity: -10
        }
      };
      const res = createMockRes();
      const next = jest.fn();

      await roomController.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockRoomService.create).not.toHaveBeenCalled();
    });

    it('rejects PUT /api/rooms/:id with capacity 0 or negative (returns 400)', async () => {
      const reqZero = {
        params: { id: 'ROM-1' },
        body: { capacity: 0 }
      };
      const resZero = createMockRes();
      const nextZero = jest.fn();

      await roomController.update(reqZero, resZero, nextZero);
      expect(resZero.status).toHaveBeenCalledWith(400);

      const reqNeg = {
        params: { id: 'ROM-1' },
        body: { capacity: -5 }
      };
      const resNeg = createMockRes();
      const nextNeg = jest.fn();

      await roomController.update(reqNeg, resNeg, nextNeg);
      expect(resNeg.status).toHaveBeenCalledWith(400);
      expect(mockRoomService.update).not.toHaveBeenCalled();
    });
  });

  describe('is_simulated Protection via Controller', () => {
    it('strips is_simulated on POST /api/rooms so service never receives it', async () => {
      const req = {
        body: {
          room_name: 'Lab Hardware',
          capacity: 30,
          building: 'Gedung TI',
          floor: 2,
          is_simulated: true // Attempt to set is_simulated
        }
      };
      const res = createMockRes();
      const next = jest.fn();

      mockRoomService.create.mockResolvedValue({
        room_id: 'ROM-NEW',
        room_name: 'Lab Hardware',
        capacity: 30,
        building: 'Gedung TI',
        floor: '2',
        is_simulated: false
      });

      await roomController.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockRoomService.create).toHaveBeenCalledTimes(1);
      const passedToService = mockRoomService.create.mock.calls[0][0];
      expect(passedToService.is_simulated).toBeUndefined();
      expect(passedToService.floor).toBe('2');
    });

    it('strips is_simulated on PUT /api/rooms/:id so service never receives it', async () => {
      const req = {
        params: { id: 'ROM-1' },
        body: {
          capacity: 45,
          is_simulated: true // Attempt to set is_simulated
        }
      };
      const res = createMockRes();
      const next = jest.fn();

      mockRoomService.update.mockResolvedValue({
        room_id: 'ROM-1',
        capacity: 45,
        is_simulated: false
      });

      await roomController.update(req, res, next);

      expect(res.status).not.toHaveBeenCalledWith(400);
      expect(mockRoomService.update).toHaveBeenCalledTimes(1);
      const passedToService = mockRoomService.update.mock.calls[0][1];
      expect(passedToService.is_simulated).toBeUndefined();
    });
  });

  describe('Occupancy Controller 404 Not Found', () => {
    it('returns 404 with clear message when room_id does not exist', async () => {
      mockOccupancyService.getRoomOccupancyById.mockResolvedValue(null);

      const req = { params: { id: 'ROM-NONEXISTENT' } };
      const res = createMockRes();
      const next = jest.fn();

      await occupancyController.getById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body).toEqual({
        success: false,
        message: "Room with ID 'ROM-NONEXISTENT' not found"
      });
    });

    it('returns 200 with data when room_id exists', async () => {
      mockOccupancyService.getRoomOccupancyById.mockResolvedValue({
        room_id: 'ROM-1',
        room_name: 'Room 101',
        confirmed_status: 'Sedang'
      });

      const req = { params: { id: 'ROM-1' } };
      const res = createMockRes();
      const next = jest.fn();

      await occupancyController.getById(req, res, next);

      expect(res.status).not.toHaveBeenCalledWith(404);
      expect(res.body.success).toBe(true);
      expect(res.body.data.room_id).toBe('ROM-1');
    });
  });
});
