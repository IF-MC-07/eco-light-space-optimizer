import pytest
from selenium import webdriver
from selenium.webdriver.edge.options import Options as EdgeOptions
from tests.selenium.pages.login_page import LoginPage
from tests.selenium.config import ADMIN_EMAIL, ADMIN_PASSWORD, MAHASISWA_EMAIL, MAHASISWA_PASSWORD

@pytest.fixture(scope="function")
def driver():
    """Inisialisasi dan teardown WebDriver."""
    edge_options = EdgeOptions()
    # edge_options.add_argument("--headless") # Uncomment untuk headless mode
    edge_options.add_argument("--no-sandbox")
    edge_options.add_argument("--disable-dev-shm-usage")
    edge_options.add_argument("--window-size=1920,1080")
    
    driver = webdriver.Edge(options=edge_options)
    driver.implicitly_wait(10)
    
    yield driver
    
    driver.quit()

@pytest.fixture(scope="function")
def logged_in_admin(driver):
    """Fixture untuk driver yang sudah login sebagai admin."""
    login_page = LoginPage(driver)
    login_page.load()
    login_page.login(ADMIN_EMAIL, ADMIN_PASSWORD)
    login_page.wait_for_url_contains("/dashboard")
    yield driver

@pytest.fixture(scope="function")
def logged_in_mahasiswa(driver):
    """Fixture untuk driver yang sudah login sebagai mahasiswa."""
    login_page = LoginPage(driver)
    login_page.load()
    login_page.login(MAHASISWA_EMAIL, MAHASISWA_PASSWORD)
    login_page.wait_for_url_contains("/dashboard")
    yield driver

@pytest.fixture(scope="function")
def api_create_test_schedule():
    """Setup via API untuk membuat jadwal (contoh pre-existing data)."""
    yield None
