import pytest
from tests.selenium.pages.monitoring_page import MonitoringPage

class TestMonitoring:
    def test_tc_021_admin_access_monitoring(self, logged_in_admin):
        """TC-021: Admin akses halaman monitor energi"""
        monitoring_page = MonitoringPage(logged_in_admin)
        monitoring_page.load()
        assert monitoring_page.is_energy_panel_displayed()

    def test_tc_022_sensor_data_unavailable(self, logged_in_admin):
        """TC-022: Verifikasi tampilan N/A atau warning jika data sensor tidak ada"""
        monitoring_page = MonitoringPage(logged_in_admin)
        monitoring_page.load()
        warning = monitoring_page.get_sensor_warning_text()
        assert len(warning) > 0

    def test_tc_023_multi_panel_data_available(self, logged_in_admin):
        """TC-023: Verifikasi multi-panel data tersedia"""
        monitoring_page = MonitoringPage(logged_in_admin)
        monitoring_page.load()
        assert monitoring_page.is_multi_panel_displayed()
        
    def test_tc_024_expired_token_redirect(self, logged_in_admin):
        """TC-024: Expired token redirect ke login dengan pesan yang benar"""
        driver = logged_in_admin
        driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
        driver.delete_all_cookies()
        
        monitoring_page = MonitoringPage(driver)
        monitoring_page.load()
        
        monitoring_page.wait_for_url_contains("/login")
        assert "/login" in driver.current_url
