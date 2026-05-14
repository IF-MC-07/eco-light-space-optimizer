import db from '../models/index.js';
import mqttService from './mqttService.js';

const { LightControl, IotDevice } = db;

/**
 * Automation and Decision Engine
 * Implements logic for energy-efficient lighting based on occupancy and conditions.
 */
class AutomationService {
  constructor() {
    this.timers = new Map(); // Store timeout timers for zones
    this.debounceTime = 3000; // 3 seconds debounce protection
    this.lastActionTime = new Map(); // Store last action time per zone
    
    // Configurable thresholds
    this.config = {
      occupancyTimeoutMs: (parseInt(process.env.OCCUPANCY_TIMEOUT_MINS) || 5) * 60 * 1000,
      controlTopic: process.env.MQTT_TOPIC_CONTROL || 'kelas/control'
    };
  }

  /**
   * Main entry point called when a new detection log is recorded.
   * @param {Object} log - The DetectionLog instance
   */
  async handleDetection(log) {
    const { zone_id, occupancy_count } = log;
    
    if (!zone_id) return;

    console.log(`[Automation] Processing Zone ${zone_id}: Occupancy ${occupancy_count}`);

    // Rule 1: IF occupancy detected → light ON
    if (occupancy_count > 0) {
      await this._clearTimeout(zone_id);
      await this._triggerLightAction(zone_id, 'ON');
    } 
    // Rule 2: IF occupancy == 0 → Start timer for light OFF
    else {
      await this._scheduleTimeout(zone_id);
    }
  }

  /**
   * Schedule a light-off command if occupancy remains 0.
   */
  async _scheduleTimeout(zone_id) {
    if (this.timers.has(zone_id)) return; // Timer already running

    console.log(`[Automation] Zone ${zone_id} is empty. Scheduling OFF in ${this.config.occupancyTimeoutMs / 60000} mins.`);
    
    const timerId = setTimeout(async () => {
      console.log(`[Automation] Timeout for Zone ${zone_id}. Turning light OFF.`);
      await this._triggerLightAction(zone_id, 'OFF');
      this.timers.delete(zone_id);
    }, this.config.occupancyTimeoutMs);

    this.timers.set(zone_id, timerId);
  }

  /**
   * Clear any existing light-off timers for a zone.
   */
  async _clearTimeout(zone_id) {
    if (this.timers.has(zone_id)) {
      clearTimeout(this.timers.get(zone_id));
      this.timers.delete(zone_id);
      console.log(`[Automation] Occupancy in Zone ${zone_id}. OFF timer cleared.`);
    }
  }

  /**
   * Execute light control action: update DB and publish MQTT.
   */
  async _triggerLightAction(zone_id, status) {
    try {
      // Debounce protection
      const now = Date.now();
      const lastAction = this.lastActionTime.get(zone_id) || 0;
      if (now - lastAction < this.debounceTime) {
        return; 
      }

      // Find relevant light control devices for this zone
      const controls = await LightControl.findAll({
        where: { zone_id },
        include: [{ model: IotDevice }]
      });

      if (controls.length === 0) {
        return;
      }

      for (const control of controls) {
        // Skip if status is already correct
        if (control.light_status.toUpperCase() === status.toUpperCase()) continue;

        // 1. Update Database
        await control.update({
          light_status: status.toLowerCase(),
          updated_at: new Date()
        });

        // 2. Publish MQTT Command
        // Standardized format: { "device_id": 1, "relay": 1, "action": "ON" }
        const payload = {
          device_id: control.device_id,
          relay_channel: control.relay_channel,
          action: status.toUpperCase()
        };

        mqttService.publish(this.config.controlTopic, payload);
      }

      this.lastActionTime.set(zone_id, now);
      console.log(`[Automation] Action ${status} applied to Zone ${zone_id}`);
    } catch (error) {
      console.error(`[Automation] Action Error for Zone ${zone_id}:`, error);
    }
  }
}

export default new AutomationService();
