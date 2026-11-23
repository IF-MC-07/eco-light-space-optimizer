import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockHoliday = {
  findOne: jest.fn(),
};

const mockAutomationSchedule = {
  findAll: jest.fn(),
  findByPk: jest.fn(),
};

const mockZone = {
  findAll: jest.fn(),
};

const mockLightControl = {
  findAll: jest.fn(),
};

const mockDb = {
  Holiday: mockHoliday,
  AutomationSchedule: mockAutomationSchedule,
  Zone: mockZone,
  LightControl: mockLightControl,
};

const mockMqttService = {
  publish: jest.fn(),
};

const mockSimulationGuard = {
  isSimulatedRoom: jest.fn().mockResolvedValue(false),
};

jest.unstable_mockModule('../../../app/models/index.js', () => ({
  default: mockDb,
}));

jest.unstable_mockModule('../../../app/services/mqttService.js', () => ({
  default: mockMqttService,
}));

jest.unstable_mockModule('../../../app/utils/simulationGuard.js', () => mockSimulationGuard);

// Dynamic import
const { AutomationScheduler, getJakartaDateStr } = await import(
  '../../../app/services/automationScheduler.js'
);

describe('AutomationScheduler - Holiday Suspension (TAHAP 5)', () => {
  let scheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    scheduler = new AutomationScheduler();
  });

  describe('getJakartaDateStr() and timezone boundary', () => {
    it('converts UTC time to Asia/Jakarta date string at 23:30 WIB', () => {
      // 23:30 WIB on 2027-01-01 corresponds to 16:30 UTC on 2027-01-01
      const dateUtc = new Date('2027-01-01T16:30:00Z');
      expect(getJakartaDateStr(dateUtc)).toBe('2027-01-01');
    });

    it('correctly formats non-holiday date at 23:30 WIB', () => {
      // 23:30 WIB on 2027-01-04 corresponds to 16:30 UTC on 2027-01-04
      const dateUtc = new Date('2027-01-04T16:30:00Z');
      expect(getJakartaDateStr(dateUtc)).toBe('2027-01-04');
    });

    it('handles day boundary transition around midnight WIB', () => {
      // 16:59:59 UTC = 23:59:59 WIB on 2027-01-01
      const justBeforeMidnight = new Date('2027-01-01T16:59:59Z');
      expect(getJakartaDateStr(justBeforeMidnight)).toBe('2027-01-01');

      // 17:00:00 UTC = 00:00:00 WIB on 2027-01-02
      const justMidnight = new Date('2027-01-01T17:00:00Z');
      expect(getJakartaDateStr(justMidnight)).toBe('2027-01-02');
    });
  });

  describe('isHolidayToday() caching and lookup', () => {
    it('returns isHoliday=false on a non-holiday weekday', async () => {
      mockHoliday.findOne.mockResolvedValue(null);

      const fixedDate = new Date('2027-01-04T08:00:00+07:00'); // Senin, bukan libur
      const result = await scheduler.isHolidayToday(fixedDate);

      expect(result.isHoliday).toBe(false);
      expect(result.dateStr).toBe('2027-01-04');
      expect(mockHoliday.findOne).toHaveBeenCalledWith({
        where: {
          holiday_date: '2027-01-04',
          suspend_rules: true,
        },
      });
    });

    it('returns isHoliday=true on a holiday with suspend_rules=true', async () => {
      mockHoliday.findOne.mockResolvedValue({
        holiday_id: 1,
        holiday_date: '2027-01-01',
        name: 'Tahun Baru 2027 Masehi',
        suspend_rules: true,
      });

      const fixedDate = new Date('2027-01-01T08:00:00+07:00'); // Libur
      const result = await scheduler.isHolidayToday(fixedDate);

      expect(result.isHoliday).toBe(true);
      expect(result.holidayName).toBe('Tahun Baru 2027 Masehi');
      expect(result.dateStr).toBe('2027-01-01');
    });

    it('caches the holiday check for 60 seconds (TTL=60s) and refreshes after TTL', async () => {
      mockHoliday.findOne.mockResolvedValue({
        holiday_id: 1,
        holiday_date: '2027-01-01',
        name: 'Tahun Baru 2027 Masehi',
        suspend_rules: true,
      });

      const fixedDate1 = new Date('2027-01-01T08:00:00+07:00');
      const fixedDate2 = new Date(fixedDate1.getTime() + 30000); // +30s (within 60s TTL)
      const fixedDate3 = new Date(fixedDate1.getTime() + 61000); // +61s (expired TTL)

      await scheduler.isHolidayToday(fixedDate1);
      await scheduler.isHolidayToday(fixedDate2);
      expect(mockHoliday.findOne).toHaveBeenCalledTimes(1);

      await scheduler.isHolidayToday(fixedDate3);
      expect(mockHoliday.findOne).toHaveBeenCalledTimes(2);
    });

    it('fails open if holidays query fails, with warning rate-limited to 1 per hour', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockHoliday.findOne.mockRejectedValue(new Error('relation "holidays" does not exist'));

      const fixedDate1 = new Date('2027-01-01T08:00:00+07:00');
      const result1 = await scheduler.isHolidayToday(fixedDate1);

      // Fail-open: isHoliday must be false
      expect(result1.isHoliday).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AutomationScheduler] Error checking holidays table (failing open):'),
        expect.stringContaining('relation "holidays" does not exist')
      );

      // After 30s: still in error, but within 1-hour rate limit -> no extra warn
      const fixedDate2 = new Date(fixedDate1.getTime() + 30000);
      scheduler.holidayCache = { dateStr: null, isHoliday: false, holidayName: null, loadedAt: 0 }; // force reload attempt
      const result2 = await scheduler.isHolidayToday(fixedDate2);
      expect(result2.isHoliday).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(1);

      // After 1 hour (3601 seconds): warning is logged again
      const fixedDate3 = new Date(fixedDate1.getTime() + 3601000);
      scheduler.holidayCache = { dateStr: null, isHoliday: false, holidayName: null, loadedAt: 0 };
      const result3 = await scheduler.isHolidayToday(fixedDate3);
      expect(result3.isHoliday).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(2);

      warnSpy.mockRestore();
    });
  });

  describe('checkAndTrigger() holiday suspension (TAHAP 5B)', () => {
    it('skips Turn-ON trigger on a holiday with suspend_rules=true, but executes Turn-OFF trigger', async () => {
      mockHoliday.findOne.mockResolvedValue({
        holiday_id: 1,
        holiday_date: '2027-01-01',
        name: 'Tahun Baru',
        suspend_rules: true,
      });

      mockAutomationSchedule.findAll.mockResolvedValue([
        {
          schedule_id: 99,
          room_id: 10,
          start_time: '08:00:00',
          end_time: '17:00:00',
        },
      ]);

      mockAutomationSchedule.findByPk.mockResolvedValue({
        schedule_id: 99,
        room_id: 10,
      });

      mockZone.findAll.mockResolvedValue([
        { zone_id: 101, room_id: 10 },
      ]);

      const mockControl = {
        zone_id: 101,
        relay_channel: 1,
        update: jest.fn().mockResolvedValue(true),
      };
      mockLightControl.findAll.mockResolvedValue([mockControl]);

      // 1. Current time = 08:00 WIB (Turn-ON time)
      const onTime = new Date('2027-01-01T08:00:00+07:00');
      await scheduler.checkAndTrigger(true, onTime);

      // ON should be SKIPPED on holiday
      expect(mockControl.update).not.toHaveBeenCalled();
      expect(mockMqttService.publish).not.toHaveBeenCalled();

      // 2. Current time = 17:00 WIB (Turn-OFF time)
      const offTime = new Date('2027-01-01T17:00:00+07:00');
      await scheduler.checkAndTrigger(true, offTime);

      // OFF should EXECUTE even on holiday
      expect(mockControl.update).toHaveBeenCalledWith(
        expect.objectContaining({ light_status: 'off' })
      );
      expect(mockMqttService.publish).toHaveBeenCalledWith(
        'devices/10/light/1',
        expect.objectContaining({ command: 'OFF', source: 'schedule_automation' })
      );
    });

    it('fails open and triggers ON when holidays query throws DB error', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockHoliday.findOne.mockRejectedValue(new Error('DB connection refused'));

      mockAutomationSchedule.findAll.mockResolvedValue([
        {
          schedule_id: 99,
          room_id: 10,
          start_time: '08:00:00',
          end_time: '17:00:00',
        },
      ]);

      mockAutomationSchedule.findByPk.mockResolvedValue({
        schedule_id: 99,
        room_id: 10,
      });

      mockZone.findAll.mockResolvedValue([
        { zone_id: 101, room_id: 10 },
      ]);

      const mockControl = {
        zone_id: 101,
        relay_channel: 1,
        update: jest.fn().mockResolvedValue(true),
      };
      mockLightControl.findAll.mockResolvedValue([mockControl]);

      const onTime = new Date('2027-01-01T08:00:00+07:00');
      // When failing open, turn-ON must NOT be suspended
      await scheduler.checkAndTrigger(true, onTime);

      expect(mockControl.update).toHaveBeenCalledWith(
        expect.objectContaining({ light_status: 'on' })
      );
      expect(mockMqttService.publish).toHaveBeenCalledWith(
        'devices/10/light/1',
        expect.objectContaining({ command: 'ON', source: 'schedule_automation' })
      );
    });

    it('proceeds and executes triggers on a non-holiday at 23:30 WIB', async () => {
      mockHoliday.findOne.mockResolvedValue(null);
      mockAutomationSchedule.findAll.mockResolvedValue([]);

      // 23:30 WIB on regular Monday 2027-01-04
      const boundaryDate = new Date('2027-01-04T16:30:00Z');
      await scheduler.checkAndTrigger(false, boundaryDate);

      // On non-holiday, findAll is called to process active schedules
      expect(mockAutomationSchedule.findAll).toHaveBeenCalledTimes(1);
    });

    it('proceeds and triggers lights on a normal non-holiday workday', async () => {
      mockHoliday.findOne.mockResolvedValue(null);

      // Schedule at 08:00
      const now = new Date();
      now.setHours(8, 0, 0, 0);

      mockAutomationSchedule.findAll.mockResolvedValue([
        {
          schedule_id: 99,
          room_id: 10,
          start_time: '08:00:00',
          end_time: '17:00:00',
        },
      ]);

      mockAutomationSchedule.findByPk.mockResolvedValue({
        schedule_id: 99,
        room_id: 10,
      });

      mockZone.findAll.mockResolvedValue([
        { zone_id: 101, room_id: 10 },
      ]);

      const mockControl = {
        zone_id: 101,
        relay_channel: 1,
        update: jest.fn().mockResolvedValue(true),
      };
      mockLightControl.findAll.mockResolvedValue([mockControl]);

      await scheduler.checkAndTrigger(true, now);

      expect(mockAutomationSchedule.findAll).toHaveBeenCalledTimes(1);
      expect(mockControl.update).toHaveBeenCalledWith(
        expect.objectContaining({ light_status: 'on' })
      );
      expect(mockMqttService.publish).toHaveBeenCalledWith(
        'devices/10/light/1',
        expect.objectContaining({ command: 'ON', source: 'schedule_automation' })
      );
    });
  });
});
