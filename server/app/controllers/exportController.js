import responseFormatter from '../utils/response.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import * as roomService from '../services/roomService.js';
import * as userService from '../services/userService.js';
import * as iotDeviceService from '../services/iotDeviceService.js';
import db from '../models/index.js';


export const exportUsers = async (req, res, next) => {
  try {
    const { format } = req.query;
    const users = await userService.getAll();
    
    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=users.pdf');
      doc.pipe(res);
      doc.fontSize(20).text('Users Report', { align: 'center' });
      doc.moveDown();
      users.forEach(user => {
        doc.fontSize(10).text(`ID: ${user.user_id} | Name: ${user.name} | Email: ${user.email} | Role: ${user.role}`);
        doc.moveDown(0.5);
      });
      doc.end();
    } else if (format === 'xlsx' || format === 'csv') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Users');
      worksheet.columns = [
        { header: 'ID', key: 'user_id' },
        { header: 'Name', key: 'name' },
        { header: 'Email', key: 'email' },
        { header: 'Role', key: 'role' }
      ];
      users.forEach(user => worksheet.addRow(user.toJSON ? user.toJSON() : user));
      
      if (format === 'xlsx') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
        await workbook.xlsx.write(res);
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
        await workbook.csv.write(res);
      }
      res.end();
    } else {
      return responseFormatter.error(res, 'Invalid format. Use pdf, xlsx, or csv.' , 400);
    }
  } catch (error) {
    next(error);
  }
};


export const exportEnergyLogs = async (req, res, next) => {
  try {
    const { format } = req.query;
    const logs = await db.EnergyLog.findAll({
      include: [{ model: db.Room }]
    });
    
    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=energy_logs.pdf');
      doc.pipe(res);
      doc.fontSize(20).text('Energy Logs Report', { align: 'center' });
      doc.moveDown();
      logs.forEach(log => {
        doc.fontSize(10).text(`ID: ${log.log_id} | Room: ${log.Room?.room_name || 'N/A'} | Total Watts: ${log.total_watts} | Saved Watts: ${log.saved_watts} | Date: ${log.date}`);
        doc.moveDown(0.5);
      });
      doc.end();
    } else if (format === 'xlsx' || format === 'csv') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Energy Logs');
      worksheet.columns = [
        { header: 'ID', key: 'log_id' },
        { header: 'Room Name', key: 'room_name' },
        { header: 'Total Watts', key: 'total_watts' },
        { header: 'Saved Watts', key: 'saved_watts' },
        { header: 'Date', key: 'date' }
      ];
      logs.forEach(log => {
        const row = log.toJSON();
        row.room_name = log.Room?.room_name || 'N/A';
        worksheet.addRow(row);
      });
      
      if (format === 'xlsx') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=energy_logs.xlsx');
        await workbook.xlsx.write(res);
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=energy_logs.csv');
        await workbook.csv.write(res);
      }
      res.end();
    } else {
      return responseFormatter.error(res, 'Invalid format. Use pdf, xlsx, or csv.' , 400);
    }
  } catch (error) {
    next(error);
  }
};

export const exportSavingsReport = async (req, res, next) => {
  try {
    const { format } = req.query;
    const logs = await db.EnergyLog.findAll({
      include: [{ model: db.Room }]
    });
    
    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=savings_report.pdf');
      doc.pipe(res);
      doc.fontSize(20).text('Savings & Efficiency Report', { align: 'center' });
      doc.moveDown();
      
      const totalSaved = logs.reduce((sum, log) => sum + (log.saved_watts || 0), 0);
      doc.fontSize(14).text(`Total Energy Saved: ${totalSaved.toFixed(2)} Watts`, { align: 'left' });
      doc.moveDown();

      logs.forEach(log => {
        const efficiency = log.total_watts > 0 ? ((log.saved_watts / (log.total_watts + log.saved_watts)) * 100).toFixed(2) : 0;
        doc.fontSize(10).text(`Room: ${log.Room?.room_name || 'N/A'} | Saved: ${log.saved_watts} W | Efficiency: ${efficiency}% | Date: ${log.date}`);
        doc.moveDown(0.5);
      });
      doc.end();
    } else if (format === 'xlsx' || format === 'csv') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Savings Report');
      worksheet.columns = [
        { header: 'Room Name', key: 'room_name' },
        { header: 'Saved Watts', key: 'saved_watts' },
        { header: 'Total Watts (Active)', key: 'total_watts' },
        { header: 'Efficiency (%)', key: 'efficiency' },
        { header: 'Date', key: 'date' }
      ];
      logs.forEach(log => {
        const efficiency = (log.total_watts + log.saved_watts) > 0 ? ((log.saved_watts / (log.total_watts + log.saved_watts)) * 100).toFixed(2) : 0;
        worksheet.addRow({
          room_name: log.Room?.room_name || 'N/A',
          saved_watts: log.saved_watts,
          total_watts: log.total_watts,
          efficiency: `${efficiency}%`,
          date: log.date
        });
      });
      
      if (format === 'xlsx') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=savings_report.xlsx');
        await workbook.xlsx.write(res);
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=savings_report.csv');
        await workbook.csv.write(res);
      }
      res.end();
    } else {
      return responseFormatter.error(res, 'Invalid format. Use pdf, xlsx, or csv.' , 400);
    }
  } catch (error) {
    next(error);
  }
};

