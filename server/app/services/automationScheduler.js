import db from '../models/index.js';
import mqttService from './mqttService.js';
import { isSimulatedRoom } from '../utils/simulationGuard.js';

class AutomationScheduler {
  constructor() {
    this.timer = null;
    this.checkEveryMs = 15000;
    this.lastTriggered = new Set();
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

  async checkAndTrigger(force = false) {
    const now = new Date();
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
          await this.turnOn(schedule.schedule_id);
        }
      }

      if (now >= endAt && now < new Date(endAt.getTime() + this.checkEveryMs)) {
        if (force || !this.lastTriggered.has(endKey)) {
          this.lastTriggered.add(endKey);
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
