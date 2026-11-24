import db from '../models/index.js';
import mqttService from './mqttService.js';
import { isSimulatedRoom } from '../utils/simulationGuard.js';

export function getJakartaDateStr(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export class AutomationScheduler {
  constructor() {
    this.timer = null;
    this.checkEveryMs = 15000;
    this.lastTriggered = new Set();
    this.holidayCache = { dateStr: null, isHoliday: false, holidayName: null, loadedAt: 0 };
    this.lastHolidayErrorLogTime = null;
  }

  start() {
    if (this.timer) return;
    this.checkAndTrigger().catch((e) => console.error('[AutomationScheduler] initial error:', e));
    this.timer = setInterval(() => {
      this.checkAndTrigger().catch((e) => console.error('[AutomationScheduler] interval error:', e));
    }, this.checkEveryMs);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = String(timeStr).split(':').map((v) => parseInt(v, 10));
    return (h || 0) * 60 + (m || 0);
  }

  async isHolidayToday(now = new Date()) {
    const todayStr = getJakartaDateStr(now);
    const nowMs = now instanceof Date ? now.getTime() : Date.now();

    // Cache TTL 60 detik (kunci tanggal WIB dan loadedAt)
    if (
      this.holidayCache.dateStr === todayStr &&
      this.holidayCache.loadedAt &&
      (nowMs - this.holidayCache.loadedAt) < 60000 &&
      (nowMs - this.holidayCache.loadedAt) >= 0
    ) {
      return this.holidayCache;
    }

    try {
      if (db.Holiday?.findOne) {
        const holiday = await db.Holiday.findOne({
          where: {
            holiday_date: todayStr,
            suspend_rules: true,
          },
        });
        this.holidayCache = {
          dateStr: todayStr,
          isHoliday: Boolean(holiday),
          holidayName: holiday ? holiday.name : null,
          loadedAt: nowMs,
        };
      } else {
        this.holidayCache = { dateStr: todayStr, isHoliday: false, holidayName: null, loadedAt: nowMs };
      }
    } catch (err) {
      // Fail-open: rate-limit peringatan 1 kali per jam (3600000 ms)
      if (!this.lastHolidayErrorLogTime || (nowMs - this.lastHolidayErrorLogTime >= 3600000)) {
        console.warn(
          '[AutomationScheduler] Error checking holidays table (failing open):',
          err?.message || err
        );
        this.lastHolidayErrorLogTime = nowMs;
      }
      this.holidayCache = { dateStr: todayStr, isHoliday: false, holidayName: null, loadedAt: nowMs };
      return this.holidayCache;
    }

    return this.holidayCache;
  }

  async reloadAll() {
    this.holidayCache = { dateStr: null, isHoliday: false, holidayName: null, loadedAt: 0 };
    this.lastHolidayErrorLogTime = 0;
    this.lastTriggered.clear();
    return this.checkAndTrigger(true);
  }

  async checkAndTrigger(force = false, customNow = null) {
    const now = customNow || new Date();

    // Cek apakah hari ini (Asia/Jakarta) adalah hari libur dengan suspend_rules=true
    const holidayInfo = await this.isHolidayToday(now);

    const schedules = await db.AutomationSchedule.findAll();

    for (const schedule of schedules) {
      if (!schedule.start_time || !schedule.end_time) continue;

      const [sH, sM] = String(schedule.start_time).split(':').map((v) => parseInt(v, 10));
      const [eH, eM] = String(schedule.end_time).split(':').map((v) => parseInt(v, 10));

      const startAt = new Date(now);
      startAt.setHours(sH || 0, sM || 0, 0, 0);

      const endAt = new Date(now);
      endAt.setHours(eH || 0, eM || 0, 0, 0);

      const startKey = `${schedule.schedule_id}-ON-${startAt.toDateString()}-${startAt.getHours()}:${startAt.getMinutes()}`;
      const endKey = `${schedule.schedule_id}-OFF-${endAt.toDateString()}-${endAt.getHours()}:${endAt.getMinutes()}`;

      if (now >= startAt && now < new Date(startAt.getTime() + this.checkEveryMs)) {
        if (force || !this.lastTriggered.has(startKey)) {
          this.lastTriggered.add(startKey);
          if (holidayInfo.isHoliday) {
            console.info(
              `[AutomationScheduler] Skipping ON trigger for schedule ${schedule.schedule_id}: today (${holidayInfo.dateStr}) is holiday '${holidayInfo.holidayName}' with suspend_rules=true`
            );
          } else {
            await this.turnOn(schedule.schedule_id);
          }
        }
      }

      if (now >= endAt && now < new Date(endAt.getTime() + this.checkEveryMs)) {
        if (force || !this.lastTriggered.has(endKey)) {
          this.lastTriggered.add(endKey);
          // Turn-OFF selalu dieksekusi, termasuk pada hari libur
          await this.turnOff(schedule.schedule_id);
        }
      }

      if (this.lastTriggered.size > 5000) this.lastTriggered.clear();
    }
  }

  async turnOn(scheduleId) {
    const schedule = await db.AutomationSchedule.findByPk(scheduleId);
    if (!schedule?.room_id) return;

    if (await isSimulatedRoom(schedule.room_id)) {
      console.info(`[DSLB Guard] Skipping automationScheduler.turnOn for simulated room ${schedule.room_id}`);
      return;
    }

    const zones = await db.Zone.findAll({ where: { room_id: schedule.room_id } });
    for (const zone of zones) {
      const controls = await db.LightControl.findAll({ where: { zone_id: zone.zone_id } });
      for (const control of controls) {
        await control.update({ light_status: 'on', updated_at: new Date() });
        mqttService.publish(`devices/${schedule.room_id}/light/${control.relay_channel}`, {
          command: 'ON',
          zone_id: control.zone_id,
          relay_channel: control.relay_channel,
          source: 'schedule_automation'
        });
      }
    }
  }

  async turnOff(scheduleId) {
    const schedule = await db.AutomationSchedule.findByPk(scheduleId);
    if (!schedule?.room_id) return;

    if (await isSimulatedRoom(schedule.room_id)) {
      console.info(`[DSLB Guard] Skipping automationScheduler.turnOff for simulated room ${schedule.room_id}`);
      return;
    }

    const zones = await db.Zone.findAll({ where: { room_id: schedule.room_id } });
    for (const zone of zones) {
      const controls = await db.LightControl.findAll({ where: { zone_id: zone.zone_id } });
      for (const control of controls) {
        await control.update({ light_status: 'off', updated_at: new Date() });
        mqttService.publish(`devices/${schedule.room_id}/light/${control.relay_channel}`, {
          command: 'OFF',
          zone_id: control.zone_id,
          relay_channel: control.relay_channel,
          source: 'schedule_automation'
        });
      }
    }
  }
}

export default new AutomationScheduler();
