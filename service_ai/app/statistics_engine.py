import os
import logging
from datetime import datetime
import numpy as np
import pandas as pd
from dotenv import load_dotenv

try:
    from app.zona_loader import get_db_connection
except ImportError:
    from app.zona_loader import get_db_connection

load_dotenv()
logger = logging.getLogger(__name__)

# --- 5C. Carbon & Cost Estimation configuration ---
PLN_EMISSION_FACTOR = float(os.getenv("PLN_EMISSION_FACTOR", 0.00072))
PLN_TARIFF_IDR_PER_WH = float(os.getenv("PLN_TARIFF_IDR_PER_WH", 0.00138))


def calculate_carbon_savings(saved_watts: float) -> dict:
    """
    Convert saved_watts to:
    - co2_kg_saved: saved_watts * PLN_EMISSION_FACTOR
    - cost_idr_saved: saved_watts * PLN_TARIFF_IDR_PER_WH
    """
    co2_saved = saved_watts * PLN_EMISSION_FACTOR
    cost_saved = saved_watts * PLN_TARIFF_IDR_PER_WH
    return {
        "co2_kg_saved": float(np.round(co2_saved, 4)),
        "cost_idr_saved": float(np.round(cost_saved, 2))
    }


# --- 5A. Power Sensor Statistics ---
def get_realtime_stats(room_id=None) -> dict:
    """
    Returns descriptive stats from power_sensors:
    - mean_watts, median_watts, std_watts
    - min_watts, max_watts
    - mean_voltage, mean_current
    - latest_reading (most recent row)
    - sample_count
    Optional: filter by room_id
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            query = "SELECT power_watts, voltage_v, current_a, read_at FROM power_sensors"
            params = []
            if room_id is not None:
                query += " WHERE room_id = %s"
                params.append(room_id)
            query += " ORDER BY read_at DESC"
            
            cur.execute(query, tuple(params))
            rows = cur.fetchall()

        # Load into Pandas DataFrame
        df = pd.DataFrame(rows, columns=['power_watts', 'voltage_v', 'current_a', 'read_at'])
        
        if df.empty:
            return {
                "mean_watts": 0.0,
                "median_watts": 0.0,
                "std_watts": 0.0,
                "min_watts": 0.0,
                "max_watts": 0.0,
                "mean_voltage": 0.0,
                "mean_current": 0.0,
                "latest_reading": None,
                "sample_count": 0
            }

        # Cast column types
        df['power_watts'] = df['power_watts'].astype(float)
        df['voltage_v'] = df['voltage_v'].astype(float)
        df['current_a'] = df['current_a'].astype(float)

        mean_watts = float(df['power_watts'].mean())
        median_watts = float(df['power_watts'].median())
        # std is nan if sample size is 1
        std_watts = float(df['power_watts'].std()) if len(df) > 1 else 0.0
        if np.isnan(std_watts):
            std_watts = 0.0
            
        min_watts = float(df['power_watts'].min())
        max_watts = float(df['power_watts'].max())
        mean_voltage = float(df['voltage_v'].mean())
        mean_current = float(df['current_a'].mean())

        latest = df.iloc[0]
        latest_reading = {
            "power_watts": float(latest["power_watts"]),
            "voltage_v": float(latest["voltage_v"]),
            "current_a": float(latest["current_a"]),
            "read_at": latest["read_at"].isoformat() if hasattr(latest["read_at"], "isoformat") else str(latest["read_at"])
        }

        return {
            "mean_watts": float(np.round(mean_watts, 2)),
            "median_watts": float(np.round(median_watts, 2)),
            "std_watts": float(np.round(std_watts, 2)),
            "min_watts": float(np.round(min_watts, 2)),
            "max_watts": float(np.round(max_watts, 2)),
            "mean_voltage": float(np.round(mean_voltage, 2)),
            "mean_current": float(np.round(mean_current, 2)),
            "latest_reading": latest_reading,
            "sample_count": int(len(df))
        }
    except Exception as e:
        logger.error(f"❌ Error in get_realtime_stats: {e}")
        return {}
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)


def get_top_consumers(limit=5) -> list:
    """
    Returns rooms ranked by average power_watts DESC
    Each: { room_id, room_name, avg_watts, latest_watts }
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT ps.room_id, r.room_name, ps.power_watts, ps.read_at
                FROM power_sensors ps
                JOIN rooms r ON ps.room_id = r.room_id
            """)
            rows = cur.fetchall()

        df = pd.DataFrame(rows, columns=['room_id', 'room_name', 'power_watts', 'read_at'])
        if df.empty:
            return []

        df['power_watts'] = df['power_watts'].astype(float)
        
        # Calculate avg
        avg_df = df.groupby(['room_id', 'room_name'])['power_watts'].mean().reset_index(name='avg_watts')

        # Find latest
        df_sorted = df.sort_values(by='read_at', ascending=False)
        latest_df = df_sorted.groupby('room_id').first().reset_index()

        # Merge
        merged = avg_df.merge(latest_df[['room_id', 'power_watts']], on='room_id')
        merged = merged.rename(columns={'power_watts': 'latest_watts'})

        # Sort and limit
        merged = merged.sort_values(by='avg_watts', ascending=False).head(limit)

        result = []
        for _, row in merged.iterrows():
            result.append({
                "room_id": int(row['room_id']),
                "room_name": str(row['room_name']),
                "avg_watts": float(np.round(row['avg_watts'], 2)),
                "latest_watts": float(np.round(row['latest_watts'], 2))
            })
        return result
    except Exception as e:
        logger.error(f"❌ Error in get_top_consumers: {e}")
        return []
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)


def detect_usage_alerts(threshold_watts=500) -> list:
    """
    Returns rooms where latest power_watts > threshold_watts
    Each: { room_id, room_name, current_watts, threshold, exceeded_by }
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT ps.room_id, r.room_name, ps.power_watts, ps.read_at
                FROM power_sensors ps
                JOIN rooms r ON ps.room_id = r.room_id
            """)
            rows = cur.fetchall()

        df = pd.DataFrame(rows, columns=['room_id', 'room_name', 'power_watts', 'read_at'])
        if df.empty:
            return []

        df['power_watts'] = df['power_watts'].astype(float)

        # Get latest reading per room
        df_sorted = df.sort_values(by='read_at', ascending=False)
        latest_df = df_sorted.groupby(['room_id', 'room_name']).first().reset_index()

        alerts = latest_df[latest_df['power_watts'] > threshold_watts].copy()
        
        result = []
        for _, row in alerts.iterrows():
            current_watts = float(row['power_watts'])
            exceeded_by = current_watts - float(threshold_watts)
            result.append({
                "room_id": int(row['room_id']),
                "room_name": str(row['room_name']),
                "current_watts": float(np.round(current_watts, 2)),
                "threshold": float(threshold_watts),
                "exceeded_by": float(np.round(exceeded_by, 2))
            })
        return result
    except Exception as e:
        logger.error(f"❌ Error in detect_usage_alerts: {e}")
        return []
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)


# --- 5B. Energy Log Statistics ---
def get_energy_summary(room_id=None) -> dict:
    """
    Returns from energy_logs:
    - total_consumption_watts (sum of total_watts)
    - total_saved_watts (sum of saved_watts)
    - savings_percentage = (saved / total) * 100
    - avg_daily_watts
    - peak_day { date, total_watts }
    - lowest_day { date, total_watts }
    - trend: 'improving' | 'stable' | 'worsening'
      (compare last 7 days avg vs previous 7 days avg)
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            query = "SELECT date, total_watts, saved_watts FROM energy_logs"
            params = []
            if room_id is not None:
                query += " WHERE room_id = %s"
                params.append(room_id)
            query += " ORDER BY date ASC"
            
            cur.execute(query, tuple(params))
            rows = cur.fetchall()

        df = pd.DataFrame(rows, columns=['date', 'total_watts', 'saved_watts'])
        if df.empty:
            return {
                "total_consumption_watts": 0.0,
                "total_saved_watts": 0.0,
                "savings_percentage": 0.0,
                "avg_daily_watts": 0.0,
                "peak_day": None,
                "lowest_day": None,
                "trend": "stable"
            }

        df['total_watts'] = df['total_watts'].astype(float)
        df['saved_watts'] = df['saved_watts'].astype(float)

        # Aggregate by date
        daily_df = df.groupby('date').agg({
            'total_watts': 'sum',
            'saved_watts': 'sum'
        }).reset_index()

        total_consumption = float(daily_df['total_watts'].sum())
        total_saved = float(daily_df['saved_watts'].sum())
        savings_pct = (total_saved / total_consumption * 100) if total_consumption > 0 else 0.0
        avg_daily = float(daily_df['total_watts'].mean())

        # Peak day
        peak_idx = daily_df['total_watts'].idxmax()
        peak_row = daily_df.loc[peak_idx]
        peak_day = {
            "date": peak_row['date'].isoformat() if hasattr(peak_row['date'], 'isoformat') else str(peak_row['date']),
            "total_watts": float(np.round(peak_row['total_watts'], 2))
        }

        # Lowest day
        lowest_idx = daily_df['total_watts'].idxmin()
        lowest_row = daily_df.loc[lowest_idx]
        lowest_day = {
            "date": lowest_row['date'].isoformat() if hasattr(lowest_row['date'], 'isoformat') else str(lowest_row['date']),
            "total_watts": float(np.round(lowest_row['total_watts'], 2))
        }

        # Trend analysis
        trend = 'stable'
        if len(daily_df) >= 2:
            n = min(7, len(daily_df) // 2)
            if n > 0:
                last_n_avg = daily_df.tail(n)['total_watts'].mean()
                prev_n_avg = daily_df.iloc[-2*n:-n]['total_watts'].mean()
                
                diff_pct = ((last_n_avg - prev_n_avg) / prev_n_avg) if prev_n_avg > 0 else 0.0
                if diff_pct < -0.05:  # consumption decreased by > 5%
                    trend = 'improving'
                elif diff_pct > 0.05:  # consumption increased by > 5%
                    trend = 'worsening'
                else:
                    trend = 'stable'

        return {
            "total_consumption_watts": float(np.round(total_consumption, 2)),
            "total_saved_watts": float(np.round(total_saved, 2)),
            "savings_percentage": float(np.round(savings_pct, 2)),
            "avg_daily_watts": float(np.round(avg_daily, 2)),
            "peak_day": peak_day,
            "lowest_day": lowest_day,
            "trend": trend
        }
    except Exception as e:
        logger.error(f"❌ Error in get_energy_summary: {e}")
        return {}
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)


