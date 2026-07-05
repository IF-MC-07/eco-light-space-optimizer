import pytest
from tests.selenium.pages.base_page import BasePage

class TestRBAC:
    def test_tc_mahasiswa_access_admin_page(self, logged_in_mahasiswa):
        """Mahasiswa coba akses halaman admin — verifikasi redirect/block"""
        driver = logged_in_mahasiswa
        driver.get("http://localhost:3000/automation")
        
        base_page = BasePage(driver)
        # Should redirect to dashboard since mahasiswa doesn't have access to /automation
        base_page.wait_for_url_contains("/dashboard")
        assert "/dashboard" in driver.current_url
        
    def test_tc_access_protected_without_login(self, driver):
        """Akses halaman protected tanpa login — verifikasi redirect ke /login"""
        driver.get("http://localhost:3000/automation")
        
        base_page = BasePage(driver)
        base_page.wait_for_url_contains("/login")
        assert "/login" in driver.current_url
