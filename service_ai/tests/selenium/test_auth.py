import pytest
from tests.selenium.pages.login_page import LoginPage
from tests.selenium.config import ADMIN_EMAIL, ADMIN_PASSWORD, MAHASISWA_EMAIL, MAHASISWA_PASSWORD

class TestAuth:
    def test_tc_011_login_admin_success(self, driver):
        """TC-011: Login berhasil sebagai admin"""
        login_page = LoginPage(driver)
        login_page.load()
        login_page.login(ADMIN_EMAIL, ADMIN_PASSWORD)
        login_page.wait_for_url_contains("/dashboard")
        assert "/dashboard" in driver.current_url

    def test_tc_012_login_mahasiswa_success(self, driver):
        """TC-012: Login berhasil sebagai mahasiswa"""
        login_page = LoginPage(driver)
        login_page.load()
        login_page.login(MAHASISWA_EMAIL, MAHASISWA_PASSWORD)
        login_page.wait_for_url_contains("/dashboard")
        assert "/dashboard" in driver.current_url

    @pytest.mark.parametrize("email,password", [
        (ADMIN_EMAIL, "wrongpassword"),
    ])
    def test_tc_013_login_failed_wrong_password(self, driver, email, password):
        """TC-013: Login gagal dengan password salah"""
        login_page = LoginPage(driver)
        login_page.load()
        login_page.login(email, password)
        error_msg = login_page.get_error_message()
        assert len(error_msg) > 0
        assert "/login" in driver.current_url

    def test_tc_014_login_failed_unregistered_email(self, driver):
        """TC-014: Login gagal dengan email tidak terdaftar"""
        login_page = LoginPage(driver)
        login_page.load()
        login_page.login("unknown@test.com", "password123")
        error_msg = login_page.get_error_message()
        assert len(error_msg) > 0

    def test_tc_015_redirect_to_login_without_auth(self, driver):
        """TC-015: Redirect ke login jika akses halaman tanpa auth"""
        driver.get("http://localhost:3000/dashboard")
        login_page = LoginPage(driver)
        login_page.wait_for_url_contains("/login")
        assert "/login" in driver.current_url
