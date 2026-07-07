import pytest
from unittest.mock import patch, MagicMock

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.zona_loader import ambil_zona_dari_db, titik_di_zona

class TestZonaLoader:
    @patch('app.zona_loader.get_db_connection')
    def test_ambil_zona_dari_db(self, mock_get_db):
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_get_db.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur

        # Simulasi data DB (satu aktif, satu tidak aktif/koordinat cacat)
        mock_cur.fetchall.return_value = [
            {'zone_id': 1, 'zone_name': 'Z1', 'x1_pct': 0.1, 'y1_pct': 0.1, 'x2_pct': 0.5, 'y2_pct': 0.5, 'color': '#fff'},
            # Di implementasi aktual, query mungkin sudah memfilter 'aktif'. 
            # Kita uji parsing dan strukturnya di sini.
        ]

        zones = ambil_zona_dari_db('cam1')

        assert len(zones) == 1
        z = zones[0]
        assert z['zone_name'] == 'Z1'
        
        # Pastikan koordinat ada di range 0.0 - 1.0
        assert 0.0 <= z['x1_pct'] <= 1.0
        assert 0.0 <= z['y1_pct'] <= 1.0
        assert 0.0 <= z['x2_pct'] <= 1.0
        assert 0.0 <= z['y2_pct'] <= 1.0

    def test_titik_di_zona(self):
        zone = {
            'x1_pct': 0.2, 'y1_pct': 0.2,
            'x2_pct': 0.8, 'y2_pct': 0.8
        }
        
        # Titik di dalam zona
        assert titik_di_zona(0.5, 0.5, zone) is True
        assert titik_di_zona(0.201, 0.201, zone) is True  # Slightly inside case

        # Titik di luar zona
        assert titik_di_zona(0.1, 0.5, zone) is False
        assert titik_di_zona(0.5, 0.9, zone) is False
        assert titik_di_zona(0.9, 0.9, zone) is False
