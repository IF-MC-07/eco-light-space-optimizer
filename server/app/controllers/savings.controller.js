import responseFormatter from '../utils/response.js';
import db from '../models/index.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getSummary = async (req, res, next) => {
  try {
    const { room_id } = req.query;
    
    const url = room_id 
      ? `${AI_SERVICE_URL}/energy/summary?room_id=${room_id}` 
      : `${AI_SERVICE_URL}/energy/summary`;
      
    const response = await fetch(url);
    const summary = await response.json();

    return responseFormatter.success(res, {
        total_saved_watts: summary.total_saved_watts || 0.0,
        today_saved_watts: (summary.total_saved_watts / 30) || 0.0, // daily average estimate
        co2_saved_kg: summary.co2_kg_saved || 0.0,
        cost_saved_idr: summary.cost_idr_saved || 0.0
      }, 'Success');
  } catch (error) {
    next(error);
  }
};

export const getBreakdown = async (req, res, next) => {
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

    return responseFormatter.success(res, formatted , 'Success');
  } catch (error) {
    next(error);
  }
};

export const getTrend = async (req, res, next) => {
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

    return responseFormatter.success(res, formatted , 'Success');
  } catch (error) {
    next(error);
  }
};

export const getYoY = async (req, res, next) => {
  try {
    const url = `${AI_SERVICE_URL}/energy/yoy`;
    const response = await fetch(url);
    const yoy = await response.json();

    return responseFormatter.success(res, {
        last_year_watts: yoy.previous_year_total_watts || 0.0,
        this_year_watts: yoy.current_year_total_watts || 0.0,
        reduction_percentage: yoy.yoy_change_pct ? -yoy.yoy_change_pct : 0.0 // reduction is positive if consumption decreased
      }, 'Success');
  } catch (error) {
    next(error);
  }
};
