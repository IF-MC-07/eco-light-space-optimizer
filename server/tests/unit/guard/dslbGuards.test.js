import { jest } from '@jest/globals';
import db from '../../../app/models/index.js';
import mqttService from '../../../app/services/mqttService.js';
import * as lightControlService from '../../../app/services/lightControlService.js';
import * as acControlService from '../../../app/services/acControlService.js';
import automationScheduler from '../../../app/services/automationScheduler.js';
import automationService from '../../../app/services/automationService.js';
import * as monitoringController from '../../../app/controllers/monitoring.controller.js';
import { clearGuardCache } from '../../../app/utils/simulationGuard.js';

describe('DSLB Simulation Guards (Node.js)', () => {
  let publishSpy;

  beforeEach(() => {
    clearGuardCache();
    jest.clearAllMocks();
    publishSpy = jest.spyOn(mqttService, 'publish').mockReturnValue(true);

    // Mock db.sequelize.query so isSimulatedRoom behaves according to room_id
    jest.spyOn(db.sequelize, 'query').mockImplementation(async (sql, options) => {
      const roomId = options?.replacements?.roomId;
      if (roomId && roomId.startsWith('ROM-s')) {
        return [{ is_simulated: true }];
      }
      return [{ is_simulated: false }];
    });
  });

  afterAll(() => {
    clearGuardCache();
  });

  // ── N1 & N2: lightControlService.update ─────────────────────────────────────
  describe('N1 & N2: lightControlService.update', () => {
    it('simulated room: does NOT update light_controls and does NOT publish to kelas/control or ESP32', async () => {
      const mockControl = {
        control_id: 1,
        device_id: 'DEV-01',
        relay_channel: 1,
        IotDevice: { room_id: 'ROM-s01' },
        Zone: null,
        update: jest.fn(),
      };
      jest.spyOn(db.LightControl, 'findByPk').mockResolvedValue(mockControl);

      const result = await lightControlService.update(1, { light_status: 'on' });

      expect(mockControl.update).not.toHaveBeenCalled();
      expect(publishSpy).not.toHaveBeenCalled();
      expect(result).toBe(mockControl);
    });

    it('physical room: updates light_controls and publishes to kelas/control and ESP32', async () => {
      const mockControl = {
        control_id: 2,
        device_id: 'DEV-02',
        relay_channel: 2,
        zone_id: 10,
        IotDevice: { room_id: 'ROM-002' },
        Zone: { room_id: 'ROM-002', zone_name: 'Zone A' },
        update: jest.fn().mockImplementation(async (d) => ({ ...mockControl, ...d })),
      };
      jest.spyOn(db.LightControl, 'findByPk').mockResolvedValue(mockControl);

      await lightControlService.update(2, { light_status: 'on' });

      expect(mockControl.update).toHaveBeenCalledWith({ light_status: 'on' });
      expect(publishSpy).toHaveBeenCalledTimes(2);
      // First publish: kelas/control
      expect(publishSpy).toHaveBeenNthCalledWith(1, expect.any(String), expect.objectContaining({
        device_id: 'DEV-02',
        relay_channel: 2,
        action: 'ON',
      }));
      // Second publish: direct ESP32
      expect(publishSpy).toHaveBeenNthCalledWith(2, 'devices/ROM-002/light/2', expect.objectContaining({
        command: 'ON',
        relay_channel: 2,
      }));
    });
  });

  // ── N3: acControlService.update ─────────────────────────────────────────────
  describe('N3: acControlService.update', () => {
    it('simulated room: does NOT update ac_controls and does NOT publish', async () => {
      const mockControl = {
        ac_control_id: 1,
        room_id: 'ROM-s01',
        update: jest.fn(),
      };
      jest.spyOn(db.AcControl, 'findByPk').mockResolvedValue(mockControl);

      const result = await acControlService.update(1, { ac_status: 'on', temperature_setting: 22 });

      expect(mockControl.update).not.toHaveBeenCalled();
      expect(publishSpy).not.toHaveBeenCalled();
      expect(result).toBe(mockControl);
    });

    it('physical room: updates ac_controls and publishes to devices/{room_id}/ac', async () => {
      const mockControl = {
        ac_control_id: 2,
        room_id: 'ROM-002',
        update: jest.fn().mockImplementation(async (d) => ({ ...mockControl, ...d })),
      };
      jest.spyOn(db.AcControl, 'findByPk').mockResolvedValue(mockControl);

      await acControlService.update(2, { ac_status: 'on', temperature_setting: 22 });

      expect(mockControl.update).toHaveBeenCalledWith({ ac_status: 'on', temperature_setting: 22 });
      expect(publishSpy).toHaveBeenCalledTimes(1);
      expect(publishSpy).toHaveBeenCalledWith('devices/ROM-002/ac', expect.objectContaining({
        command: 'ON',
        room_id: 'ROM-002',
        temperature: 22,
      }));
    });
  });

  // ── N4 & N5: automationScheduler.turnOn & turnOff ───────────────────────────
  describe('N4 & N5: automationScheduler', () => {
    it('simulated room: turnOn does NOT update controls and does NOT publish', async () => {
      jest.spyOn(db.AutomationSchedule, 'findByPk').mockResolvedValue({ schedule_id: 1, room_id: 'ROM-s01' });
      const zoneFindSpy = jest.spyOn(db.Zone, 'findAll');

      await automationScheduler.turnOn(1);

      expect(zoneFindSpy).not.toHaveBeenCalled();
      expect(publishSpy).not.toHaveBeenCalled();
    });

    it('simulated room: turnOff does NOT update controls and does NOT publish', async () => {
      jest.spyOn(db.AutomationSchedule, 'findByPk').mockResolvedValue({ schedule_id: 1, room_id: 'ROM-s01' });
      const zoneFindSpy = jest.spyOn(db.Zone, 'findAll');

      await automationScheduler.turnOff(1);

      expect(zoneFindSpy).not.toHaveBeenCalled();
      expect(publishSpy).not.toHaveBeenCalled();
    });

    it('physical room: turnOn updates controls and publishes', async () => {
      const mockControl = { relay_channel: 1, zone_id: 10, update: jest.fn() };
      jest.spyOn(db.AutomationSchedule, 'findByPk').mockResolvedValue({ schedule_id: 2, room_id: 'ROM-002' });
      jest.spyOn(db.Zone, 'findAll').mockResolvedValue([{ zone_id: 10 }]);
      jest.spyOn(db.LightControl, 'findAll').mockResolvedValue([mockControl]);

      await automationScheduler.turnOn(2);

      expect(mockControl.update).toHaveBeenCalledWith(expect.objectContaining({ light_status: 'on' }));
      expect(publishSpy).toHaveBeenCalledWith('devices/ROM-002/light/1', expect.objectContaining({
        command: 'ON',
      }));
    });
  });

  // ── N6 & N7: automationService.triggerLightAction ───────────────────────────
  describe('N6 & N7: automationService.triggerLightAction', () => {
    it('simulated room: does NOT update light_controls and does NOT publish to kelas/control or ESP32', async () => {
      jest.spyOn(db.Zone, 'findByPk').mockResolvedValue({ zone_id: 10, room_id: 'ROM-s01' });
      const controlsSpy = jest.spyOn(db.LightControl, 'findAll');

      await automationService.triggerLightAction(10, 'ON');

      expect(controlsSpy).not.toHaveBeenCalled();
      expect(publishSpy).not.toHaveBeenCalled();
    });

    it('physical room: updates light_controls and publishes to kelas/control and ESP32', async () => {
      const mockControl = {
        device_id: 'DEV-01',
        relay_channel: 1,
        light_status: 'off',
        update: jest.fn(),
      };
      // First Zone.findByPk for guard
      // Second Zone.findByPk for roomId resolution
      jest.spyOn(db.Zone, 'findByPk')
        .mockResolvedValueOnce({ zone_id: 10, room_id: 'ROM-001' })
        .mockResolvedValueOnce({ zone_id: 10, Room: { room_id: 'ROM-001' } });
      jest.spyOn(db.LightControl, 'findAll').mockResolvedValue([mockControl]);

      // Bypass debounce
      automationService.lastActionTime.delete(10);
      await automationService.triggerLightAction(10, 'ON');

      expect(mockControl.update).toHaveBeenCalledWith(expect.objectContaining({ light_status: 'on' }));
      expect(publishSpy).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        action: 'ON',
        zone_id: 10,
      }));
      expect(publishSpy).toHaveBeenCalledWith('devices/ROM-001/light/1', expect.objectContaining({
        command: 'ON',
        zone_id: 10,
      }));
    });
  });

  // ── N8, N9, N10, N11: monitoring.controller.updateDevice ────────────────────
  describe('N8-N11: monitoringController.updateDevice', () => {
    it('simulated room: returns early without modifying controls or publishing', async () => {
      const mockDevice = {
        device_id: 'DEV-01',
        room_id: 'ROM-s01',
        save: jest.fn(),
      };
      jest.spyOn(db.IotDevice, 'findByPk').mockResolvedValue(mockDevice);
      const lcFindSpy = jest.spyOn(db.LightControl, 'findAll');

      const req = {
        params: { id: 'DEV-01' },
        body: { device_status: 'aktif', light_status: 'on', ac_status: 'on' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await monitoringController.updateDevice(req, res, next);

      expect(mockDevice.save).not.toHaveBeenCalled();
      expect(lcFindSpy).not.toHaveBeenCalled();
      expect(publishSpy).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
      }));
    });

    it('physical room: executes device save, control updates, and publishes', async () => {
      const mockDevice = {
        device_id: 'DEV-02',
        room_id: 'ROM-002',
        save: jest.fn(),
      };
      const mockLc = {
        device_id: 'DEV-02',
        relay_channel: 1,
        zone_id: 1,
        Zone: { room_id: 'ROM-002', zone_name: 'Zone 1' },
        update: jest.fn(),
      };
      jest.spyOn(db.IotDevice, 'findByPk').mockResolvedValue(mockDevice);
      jest.spyOn(db.LightControl, 'findAll').mockResolvedValue([mockLc]);
      jest.spyOn(db.AcControl, 'findAll').mockResolvedValue([]);

      const req = {
        params: { id: 'DEV-02' },
        body: { light_status: 'on' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await monitoringController.updateDevice(req, res, next);

      expect(mockLc.update).toHaveBeenCalledWith(expect.objectContaining({ light_status: 'on' }));
      expect(publishSpy).toHaveBeenCalled();
    });
  });

  // ── postMasterControl Isolation Proof ───────────────────────────────────────
  describe('postMasterControl isolation proof (Requirement 3)', () => {
    it('proves postMasterControl only runs bulk updates without MQTT publish, and simulated rooms have no control rows', async () => {
      const updateLcSpy = jest.spyOn(db.LightControl, 'update').mockResolvedValue([2]);
      const updateAcSpy = jest.spyOn(db.AcControl, 'update').mockResolvedValue([1]);

      const req = { body: { action: 'kill_all' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await monitoringController.postMasterControl(req, res, next);

      // Verify bulk update was called
      expect(updateLcSpy).toHaveBeenCalledWith({ light_status: 'off' }, { where: {} });
      expect(updateAcSpy).toHaveBeenCalledWith({ ac_status: 'off' }, { where: {} });

      // Verify postMasterControl does NOT publish any MQTT message
      expect(publishSpy).not.toHaveBeenCalled();

      // Verify response
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'All devices powered off',
      }));
    });
  });
});
