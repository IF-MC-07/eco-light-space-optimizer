import { beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_1234567890';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret_key_1234567890';

const mockDb = {
  Holiday: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Sequelize: {
    Op: {
      and: Symbol('and'),
      ne: Symbol('ne'),
    },
    fn: jest.fn((fnName, ...args) => ({ fn: fnName, args })),
    literal: jest.fn((str) => str),
    where: jest.fn((lhs, rhs) => ({ lhs, rhs })),
  },
  User: {
    findByPk: jest.fn(),
  },
  sequelize: {
    query: jest.fn(),
  },
};

jest.unstable_mockModule('../../../app/models/index.js', () => ({
  default: mockDb,
  sequelize: mockDb.sequelize,
}));

const { authenticate } = await import('../../../app/middlewares/auth.middleware.js');
const { requireRole } = await import('../../../app/middlewares/role.middleware.js');
const holidayController = await import('../../../app/controllers/holiday.controller.js');

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

describe('Holiday Controller - API, Validation & RBAC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Authentication Middleware', () => {
    it('mengembalikan 401 saat request tidak memiliki token', async () => {
      const req = { headers: {}, cookies: {} };
      const res = createMockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('2. Role-Based Access Control (RBAC)', () => {
    it('mengizinkan peran "mahasiswa" dan "admin" pada GET /api/holidays', () => {
      const middleware = requireRole(['admin', 'mahasiswa']);
      const reqMahasiswa = { user: { role: 'mahasiswa' } };
      const reqAdmin = { user: { role: 'admin' } };
      const res = createMockRes();
      const next1 = jest.fn();
      const next2 = jest.fn();

      middleware(reqMahasiswa, res, next1);
      middleware(reqAdmin, res, next2);

      expect(next1).toHaveBeenCalled();
      expect(next2).toHaveBeenCalled();
    });

    it('menolak peran "mahasiswa" pada POST /api/holidays dengan 403', () => {
      const middleware = requireRole(['admin']);
      const req = { user: { role: 'mahasiswa' } };
      const res = createMockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('menolak peran "mahasiswa" pada PUT /api/holidays/:id dengan 403', () => {
      const middleware = requireRole(['admin']);
      const req = { user: { role: 'mahasiswa' } };
      const res = createMockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('menolak peran "mahasiswa" pada DELETE /api/holidays/:id dengan 403', () => {
      const middleware = requireRole(['admin']);
      const req = { user: { role: 'mahasiswa' } };
      const res = createMockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('mengizinkan peran "admin" pada aksi mutasi (POST, PUT, DELETE)', () => {
      const middleware = requireRole(['admin']);
      const req = { user: { role: 'admin' } };
      const res = createMockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('3. Validasi & Operasi Controller', () => {
    it('menolak POST jika format holiday_date salah (harus YYYY-MM-DD)', async () => {
      const req = {
        body: {
          holiday_date: '01-01-2027', // format salah
          name: 'Tahun Baru',
          type: 'nasional',
        },
      };
      const res = createMockRes();
      const next = jest.fn();

      await holidayController.create(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/YYYY-MM-DD/);
      expect(mockDb.Holiday.create).not.toHaveBeenCalled();
    });

    it('menolak POST jika name kosong', async () => {
      const req = {
        body: {
          holiday_date: '2027-01-01',
          name: '',
          type: 'nasional',
        },
      };
      const res = createMockRes();
      const next = jest.fn();

      await holidayController.create(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(mockDb.Holiday.create).not.toHaveBeenCalled();
    });

    it('menolak POST jika type di luar nasional, cuti_bersama, atau kampus', async () => {
      const req = {
        body: {
          holiday_date: '2027-01-01',
          name: 'Tahun Baru',
          type: 'internasional', // invalid type
        },
      };
      const res = createMockRes();
      const next = jest.fn();

      await holidayController.create(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(mockDb.Holiday.create).not.toHaveBeenCalled();
    });

    it('berhasil membuat libur baru pada data valid (POST 201)', async () => {
      mockDb.Holiday.findOne.mockResolvedValueOnce(null); // tidak ada duplikat
      mockDb.Holiday.create.mockResolvedValueOnce({
        holiday_id: 'HLD-test1',
        holiday_date: '2027-01-01',
        name: 'Tahun Baru 2027',
        type: 'nasional',
        suspend_rules: true,
        source_ref: 'SKB 3 Menteri',
        toJSON: () => ({
          holiday_id: 'HLD-test1',
          holiday_date: '2027-01-01',
          name: 'Tahun Baru 2027',
          type: 'nasional',
          suspend_rules: true,
          source_ref: 'SKB 3 Menteri',
        }),
      });

      const req = {
        body: {
          holiday_date: '2027-01-01',
          name: 'Tahun Baru 2027',
          type: 'nasional',
          suspend_rules: true,
          source_ref: 'SKB 3 Menteri',
        },
      };
      const res = createMockRes();
      const next = jest.fn();

      await holidayController.create(req, res, next);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Tahun Baru 2027');
      expect(res.body.data.holiday_name).toBe('Tahun Baru 2027');
      expect(res.body.data.is_national_holiday).toBe(true);
    });

    it('menolak POST duplikat tanggal dan nama yang sama dengan 409', async () => {
      mockDb.Holiday.findOne.mockResolvedValueOnce({ holiday_id: 'HLD-exist' }); // sudah ada

      const req = {
        body: {
          holiday_date: '2027-01-01',
          name: 'Tahun Baru 2027',
          type: 'nasional',
        },
      };
      const res = createMockRes();
      const next = jest.fn();

      await holidayController.create(req, res, next);

      expect(res.statusCode).toBe(409);
      expect(mockDb.Holiday.create).not.toHaveBeenCalled();
    });

    it('mengembalikan 404 pada PUT jika holiday_id tidak ditemukan', async () => {
      mockDb.Holiday.findByPk.mockResolvedValueOnce(null);

      const req = {
        params: { id: 'HLD-nonexistent' },
        body: { name: 'Nama Baru' },
      };
      const res = createMockRes();
      const next = jest.fn();

      await holidayController.update(req, res, next);

      expect(res.statusCode).toBe(404);
    });

    it('mengembalikan 404 pada DELETE jika holiday_id tidak ditemukan', async () => {
      mockDb.Holiday.findByPk.mockResolvedValueOnce(null);

      const req = { params: { id: 'HLD-nonexistent' } };
      const res = createMockRes();
      const next = jest.fn();

      await holidayController.remove(req, res, next);

      expect(res.statusCode).toBe(404);
    });

    it('berhasil menghapus libur pada DELETE 200', async () => {
      const mockDestroy = jest.fn();
      mockDb.Holiday.findByPk.mockResolvedValueOnce({
        holiday_id: 'HLD-del',
        destroy: mockDestroy,
      });

      const req = { params: { id: 'HLD-del' } };
      const res = createMockRes();
      const next = jest.fn();

      await holidayController.remove(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });

    it('GET /api/holidays mengembalikan daftar libur dengan alias kompatibilitas', async () => {
      mockDb.Holiday.findAll.mockResolvedValueOnce([
        {
          holiday_id: 'HLD-1',
          holiday_date: '2027-01-01',
          name: 'Tahun Baru',
          type: 'nasional',
          suspend_rules: true,
          toJSON: () => ({
            holiday_id: 'HLD-1',
            holiday_date: '2027-01-01',
            name: 'Tahun Baru',
            type: 'nasional',
            suspend_rules: true,
          }),
        },
      ]);

      const req = { query: { year: '2027' } };
      const res = createMockRes();
      const next = jest.fn();

      await holidayController.getAll(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].holiday_name).toBe('Tahun Baru');
      expect(res.body.data[0].is_national_holiday).toBe(true);
    });
  });
});
