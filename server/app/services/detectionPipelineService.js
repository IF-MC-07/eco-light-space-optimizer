import db from '../models/index.js';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
import automationService from './automationService.js';

const { DetectionLog, Zone } = db;

/**
 * Detection Pipeline Service
 * Handles processing and persistence of AI inference results from MQTT.
 */
class DetectionPipelineService {
  /**
   * Process and save a single detection event.
   * @param {Object} payload - The detection payload from MQTT.
   */
  static async processEvent(payload) {
    try {
      // 1. Validation
      const validatedData = this._validatePayload(payload);
      if (!validatedData) return null;

      // 2. Duplicate Protection (optional/simple check)
      // If a log for this camera/zone exists within the last 1 second, skip to avoid spam.
      const isDuplicate = await this._checkDuplicate(validatedData);
      if (isDuplicate) {
        console.log(`[DetectionPipeline] Duplicate event skipped for Camera ${validatedData.camera_id}, Zone ${validatedData.zone_id}`);
        return null;
      }

      // 3. Persist to Database
      const newLog = await DetectionLog.create({
        camera_id: validatedData.camera_id,
        zone_id: validatedData.zone_id,
        occupancy_count: validatedData.person_count,
        zone_status: validatedData.light_status,
        detection_time: validatedData.timestamp
      });

      console.log(`[DetectionPipeline] Successfully logged detection for Camera ${newLog.camera_id}, Zone ${newLog.zone_id}`);
      
      // 4. Trigger Automation Engine
      automationService.handleDetection(newLog).catch(err => 
        console.error('[DetectionPipeline] Automation Error:', err)
      );

      return newLog;
    } catch (error) {
      console.error('[DetectionPipeline] Error processing event:', error);
      throw error;
    }
  }

  /**
   * Validate and normalize the payload fields.
   * @private
   */
  static _validatePayload(payload) {
    const { camera_id, zone_id, person_count, light_status, timestamp } = payload;

    // Required fields check
    if (camera_id === undefined || camera_id === null || person_count === undefined || person_count === null) {
      console.warn('[DetectionPipeline] Invalid payload: missing mandatory fields', payload);
      return null;
    }

    if (isNaN(parseInt(camera_id)) || isNaN(parseInt(person_count))) {
      console.warn('[DetectionPipeline] Invalid payload: fields must be numbers', payload);
      return null;
    }

    // Normalizing timestamp
    const normalizedTimestamp = timestamp ? dayjs(timestamp).toDate() : new Date();

    return {
      camera_id: parseInt(camera_id),
      zone_id: zone_id ? parseInt(zone_id) : null,
      person_count: parseInt(person_count),
      light_status: light_status || (person_count > 0 ? 'ON' : 'OFF'),
      timestamp: normalizedTimestamp
    };
  }

  /**
   * Check if a similar log was created very recently (within 1 second).
   * @private
   */
  static async _checkDuplicate(data) {
    if (!data.zone_id) return false;

    const recentLog = await DetectionLog.findOne({
      where: {
        camera_id: data.camera_id,
        zone_id: data.zone_id,
        detection_time: {
          [Op.gte]: dayjs(data.timestamp).subtract(1, 'second').toDate()
        }
      }
    });

    return !!recentLog;
  }

  /**
   * Bulk process results (Useful for multi-zone payloads from AI)
   * Example: { "Zone A": 2, "Zone B": 0, "camera_id": 1, "lampu": "ON" }
   */
  static async processBulkAIResult(payload) {
    const { camera_id, lampu, ...counts } = payload;
    const results = [];

    if (camera_id === undefined || camera_id === null || isNaN(parseInt(camera_id))) {
      console.warn('[DetectionPipeline] Invalid bulk payload: missing or invalid camera_id', payload);
      return results;
    }

    // Filter out metadata fields
    const zoneEntries = Object.entries(counts).filter(([key]) => 
      !['camera_id', 'lampu', 'luar_zona', 'total'].includes(key)
    );

    for (const [zoneName, count] of zoneEntries) {
      try {
        // Find zone_id by name and camera
        const zone = await Zone.findOne({ 
          where: { 
            zone_name: zoneName,
            room_id: {
              [Op.in]: db.sequelize.literal(`(SELECT room_id FROM cameras WHERE camera_id = ${parseInt(camera_id)})`)
            }
          } 
        });

        if (zone) {
          const event = await this.processEvent({
            camera_id,
            zone_id: zone.zone_id,
            person_count: count,
            light_status: lampu || (count > 0 ? 'ON' : 'OFF'),
            timestamp: new Date()
          });
          if (event) results.push(event);
        }
      } catch (err) {
        console.error(`[DetectionPipeline] Error processing bulk zone ${zoneName}:`, err);
      }
    }
    return results;
  }
}

export default DetectionPipelineService;
