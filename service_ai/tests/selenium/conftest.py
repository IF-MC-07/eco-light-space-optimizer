import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from tests.pages.login_page import LoginPage
from tests.config import ADMIN_EMAIL, ADMIN_PASSWORD, MAHASISWA_EMAIL, MAHASISWA_PASSWORD

@pytest.fixture(scope="function")
def driver():
    """Inisialisasi dan teardown WebDriver."""
    chrome_options = Options()
    # chrome_options.add_argument("--headless") # Uncomment untuk headless mode
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    
    driver = webdriver.Chrome(options=chrome_options)
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
    login_page.wait_for_url_contains("/student/dashboard")
    yield driver

@pytest.fixture(scope="function")
def api_create_test_schedule():
    """Setup via API untuk membuat jadwal (contoh pre-existing data)."""
    import requests
    from tests.config import API_URL, ADMIN_EMAIL, ADMIN_PASSWORD
    
    res = requests.post(f"{API_URL}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    token = res.json().get("token")
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"room": "A101", "start_time": "08:00", "end_time": "10:00"}
    create_res = requests.post(f"{API_URL}/schedules", json=payload, headers=headers)
    schedule_id = create_res.json().get("data", {}).get("id")
    
    yield schedule_id
    
    if schedule_id:
        requests.delete(f"{API_URL}/schedules/{schedule_id}", headers=headers)
