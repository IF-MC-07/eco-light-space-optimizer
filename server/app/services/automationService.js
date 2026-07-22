import db from '../models/index.js';
import mqttService from './mqttService.js';

const { LightControl, Zone } = db;

class AutomationService {
  constructor() {
    this.timers = new Map(); // zone_id => timeout
    this.debounceTime = 3000;
    this.lastActionTime = new Map();
    this.scheduledRooms = new Set(); // room_id yang sedang aktif jadwal

    this.config = {
      occupancyTimeoutMs: (parseInt(process.env.OCCUPANCY_TIMEOUT_MINS) || 5) * 60 * 1000,
      scheduledTimeoutMs: 2 * 60 * 1000,
      controlTopic: process.env.MQTT_TOPIC_CONTROL || 'kelas/control',
    };
  }

  activateScheduledMode(room_id) {
    if (!room_id) return;
    this.scheduledRooms.add(String(room_id));
  }

  deactivateScheduledMode(room_id) {
    if (!room_id) return;
    this.scheduledRooms.delete(String(room_id));
  }

  isScheduled(room_id) {
    if (!room_id) return false;
    return this.scheduledRooms.has(String(room_id));
  }

  async handleDetection(log) {
    const { zone_id, occupancy_count } = log;
    if (!zone_id) return;

    const zone = await db.Zone.findByPk(zone_id, {
      include: [{ model: db.Room, as: 'Room' }],
    });

    const room_id = zone?.Room?.room_id;
    const inSchedule = this.isScheduled(room_id);

    if (occupancy_count > 0) {
      await this.clearTimeout(zone_id);
      await this.triggerLightAction(zone_id, 'ON');
      return;
    }

    const timeoutMs = inSchedule ? this.config.scheduledTimeoutMs : this.config.occupancyTimeoutMs;
    await this.scheduleTimeout(zone_id, timeoutMs);
  }

  async scheduleTimeout(zone_id, timeoutMs) {
    if (this.timers.has(zone_id)) return;

    const timerId = setTimeout(async () => {
      try {
        await this.triggerLightAction(zone_id, 'OFF');
      } finally {
        this.timers.delete(zone_id);
      }
    }, timeoutMs);

    this.timers.set(zone_id, timerId);
  }

  async clearTimeout(zone_id) {
    if (!this.timers.has(zone_id)) return;
    clearTimeout(this.timers.get(zone_id));
    this.timers.delete(zone_id);
  }

  async triggerLightAction(zone_id, status) {
    try {
      const now = Date.now();
      const lastAction = this.lastActionTime.get(zone_id) || 0;
      if (now - lastAction < this.debounceTime) return;

      const controls = await LightControl.findAll({
        include: [
          {
            model: Zone,
            where: { zone_id },
          },
        ],
      });

      if (!controls.length) return;

      for (const control of controls) {
        const current = String(control.light_status || '').toUpperCase();
        if (current === status.toUpperCase()) continue;

        await control.update({
          light_status: status.toLowerCase(),
          updated_at: new Date(),
        });

        await mqttService.publish(this.config.controlTopic, {
          device_id: control.device_id,
          relay_channel: control.relay_channel,
          action: status.toUpperCase(),
          source: 'automation',
          zone_id,
        });
      }

      this.lastActionTime.set(zone_id, now);
    } catch (error) {
      console.error('[AutomationService] triggerLightAction error:', error);
    }
  }
}

export default new AutomationService();