import pytest
from tests.pages.device_page import DevicePage
from tests.pages.dashboard_page import DashboardPage

class TestDeviceAndControl:
    def test_tc_admin_toggle_light_on(self, logged_in_admin):
        """Admin toggle lampu ON via dashboard"""
        dashboard = DashboardPage(logged_in_admin)
        dashboard.toggle_light_on()
        toast = dashboard.get_toast_message()
        assert "menyala" in toast.lower() or "on" in toast.lower() or "berhasil" in toast.lower()

    def test_tc_admin_change_ac_temp(self, logged_in_admin):
        """Admin ubah suhu target AC"""
        dashboard = DashboardPage(logged_in_admin)
        dashboard.set_ac_temperature(22)
        toast = dashboard.get_toast_message()
        assert "suhu" in toast.lower() or "updated" in toast.lower() or "berhasil" in toast.lower()

    def test_tc_admin_add_light_device(self, logged_in_admin):
        """Admin tambah device baru (LIGHT)"""
        device_page = DevicePage(logged_in_admin)
        device_page.load()
        device_page.click_add_device()
        device_page.select_device_type("LIGHT")
        device_page.fill_light_form("Lampu Test", "Zona A", 1)
        device_page.submit_form()
        toast = device_page.get_toast_message()
        assert "berhasil" in toast.lower() or "added" in toast.lower()

    def test_tc_admin_add_camera_valid(self, logged_in_admin):
        """Admin tambah kamera dengan IP address valid"""
        device_page = DevicePage(logged_in_admin)
        device_page.load()
        device_page.click_add_device()
        device_page.select_device_type("CAMERA")
        device_page.fill_camera_form("Kamera Test", "Zona A", "192.168.1.100")
        device_page.submit_form()
        toast = device_page.get_toast_message()
        assert "berhasil" in toast.lower() or "added" in toast.lower()

    def test_tc_admin_add_camera_invalid_ip(self, logged_in_admin):
        """Admin tambah kamera dengan IP address invalid"""
        device_page = DevicePage(logged_in_admin)
        device_page.load()
        device_page.click_add_device()
        device_page.select_device_type("CAMERA")
        device_page.fill_camera_form("Kamera Invalid", "Zona A", "invalid_ip_format")
        device_page.submit_form()
        error = device_page.get_inline_error()
        assert "format" in error.lower() or "invalid" in error.lower()
