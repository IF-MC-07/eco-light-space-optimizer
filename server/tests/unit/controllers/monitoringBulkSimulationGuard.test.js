import { jest } from '@jest/globals';
import db from '../../../app/models/index.js';
import mqttService from '../../../app/services/mqttService.js';
import * as monitoringController from '../../../app/controllers/monitoring.controller.js';
import { clearGuardCache } from '../../../app/utils/simulationGuard.js';

describe('Monitoring Controller Bulk Mutation Simulation Guards (Tahap S1)', () => {
  let publishSpy;
  let updateLcSpy;
  let updateAcSpy;

  beforeEach(() => {
    clearGuardCache();
    jest.clearAllMocks();
    publishSpy = jest.spyOn(mqttService, 'publish').mockReturnValue(true);

    // Mock db.sequelize.query so isSimulatedRoom returns true for ROM-s* and false for others
    jest.spyOn(db.sequelize, 'query').mockImplementation(async (sql, options) => {
      const roomId = options?.replacements?.roomId;
      if (roomId && roomId.startsWith('ROM-s')) {
        return [{ is_simulated: true }];
      }
      return [{ is_simulated: false }];
    });

    // Mock existing LightControl and AcControl dataset:
    // Light controls:
    // - LC-01 in Room ROM-001 (real)
    // - LC-02 in Room ROM-s01 (simulated)
    jest.spyOn(db.LightControl, 'findAll').mockImplementation(async (opts) => {
      return [
        { control_id: 'LC-01', Zone: { room_id: 'ROM-001' } },
        { control_id: 'LC-02', Zone: { room_id: 'ROM-s01' } },
      ];
    });

    // Ac controls:
    // - AC-01 in Room ROM-001 (real)
    // - AC-02 in Room ROM-s01 (simulated)
    jest.spyOn(db.AcControl, 'findAll').mockImplementation(async (opts) => {
      return [
        { ac_control_id: 'AC-01', room_id: 'ROM-001' },
        { ac_control_id: 'AC-02', room_id: 'ROM-s01' },
      ];
    });

    updateLcSpy = jest.spyOn(db.LightControl, 'update').mockResolvedValue([1]);
    updateAcSpy = jest.spyOn(db.AcControl, 'update').mockResolvedValue([1]);
  });

  afterAll(() => {
    clearGuardCache();
  });

  describe('1. postMasterControl with kill_all', () => {
    it('affects ONLY real rooms, leaves simulated rooms untouched, includes note, and does not publish MQTT', async () => {
      const req = { body: { action: 'kill_all' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await monitoringController.postMasterControl(req, res, next);

      // LightControl update must only target real control LC-01, excluding simulated LC-02
      expect(updateLcSpy).toHaveBeenCalledTimes(1);
      const lcCall = updateLcSpy.mock.calls[0];
      expect(lcCall[0]).toEqual({ light_status: 'off' });
      const lcIds = lcCall[1]?.where?.control_id?.[db.Sequelize.Op.in];
      expect(lcIds).toContain('LC-01');
      expect(lcIds).not.toContain('LC-02');

      // AcControl update must only target real control AC-01, excluding simulated AC-02
      expect(updateAcSpy).toHaveBeenCalledTimes(1);
      const acCall = updateAcSpy.mock.calls[0];
      expect(acCall[0]).toEqual({ ac_status: 'off' });
      const acIds = acCall[1]?.where?.ac_control_id?.[db.Sequelize.Op.in];
      expect(acIds).toContain('AC-01');
      expect(acIds).not.toContain('AC-02');

      // No MQTT publish
      expect(publishSpy).not.toHaveBeenCalled();

      // Response contains field note warning that physical device was not commanded
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          note: expect.stringContaining('tidak dikirim ke perangkat'),
        }),
      }));
    });
  });

  describe('2. postMasterControl with eco_pulse', () => {
    it('affects ONLY real rooms (setting 25°C), leaves simulated rooms untouched, includes note, and does not publish MQTT', async () => {
      const req = { body: { action: 'eco_pulse' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await monitoringController.postMasterControl(req, res, next);

      // AcControl update must only target real control AC-01
      expect(updateAcSpy).toHaveBeenCalledTimes(1);
      const acCall = updateAcSpy.mock.calls[0];
      expect(acCall[0]).toEqual({ temperature_setting: 25.0, ac_status: 'on' });
      const acIds = acCall[1]?.where?.ac_control_id?.[db.Sequelize.Op.in];
      expect(acIds).toContain('AC-01');
      expect(acIds).not.toContain('AC-02');

      // LightControl is not affected by eco_pulse
      expect(updateLcSpy).not.toHaveBeenCalled();

      // No MQTT publish
      expect(publishSpy).not.toHaveBeenCalled();

      // Response contains note
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          note: expect.stringContaining('tidak dikirim ke perangkat'),
        }),
      }));
    });
  });

  describe('3. postMasterControl with unknown action', () => {
    it('returns status 400 for unknown action and does not perform updates', async () => {
      const req = { body: { action: 'super_turbo_blast' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await monitoringController.postMasterControl(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Invalid master control action',
      }));
      expect(updateLcSpy).not.toHaveBeenCalled();
      expect(updateAcSpy).not.toHaveBeenCalled();
      expect(publishSpy).not.toHaveBeenCalled();
    });
  });

  describe('4. updateClimate (PUT /climate)', () => {
    it('updates temperature for real rooms only, leaves simulated rooms untouched, includes note, and does not publish MQTT', async () => {
      const req = { body: { target_temperature: 22.5 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await monitoringController.updateClimate(req, res, next);

      expect(updateAcSpy).toHaveBeenCalledTimes(1);
      const acCall = updateAcSpy.mock.calls[0];
      expect(acCall[0]).toEqual({ temperature_setting: 22.5 });
      const acIds = acCall[1]?.where?.ac_control_id?.[db.Sequelize.Op.in];
      expect(acIds).toContain('AC-01');
      expect(acIds).not.toContain('AC-02');

      expect(publishSpy).not.toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          note: expect.stringContaining('tidak dikirim ke perangkat'),
        }),
      }));
    });
  });
});