def get_savings_breakdown(room_id=None) -> list:
    """
    Returns per-room savings breakdown:
    Each: { room_id, room_name, total_watts, saved_watts, savings_pct, rank }
    Sorted by saved_watts DESC
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            query = """
                SELECT el.room_id, r.room_name, el.total_watts, el.saved_watts
                FROM energy_logs el
                JOIN rooms r ON el.room_id = r.room_id
            """
            params = []
            if room_id is not None:
                query += " WHERE el.room_id = %s"
                params.append(room_id)
                
            cur.execute(query, tuple(params))
            rows = cur.fetchall()

        df = pd.DataFrame(rows, columns=['room_id', 'room_name', 'total_watts', 'saved_watts'])
        if df.empty:
            return []

        df['total_watts'] = df['total_watts'].astype(float)
        df['saved_watts'] = df['saved_watts'].astype(float)

        breakdown = df.groupby(['room_id', 'room_name']).agg({
            'total_watts': 'sum',
            'saved_watts': 'sum'
        }).reset_index()

        breakdown['savings_pct'] = (breakdown['saved_watts'] / breakdown['total_watts'] * 100).fillna(0.0)
        breakdown = breakdown.sort_values(by='saved_watts', ascending=False)

        result = []
        for i, row in enumerate(breakdown.iterrows(), start=1):
            r_data = row[1]
            result.append({
                "room_id": int(r_data['room_id']),
                "room_name": str(r_data['room_name']),
                "total_watts": float(np.round(r_data['total_watts'], 2)),
                "saved_watts": float(np.round(r_data['saved_watts'], 2)),
                "savings_pct": float(np.round(r_data['savings_pct'], 2)),
                "rank": i
            })
        return result
    except Exception as e:
        logger.error(f"❌ Error in get_savings_breakdown: {e}")
        return []
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)


def get_savings_trend(days=7) -> list:
    """
    Returns daily savings for last N days:
    Each: { date, total_watts, saved_watts, savings_pct }
    Sorted by date ASC
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT date, total_watts, saved_watts FROM energy_logs")
            rows = cur.fetchall()

        df = pd.DataFrame(rows, columns=['date', 'total_watts', 'saved_watts'])
        if df.empty:
            return []

        df['total_watts'] = df['total_watts'].astype(float)
        df['saved_watts'] = df['saved_watts'].astype(float)

        # Aggregate by date
        daily = df.groupby('date').agg({
            'total_watts': 'sum',
            'saved_watts': 'sum'
        }).reset_index()

        # Sort and take last N days
        daily = daily.sort_values(by='date', ascending=True).tail(days)
        daily['savings_pct'] = (daily['saved_watts'] / daily['total_watts'] * 100).fillna(0.0)

        result = []
        for _, row in daily.iterrows():
            result.append({
                "date": row['date'].isoformat() if hasattr(row['date'], 'isoformat') else str(row['date']),
                "total_watts": float(np.round(row['total_watts'], 2)),
                "saved_watts": float(np.round(row['saved_watts'], 2)),
                "savings_pct": float(np.round(row['savings_pct'], 2))
            })
        return result
    except Exception as e:
        logger.error(f"❌ Error in get_savings_trend: {e}")
        return []
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)


