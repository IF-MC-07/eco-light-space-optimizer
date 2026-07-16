import responseFormatter from '../utils/response.js';
import db from '../models/index.js';
import mqttService from '../services/mqttService.js';

export const getEnergi = async (req, res, next) => {
  try {
    const { room_id, date } = req.query;
    let whereClause = {};

    if (room_id) whereClause.room_id = room_id;
    if (date) {
      const parsedDate = new Date(date);
      whereClause.date = parsedDate;
    }

    const data = await db.EnergyLog.findAll({
      where: whereClause,
      order: [['log_id', 'DESC']],
      include: [{ model: db.Room }]
    });

    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getSensor = async (req, res, next) => {
  try {
    const { room_id } = req.query;
    
    let whereClause = {};
    if (room_id) {
      whereClause.room_id = room_id;
    }

    const data = await db.PowerSensor.findAll({
      limit: 10,
      order: [['read_at', 'DESC']],
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: [{ model: db.Room }]
    });

    return responseFormatter.success(res, data, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const lights_active = await db.LightControl.count({
      where: {
        light_status: ['on', 'active', 'ON', 'ACTIVE']
      }
    });

    const lights_total = await db.LightControl.count();

    const ac_units_running = await db.AcControl.count({
      where: {
        ac_status: ['on', 'active', 'ON', 'ACTIVE']
      }
    });

    const result = await db.AcControl.findOne({
      attributes: [
        [db.Sequelize.fn('AVG', db.Sequelize.col('temperature_setting')), 'avg_val']
      ],
      raw: true
    });
    const avg_temperature = result?.avg_val
      ? parseFloat(Number(result.avg_val).toFixed(1))
      : 24.0;

    return responseFormatter.success(res, {
        lights_active,
        lights_total,
        ac_units_running,
        avg_temperature,
        energy_mode: "ECO"
      }, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getDevices = async (req, res, next) => {
  try {
    const devices = await db.IotDevice.findAll({
      include: [
        { model: db.Room },
        { model: db.LightControl },
        { model: db.AcControl }
      ]
    });

    const formatted = devices.map(dev => {
      const isLightActive = dev.LightControls && dev.LightControls.some(l => ['on', 'active', 'ON', 'ACTIVE'].includes(l.light_status));
      const isAcActive = dev.AcControls && dev.AcControls.some(a => ['on', 'active', 'ON', 'ACTIVE'].includes(a.ac_status));
      const temp = dev.AcControls && dev.AcControls[0] ? dev.AcControls[0].temperature_setting : 24;
      const lStatus = dev.LightControls && dev.LightControls[0] ? dev.LightControls[0].light_status : 'off';

      return {
        device_id: dev.device_id,
        room_name: dev.Room ? dev.Room.room_name : 'Unknown Room',
        lighting: isLightActive ? 'Active' : 'Inactive',
        ac_status: isAcActive ? 'Active' : 'Inactive',
        temperature: temp,
        light_status: lStatus,
        device_status: dev.status || 'aktif',
        light_controls: dev.LightControls ? dev.LightControls.map(l => ({
          control_id: l.control_id,
          relay_channel: l.relay_channel,
          light_status: l.light_status
        })).sort((a, b) => (a.relay_channel || 0) - (b.relay_channel || 0)) : [],
        ac_controls: dev.AcControls ? dev.AcControls.map(a => ({
          ac_control_id: a.ac_control_id,
          ac_status: a.ac_status,
          temperature_setting: a.temperature_setting
        })) : []
      };
    });

    return responseFormatter.success(res, formatted , 'Success');
  } catch (error) {
    next(error);
  }
};

export const updateDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { device_status, light_status, ac_status, temperature } = req.body;

    const device = await db.IotDevice.findByPk(id);

    if (!device) {
      return responseFormatter.error(res, 'Device not found' , 404);
    }

    if (device_status !== undefined) {
      device.status = device_status;
      await device.save();

      // Master switch logic: turn on/off all lights and AC controls for this device
      const isTurnOn = ['aktif', 'active', 'ACTIVE', 'AKTIF', 'on', 'ON'].includes(device_status.toLowerCase());
      const targetLightStatus = isTurnOn ? 'on' : 'off';
      const targetAcStatus = isTurnOn ? 'on' : 'off';

      // 1. Update and publish all LightControls
      const lightControls = await db.LightControl.findAll({
        where: { device_id: id },
        include: [{ model: db.Zone }]
      });
      for (const control of lightControls) {
        await control.update({ light_status: targetLightStatus, updated_at: new Date() });
        
        // Publish general MQTT
        const generalTopic = process.env.MQTT_TOPIC_CONTROL || 'kelas/control';
        const generalPayload = {
          device_id: control.device_id,
          relay_channel: control.relay_channel,
          action: targetLightStatus.toUpperCase()
        };
        mqttService.publish(generalTopic, generalPayload);

        // Publish specific ESP32 MQTT
        const roomId = device.room_id || (control.Zone ? control.Zone.room_id : null);
        if (roomId) {
          const espTopic = `devices/${roomId}/light/${control.relay_channel}`;
          const espPayload = {
            command: targetLightStatus.toUpperCase(),
            zone_id: control.zone_id,
            zone_name: control.Zone ? control.Zone.zone_name : `Zone ${control.zone_id}`,
            relay_channel: control.relay_channel,
            source: "admin_override",
            timestamp: new Date().toISOString()
          };
          mqttService.publish(espTopic, espPayload);
        }
      }

      // 2. Update and publish all AcControls
      const acControls = await db.AcControl.findAll({
        where: { device_id: id }
      });
      for (const control of acControls) {
        await control.update({ ac_status: targetAcStatus, updated_at: new Date() });
        
        // Publish AC MQTT
        const topic = `devices/${control.room_id}/ac`;
        const payload = {
          command: targetAcStatus.toUpperCase(),
          room_id: control.room_id,
          temperature: parseFloat(control.temperature_setting || 24.0),
          source: "admin_override",
          timestamp: new Date().toISOString()
        };
        mqttService.publish(topic, payload);
      }
    }

    if (light_status !== undefined) {
      const lightControls = await db.LightControl.findAll({
        where: { device_id: id },
        include: [{ model: db.Zone }]
      });
      for (const control of lightControls) {
        await control.update({ light_status, updated_at: new Date() });
        
        // Publish general MQTT
        const generalTopic = process.env.MQTT_TOPIC_CONTROL || 'kelas/control';
        const generalPayload = {
          device_id: control.device_id,
          relay_channel: control.relay_channel,
          action: light_status.toUpperCase()
        };
        mqttService.publish(generalTopic, generalPayload);

        // Publish specific ESP32 MQTT
        const roomId = device.room_id || (control.Zone ? control.Zone.room_id : null);
        if (roomId) {
          const espTopic = `devices/${roomId}/light/${control.relay_channel}`;
          const espPayload = {
            command: light_status.toUpperCase(),
            zone_id: control.zone_id,
            zone_name: control.Zone ? control.Zone.zone_name : `Zone ${control.zone_id}`,
            relay_channel: control.relay_channel,
            source: "admin_override",
            timestamp: new Date().toISOString()
          };
          mqttService.publish(espTopic, espPayload);
        }
      }
    }

    const acUpdates = {};
    if (ac_status !== undefined) acUpdates.ac_status = ac_status;
    if (temperature !== undefined) acUpdates.temperature_setting = temperature;

    if (Object.keys(acUpdates).length > 0) {
      const acControls = await db.AcControl.findAll({
        where: { device_id: id }
      });
      for (const control of acControls) {
        await control.update({ ...acUpdates, updated_at: new Date() });
        
        // Publish AC MQTT
        if (acUpdates.ac_status !== undefined || acUpdates.temperature_setting !== undefined) {
          const topic = `devices/${control.room_id}/ac`;
          const payload = {
            command: control.ac_status.toUpperCase(),
            room_id: control.room_id,
            temperature: parseFloat(control.temperature_setting || 24.0),
            source: "admin_override",
            timestamp: new Date().toISOString()
          };
          mqttService.publish(topic, payload);
        }
      }
    }

    return responseFormatter.success(res, null, 'Device updated successfully' );
  } catch (error) {
    next(error);
  }
};

export const postMasterControl = async (req, res, next) => {
  try {
    const { action } = req.body;

    if (action === 'kill_all') {
      await db.LightControl.update({ light_status: 'off' }, { where: {} });
      await db.AcControl.update({ ac_status: 'off' }, { where: {} });
      return responseFormatter.success(res, null, 'All devices powered off' );
    } else if (action === 'eco_pulse') {
      await db.AcControl.update({ temperature_setting: 25.0, ac_status: 'on' }, { where: {} });
      return responseFormatter.success(res, null, 'Eco Mode Pulse activated (AC set to 25°C)' );
    }

    return responseFormatter.error(res, 'Invalid master control action' , 400);
  } catch (error) {
    next(error);
  }
};

export const getClimate = async (req, res, next) => {
  try {
    const result = await db.AcControl.findOne({
      attributes: [
        [db.Sequelize.fn('AVG', db.Sequelize.col('temperature_setting')), 'avg_val']
      ],
      raw: true
    });
    const avg_temperature = result?.avg_val
      ? parseFloat(Number(result.avg_val).toFixed(1))
      : 24.0;

    return responseFormatter.success(res, {
        target_temperature: avg_temperature,
        humidity: 45,
        air_purity: 'OPTIMAL'
      }, 'Success');
  } catch (error) {
    next(error);
  }
};

export const updateClimate = async (req, res, next) => {
  try {
    const { target_temperature } = req.body;
    if (target_temperature !== undefined) {
      await db.AcControl.update(
        { temperature_setting: target_temperature },
        { where: {} }
      );
    }
    return responseFormatter.success(res, null, 'Climate settings applied successfully' );
  } catch (error) {
    next(error);
  }
};

