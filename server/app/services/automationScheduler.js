import db from '../models/index.js';
import mqttService from './mqttService.js';

class AutomationScheduler {
  constructor() {
    this.started = false;
    this.interval = null;
    this.lastTriggered = new Set();
    this.checkEveryMs = 30000;
  }

  async start() {
    if (this.started) return;
    this.started = true;
    await this.tick();
    this.interval = setInterval(() => {
      this.tick().catch(console.error);
    }, this.checkEveryMs);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    this.started = false;
    this.lastTriggered.clear();
  }

  async reloadAll() {
    await this.tick(true);
  }

  parseTime(value) {
    if (!value) return null;
    const [h, m, s = '0'] = String(value).split(':').map(Number);
    if ([h, m, s].some(n => Number.isNaN(n))) return null;
    return { h, m, s };
  }

  buildDate(base, timeParts) {
    const d = new Date(base);
    d.setHours(timeParts.h, timeParts.m, timeParts.s, 0);
    return d;
  }

  async tick(force = false) {
    const schedules = await db.AutomationSchedule.findAll({ where: {} });
    const now = new Date();

    for (const schedule of schedules) {
      if (!schedule.room_id || !schedule.start_time || !schedule.end_time) continue;

      const startParts = this.parseTime(schedule.start_time);
      const endParts = this.parseTime(schedule.end_time);
      if (!startParts || !endParts) continue;

      const startAt = this.buildDate(now, startParts);
      const endAt = this.buildDate(now, endParts);

      const startKey = `${schedule.schedule_id}:ON:${startAt.toISOString().slice(0,16)}`;
      const endKey = `${schedule.schedule_id}:OFF:${endAt.toISOString().slice(0,16)}`;

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

    const zones = await db.Zone.findAll({ where: { room_id: schedule.room_id } });
    for (const zone of zones) {
      const controls = await db.LightControl.findAll({ where: { zone_id: zone.zone_id } });
      for (const control of controls) {
        await control.update({ light_status: 'on', updated_at: new Date() });
        mqttService.publish(`devices/${control.device_id}/relay/${control.relay_channel}`, { action: 'ON' });
      }
    }
  }

  async turnOff(scheduleId) {
    const schedule = await db.AutomationSchedule.findByPk(scheduleId);
    if (!schedule?.room_id) return;

    const zones = await db.Zone.findAll({ where: { room_id: schedule.room_id } });
    for (const zone of zones) {
      const controls = await db.LightControl.findAll({ where: { zone_id: zone.zone_id } });
      for (const control of controls) {
        await control.update({ light_status: 'off', updated_at: new Date() });
        mqttService.publish(`devices/${control.device_id}/relay/${control.relay_channel}`, { action: 'OFF' });
      }
    }
  }
}

export default new AutomationScheduler();