import { jest } from '@jest/globals';

// Use fake timers to test setTimeout
jest.useFakeTimers();

// 1. Mock DB
const mockLightControl = {
  findAll: jest.fn(),
};

const mockDb = {
  default: {
    LightControl: mockLightControl,
    IotDevice: {}
  }
};

// 2. Mock MQTT
const mockMqttService = {
  default: {
    publish: jest.fn(),
  }
};

// 3. Register mocks
jest.unstable_mockModule('../../../app/models/index.js', () => mockDb);
jest.unstable_mockModule('../../../app/services/mqttService.js', () => mockMqttService);

// 4. Import dynamic
const automationServiceModule = await import('../../../app/services/automationService.js');
const automationService = automationServiceModule.default;

describe('Automation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    automationService.timers.clear();
    automationService.lastActionTime.clear();
  });

  describe('handleDetection()', () => {
    it('mengabaikan log jika tidak ada zone_id', async () => {
      await automationService.handleDetection({ zone_id: null, occupancy_count: 5 });
      expect(mockLightControl.findAll).not.toHaveBeenCalled();
    });

    it('menghidupkan lampu dan membatalkan timer jika occupancy > 0', async () => {
      const mockControl = {
        light_status: 'off',
        device_id: 1,
        relay_channel: 1,
        update: jest.fn().mockResolvedValue(true)
      };
      mockLightControl.findAll.mockResolvedValue([mockControl]);

      // Simulasi ada timer yang berjalan
      automationService.timers.set(10, setTimeout(() => {}, 1000));

      await automationService.handleDetection({ zone_id: 10, occupancy_count: 2 });

      // Timer harus dihapus
      expect(automationService.timers.has(10)).toBeFalsy();
      
      // DB harus diupdate ke on
      expect(mockControl.update).toHaveBeenCalledWith(expect.objectContaining({ light_status: 'on' }));
      
      // MQTT harus dipublish
      expect(mockMqttService.default.publish).toHaveBeenCalledWith(
        automationService.config.controlTopic,
        { device_id: 1, relay_channel: 1, action: 'ON' }
      );
    });

    it('membuat timer untuk mematikan lampu jika occupancy == 0', async () => {
      await automationService.handleDetection({ zone_id: 11, occupancy_count: 0 });

      // Timer harus diset
      expect(automationService.timers.has(11)).toBeTruthy();

      // Lampu belum dimatikan saat timer baru diset
      expect(mockLightControl.findAll).not.toHaveBeenCalled();

      // Setup mock data untuk ketika timer habis
      const mockControl = {
        light_status: 'on',
        device_id: 1,
        relay_channel: 1,
        update: jest.fn().mockResolvedValue(true)
      };
      mockLightControl.findAll.mockResolvedValue([mockControl]);

      // Majukan waktu melewati timeout (default 5 mins)
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000);

      // Kita butuh await tambahan karena isi setTimeout adalah async function
      await Promise.resolve();
      await Promise.resolve();

      expect(mockControl.update).toHaveBeenCalledWith(expect.objectContaining({ light_status: 'off' }));
      expect(mockMqttService.default.publish).toHaveBeenCalledWith(
        automationService.config.controlTopic,
        { device_id: 1, relay_channel: 1, action: 'OFF' }
      );
    });
  });

  describe('Debounce Logic', () => {
    it('mencegah eksekusi berulang dalam waktu singkat (debounce)', async () => {
      const mockControl = {
        light_status: 'off',
        device_id: 1,
        relay_channel: 1,
        update: jest.fn().mockResolvedValue(true)
      };
      mockLightControl.findAll.mockResolvedValue([mockControl]);

      // Eksekusi pertama
      await automationService._triggerLightAction(20, 'ON');
      expect(mockControl.update).toHaveBeenCalledTimes(1);

      // Eksekusi kedua secara instan (akan kena debounce)
      await automationService._triggerLightAction(20, 'ON');
      expect(mockControl.update).toHaveBeenCalledTimes(1); // Tetap 1

      // Majukan waktu di atas debounceTime (3000ms)
      jest.setSystemTime(jest.getRealSystemTime() + 4000);
      
      // Update mock control status supaya bisa trigger lagi
      mockControl.light_status = 'off';

      await automationService._triggerLightAction(20, 'ON');
      expect(mockControl.update).toHaveBeenCalledTimes(2);
    });
  });
});
