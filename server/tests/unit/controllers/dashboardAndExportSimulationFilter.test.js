import { jest } from '@jest/globals';
import db from '../../../app/models/index.js';
import * as dashboardController from '../../../app/controllers/dashboard.controller.js';
import * as exportController from '../../../app/controllers/exportController.js';

describe('B5: Filter Simulated Rooms in Dashboard and Export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dashboard.getSummary counts only physical rooms (where is_simulated: false)', async () => {
    const roomCountSpy = jest.spyOn(db.Room, 'count').mockResolvedValue(5);
    jest.spyOn(db.Zone, 'count').mockResolvedValue(10);
    jest.spyOn(db.IotDevice, 'count').mockResolvedValue(10);
    jest.spyOn(db.Camera, 'count').mockResolvedValue(5);
    jest.spyOn(db.PowerSensor, 'findAll').mockResolvedValue([]);
    jest.spyOn(db.EnergyLog, 'findAll').mockResolvedValue([]);
    jest.spyOn(db.LightControl, 'count').mockResolvedValue(10);
    jest.spyOn(db.AcControl, 'count').mockResolvedValue(5);
    jest.spyOn(db.AcControl, 'findOne').mockResolvedValue({ avg_temp: 24.0 });

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await dashboardController.getSummary(req, res, next);

    expect(roomCountSpy).toHaveBeenCalledWith({
      where: { is_simulated: false }
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        total_rooms: 5,
      }),
    }));
  });

  it('exportController.exportGeneric for rooms queries only physical rooms (where is_simulated: false)', async () => {
    const roomFindSpy = jest.spyOn(db.Room, 'findAll').mockResolvedValue([
      { room_id: 'ROM-001', room_name: 'Lab 1', floor: '1', capacity: 30 }
    ]);

    const req = {
      params: { resource: 'rooms', format: 'csv' }
    };
    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
    };
    const next = jest.fn();

    await exportController.exportGeneric(req, res, next);

    expect(roomFindSpy).toHaveBeenCalledWith({
      where: { is_simulated: false }
    });
  });
});

