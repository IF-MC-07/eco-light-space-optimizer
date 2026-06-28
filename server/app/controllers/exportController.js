import responseFormatter from '../utils/response.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import * as roomService from '../services/roomService.js';
import * as userService from '../services/userService.js';
import * as iotDeviceService from '../services/iotDeviceService.js';
import db from '../models/index.js';

const BRAND_COLOR = '#10b981'; // emerald-500
const TEXT_COLOR = '#1f2937';
const LIGHT_TEXT = '#6b7280';

// Helper for PDF styling
const createPdfHeader = (doc, title) => {
  doc.rect(0, 0, doc.page.width, 80).fill(BRAND_COLOR);
  doc.fontSize(24).fillColor('#ffffff').text(title, 0, 30, { align: 'center' });
  doc.moveDown(2);
  doc.fillColor(TEXT_COLOR);
};

// Helper for Excel styling
const styleExcelSheet = (worksheet) => {
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.columns.forEach(column => {
    column.width = 20;
  });
};


export const exportUsers = async (req, res, next) => {
  try {
    const { format } = req.query;
    const users = await userService.getAll();
    
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=users.pdf');
      doc.pipe(res);
      createPdfHeader(doc, 'Users Report');
      
      let y = 100;
      users.forEach((user, index) => {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.fontSize(12).fillColor(TEXT_COLOR).text(`User ID: ${user.user_id}`, 50, y);
        doc.fontSize(10).fillColor(LIGHT_TEXT).text(`Name: ${user.name} | Email: ${user.email} | Role: ${user.role}`, 50, y + 15);
        doc.moveTo(50, y + 35).lineTo(550, y + 35).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
        y += 45;
      });
      doc.end();
    } else if (format === 'xlsx' || format === 'csv') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Users');
      worksheet.columns = [
        { header: 'ID', key: 'user_id', width: 35 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Role', key: 'role', width: 15 }
      ];
      styleExcelSheet(worksheet);
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
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=energy_logs.pdf');
      doc.pipe(res);
      createPdfHeader(doc, 'Energy Logs Report');
      
      let y = 100;
      logs.forEach(log => {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.fontSize(12).fillColor(TEXT_COLOR).text(`Room: ${log.Room?.room_name || 'N/A'}`, 50, y);
        doc.fontSize(10).fillColor(LIGHT_TEXT).text(`Total Watts: ${log.total_watts}W | Saved: ${log.saved_watts}W | Date: ${new Date(log.date).toLocaleDateString()}`, 50, y + 15);
        doc.moveTo(50, y + 35).lineTo(550, y + 35).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
        y += 45;
      });
      doc.end();
    } else if (format === 'xlsx' || format === 'csv') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Energy Logs');
      worksheet.columns = [
        { header: 'Log ID', key: 'log_id', width: 15 },
        { header: 'Room Name', key: 'room_name', width: 25 },
        { header: 'Total Watts', key: 'total_watts', width: 20 },
        { header: 'Saved Watts', key: 'saved_watts', width: 20 },
        { header: 'Date', key: 'date', width: 25 }
      ];
      styleExcelSheet(worksheet);
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
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=savings_report.pdf');
      doc.pipe(res);
      createPdfHeader(doc, 'Savings & Efficiency Report');
      
      let y = 100;
      const totalSaved = logs.reduce((sum, log) => sum + (log.saved_watts || 0), 0);
      doc.fontSize(16).fillColor(BRAND_COLOR).text(`Total Energy Saved: ${totalSaved.toFixed(2)} Watts`, 50, y);
      y += 30;

      logs.forEach(log => {
        if (y > 700) { doc.addPage(); y = 50; }
        const efficiency = log.total_watts > 0 ? ((log.saved_watts / (log.total_watts + log.saved_watts)) * 100).toFixed(2) : 0;
        doc.fontSize(12).fillColor(TEXT_COLOR).text(`Room: ${log.Room?.room_name || 'N/A'}`, 50, y);
        doc.fontSize(10).fillColor(LIGHT_TEXT).text(`Saved: ${log.saved_watts} W | Efficiency: ${efficiency}% | Date: ${new Date(log.date).toLocaleDateString()}`, 50, y + 15);
        doc.moveTo(50, y + 35).lineTo(550, y + 35).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
        y += 45;
      });
      doc.end();
    } else if (format === 'xlsx' || format === 'csv') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Savings Report');
      worksheet.columns = [
        { header: 'Room Name', key: 'room_name', width: 25 },
        { header: 'Saved Watts', key: 'saved_watts', width: 20 },
        { header: 'Total Watts (Active)', key: 'total_watts', width: 25 },
        { header: 'Efficiency (%)', key: 'efficiency', width: 20 },
        { header: 'Date', key: 'date', width: 25 }
      ];
      styleExcelSheet(worksheet);
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
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${resource}.pdf`);
      doc.pipe(res);
      createPdfHeader(doc, title);

      let y = 100;
      data.forEach((item) => {
        if (y > 700) { doc.addPage(); y = 50; }
        
        doc.fontSize(11).fillColor(TEXT_COLOR);
        let xOffset = 50;
        columns.forEach(c => {
          doc.text(`${c.header}: ${item[c.key] || 'N/A'}`, xOffset, y, { width: 150 });
          xOffset += 160;
          if (xOffset > 450) {
            xOffset = 50;
            y += 15;
          }
        });
        y += 25;
        doc.moveTo(50, y).lineTo(550, y).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
        y += 15;
      });
      doc.end();
    } else if (fmt === 'xlsx' || fmt === 'csv') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(title);
      worksheet.columns = columns.map(c => ({ ...c, width: 25 }));
      styleExcelSheet(worksheet);

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

