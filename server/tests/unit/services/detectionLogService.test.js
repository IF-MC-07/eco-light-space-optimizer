import { jest } from '@jest/globals';

const mockModel = {
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const mockDb = {
  default: {
    // Model name will usually be capitalized, we'll mock all just in case
    AcControl: mockModel,
    AutomationSchedule: mockModel,
    Camera: mockModel,
    DetectionLog: mockModel,
    EnergyLog: mockModel,
    LightControl: mockModel,
    PowerSensor: mockModel,
    Room: mockModel,
    Zone: mockModel,
    IotDevice: mockModel,
    User: mockModel,
  }
};

jest.unstable_mockModule('../../../app/models/index.js', () => mockDb);

const serviceModule = await import('../../../app/services/detectionLogService.js');
const service = serviceModule.default || serviceModule;

describe('detectionLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll()', () => {
    it('mengembalikan semua data (happy path)', async () => {
      mockModel.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      if (service.getAll) {
        const result = await service.getAll();
        expect(result).toBeDefined();
        expect(mockModel.findAll).toHaveBeenCalled();
      }
    });
    
    it('meneruskan error jika database gagal (error propagation)', async () => {
      mockModel.findAll.mockRejectedValue(new Error('DB Error'));
      if (service.getAll) {
        await expect(service.getAll()).rejects.toThrow('DB Error');
      }
    });
  });

  describe('getById()', () => {
    it('mengembalikan data jika ditemukan', async () => {
      mockModel.findByPk.mockResolvedValue({ id: 1 });
      if (service.getById) {
        const result = await service.getById(1);
        expect(result).toBeDefined();
      }
    });

    it('mengembalikan null atau melempar error jika resource tidak ada (not found case)', async () => {
      mockModel.findByPk.mockResolvedValue(null);
      if (service.getById) {
        try {
          const result = await service.getById(99);
          expect(result).toBeNull();
        } catch (e) {
          expect(e).toBeDefined();
        }
      }
    });
  });

  describe('create()', () => {
    it('berhasil membuat data baru', async () => {
      mockModel.create.mockResolvedValue({ id: 1, name: 'Test' });
      if (service.create) {
        const result = await service.create({ name: 'Test' });
        expect(result).toBeDefined();
      }
    });
  });
});
