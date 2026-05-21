import db from '../models/index.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getSummary = async (req, res) => {
  try {
    const { room_id } = req.query;
    
    const url = room_id 
      ? `${AI_SERVICE_URL}/energy/summary?room_id=${room_id}` 
      : `${AI_SERVICE_URL}/energy/summary`;
      
    const response = await fetch(url);
    const summary = await response.json();

    res.status(200).json({
      success: true,
      data: {
        total_saved_watts: summary.total_saved_watts || 0.0,
        today_saved_watts: (summary.total_saved_watts / 30) || 0.0, // daily average estimate
        co2_saved_kg: summary.co2_kg_saved || 0.0,
        cost_saved_idr: summary.cost_idr_saved || 0.0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBreakdown = async (req, res) => {
  try {
    const { room_id } = req.query;
    
    const url = room_id 
      ? `${AI_SERVICE_URL}/energy/breakdown?room_id=${room_id}` 
      : `${AI_SERVICE_URL}/energy/breakdown`;
      
    const response = await fetch(url);
    const breakdown = await response.json();

    const formatted = breakdown.map(item => ({
      room_id: item.room_id,
      room_name: item.room_name,
      saved_watts: item.saved_watts,
      total_watts: item.total_watts,
      percentage: item.savings_pct
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTrend = async (req, res) => {
  try {
    const { days } = req.query;
    const numDays = days ? parseInt(days) : 7;
    
    const url = `${AI_SERVICE_URL}/energy/trend?days=${numDays}`;
    const response = await fetch(url);
    const trend = await response.json();

    const formatted = trend.map(item => ({
      date: item.date,
      saved_watts: item.saved_watts
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getYoY = async (req, res) => {
  try {
    const url = `${AI_SERVICE_URL}/energy/yoy`;
    const response = await fetch(url);
    const yoy = await response.json();

    res.status(200).json({
      success: true,
      data: {
        last_year_watts: yoy.previous_year_total_watts || 0.0,
        this_year_watts: yoy.current_year_total_watts || 0.0,
        reduction_percentage: yoy.yoy_change_pct ? -yoy.yoy_change_pct : 0.0 // reduction is positive if consumption decreased
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
