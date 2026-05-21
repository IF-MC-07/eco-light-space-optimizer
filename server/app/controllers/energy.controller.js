import db from '../models/index.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getSummary = async (req, res) => {
  try {
    const { room_id } = req.query;
    
    // Construct URLs
    const summaryUrl = room_id 
      ? `${AI_SERVICE_URL}/energy/summary?room_id=${room_id}` 
      : `${AI_SERVICE_URL}/energy/summary`;
    
    const realtimeUrl = room_id 
      ? `${AI_SERVICE_URL}/stats/realtime?room_id=${room_id}` 
      : `${AI_SERVICE_URL}/stats/realtime`;

    // Fetch in parallel
    const [summaryRes, realtimeRes] = await Promise.all([
      fetch(summaryUrl),
      fetch(realtimeUrl)
    ]);

    const summaryData = await summaryRes.json();
    const realtimeData = await realtimeRes.json();

    res.status(200).json({
      success: true,
      data: {
        current_consumption: realtimeData.mean_watts || 0.0,
        today_usage: summaryData.avg_daily_watts || 0.0,
        today_saved: (summaryData.total_saved_watts / 30) || 0.0, // daily average estimate
        monthly_usage: summaryData.total_consumption_watts || 0.0,
        monthly_saved: summaryData.total_saved_watts || 0.0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLogs = async (req, res) => {
  try {
    const { room_id } = req.query;
    
    // Construct URL for daily savings trend
    const url = `${AI_SERVICE_URL}/energy/trend?days=30`;
    const response = await fetch(url);
    const trendData = await response.json();

    // Map logs to format expected by frontend or fallback to database if failed
    res.status(200).json({ 
      success: true, 
      data: trendData.map(t => ({
        date: t.date,
        total_watts: t.total_watts,
        saved_watts: t.saved_watts,
        savings_percentage: t.savings_pct
      }))
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
    const breakdownData = await response.json();

    const formatted = breakdownData.map(item => ({
      room_id: item.room_id,
      room_name: item.room_name,
      total_watts: item.total_watts,
      saved_watts: item.saved_watts,
      savings_pct: item.savings_pct,
      rank: item.rank
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