export const exportGeneric = async (req, res, next) => {
  try {
    const { resource, format } = req.params;
    let data = [];
    let columns = [];
    let title = '';

    switch (resource) {
      case 'rooms':
        data = await db.Room.findAll();
        columns = [
          { header: 'Room ID', key: 'room_id' },
          { header: 'Room Name', key: 'room_name' },
          { header: 'Floor', key: 'floor' },
          { header: 'Capacity', key: 'capacity' }
        ];
        title = 'Rooms List';
        break;
      case 'users':
        data = await db.User.findAll();
        columns = [
          { header: 'User ID', key: 'user_id' },
          { header: 'Name', key: 'name' },
          { header: 'Email', key: 'email' },
          { header: 'Role', key: 'role' }
        ];
        title = 'Users List';
        break;
      case 'devices':
      case 'iot-devices':
        data = await db.IotDevice.findAll({ include: [{ model: db.Room }] });
        columns = [
          { header: 'Device ID', key: 'device_id' },
          { header: 'Device Name', key: 'device_name' },
          { header: 'Device Type', key: 'device_type' },
          { header: 'Status', key: 'status' },
          { header: 'Room', key: 'room_name' }
        ];
        data = data.map(d => {
          const row = d.toJSON ? d.toJSON() : d;
          row.room_name = d.Room ? d.Room.room_name : 'N/A';
          return row;
        });
        title = 'IoT Devices List';
        break;
      case 'schedules':
      case 'automation-schedules':
        data = await db.AutomationSchedule.findAll({ include: [{ model: db.Room }] });
        columns = [
          { header: 'Schedule ID', key: 'schedule_id' },
          { header: 'Room', key: 'room_name' },
          { header: 'Device Type', key: 'device_type' },
          { header: 'Action', key: 'action' },
          { header: 'Time', key: 'time' },
          { header: 'Days', key: 'days' }
        ];
        data = data.map(d => {
          const row = d.toJSON ? d.toJSON() : d;
          row.room_name = d.Room ? d.Room.room_name : 'N/A';
          return row;
        });
        title = 'Automation Schedules';
        break;
      case 'zones':
        data = await db.Zone.findAll({ include: [{ model: db.Room }] });
        columns = [
          { header: 'Zone ID', key: 'zone_id' },
          { header: 'Zone Name', key: 'zone_name' },
          { header: 'Room', key: 'room_name' },
          { header: 'Light Threshold', key: 'light_threshold_lux' }
        ];
        data = data.map(d => {
          const row = d.toJSON ? d.toJSON() : d;
          row.room_name = d.Room ? d.Room.room_name : 'N/A';
          return row;
        });
        title = 'Zones List';
        break;
      default:
        return responseFormatter.error(res, 'Invalid resource type' , 400);
    }

    const fmt = format.toLowerCase();
    if (fmt === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${resource}.pdf`);
      doc.pipe(res);
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();

      data.forEach(item => {
        const text = columns.map(c => `${c.header}: ${item[c.key] || 'N/A'}`).join(' | ');
        doc.fontSize(10).text(text);
        doc.moveDown(0.5);
      });
      doc.end();
    } else if (fmt === 'xlsx' || fmt === 'csv') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(title);
      worksheet.columns = columns;

      data.forEach(item => {
        worksheet.addRow(item.toJSON ? item.toJSON() : item);
      });

      if (fmt === 'xlsx') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${resource}.xlsx`);
        await workbook.xlsx.write(res);
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${resource}.csv`);
        await workbook.csv.write(res);
      }
      res.end();
    } else {
      return responseFormatter.error(res, 'Invalid format. Use pdf, xlsx, or csv.' , 400);
    }
  } catch (error) {
    next(error);
  }
};