def get_yoy_comparison() -> dict:
    """
    Year-over-Year comparison:
    - current_year_total_watts
    - previous_year_total_watts  
    - yoy_change_pct
    - current_year_saved_watts
    - previous_year_saved_watts
    - yoy_savings_change_pct
    Monthly breakdown: list of { month, current_year_watts, previous_year_watts }
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT date, total_watts, saved_watts FROM energy_logs")
            rows = cur.fetchall()

        df = pd.DataFrame(rows, columns=['date', 'total_watts', 'saved_watts'])
        if df.empty:
            return {
                "current_year_total_watts": 0.0,
                "previous_year_total_watts": 0.0,
                "yoy_change_pct": 0.0,
                "current_year_saved_watts": 0.0,
                "previous_year_saved_watts": 0.0,
                "yoy_savings_change_pct": 0.0,
                "monthly_breakdown": []
            }

        df['total_watts'] = df['total_watts'].astype(float)
        df['saved_watts'] = df['saved_watts'].astype(float)
        
        # Parse date and extract year/month
        df['date'] = pd.to_datetime(df['date'])
        df['year'] = df['date'].dt.year
        df['month'] = df['date'].dt.month

        current_year = datetime.now().year
        prev_year = current_year - 1

        cy_df = df[df['year'] == current_year]
        py_df = df[df['year'] == prev_year]

        cy_total = float(cy_df['total_watts'].sum())
        py_total = float(py_df['total_watts'].sum())

        cy_saved = float(cy_df['saved_watts'].sum())
        py_saved = float(py_df['saved_watts'].sum())

        yoy_change_pct = ((cy_total - py_total) / py_total * 100) if py_total > 0 else 0.0
        yoy_savings_change_pct = ((cy_saved - py_saved) / py_saved * 100) if py_saved > 0 else 0.0

        # Monthly breakdown
        # Group by month and year
        monthly_grouped = df[df['year'].isin([current_year, prev_year])].groupby(['month', 'year'])['total_watts'].sum().unstack(fill_value=0.0).reset_index()

        # Ensure both columns exist in dataframe index/columns
        if current_year not in monthly_grouped.columns:
            monthly_grouped[current_year] = 0.0
        if prev_year not in monthly_grouped.columns:
            monthly_grouped[prev_year] = 0.0

        month_names = {
            1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
            7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
        }

        monthly_breakdown = []
        for _, row in monthly_grouped.iterrows():
            m_num = int(row['month'])
            monthly_breakdown.append({
                "month": month_names.get(m_num, str(m_num)),
                "current_year_watts": float(np.round(row[current_year], 2)),
                "previous_year_watts": float(np.round(row[prev_year], 2))
            })

        return {
            "current_year_total_watts": float(np.round(cy_total, 2)),
            "previous_year_total_watts": float(np.round(py_total, 2)),
            "yoy_change_pct": float(np.round(yoy_change_pct, 2)),
            "current_year_saved_watts": float(np.round(cy_saved, 2)),
            "previous_year_saved_watts": float(np.round(py_saved, 2)),
            "yoy_savings_change_pct": float(np.round(yoy_savings_change_pct, 2)),
            "monthly_breakdown": monthly_breakdown
        }
    except Exception as e:
        logger.error(f"❌ Error in get_yoy_comparison: {e}")
        return {}
    finally:
        if conn:
            from app.zona_loader import release_connection
            release_connection(conn)
