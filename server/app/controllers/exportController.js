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
      res.status(400).json({ success: false, message: 'Invalid format. Use pdf, xlsx, or csv.' });
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
      res.status(400).json({ success: false, message: 'Invalid format. Use pdf, xlsx, or csv.' });
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
      res.status(400).json({ success: false, message: 'Invalid format. Use pdf, xlsx, or csv.' });
    }
  } catch (error) {
    next(error);
  }
};

