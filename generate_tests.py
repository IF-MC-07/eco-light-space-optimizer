import os

base_dir = r"c:\Users\User\OneDrive\Documents\3312411050\SEMESTER 4\IF-MC-07\Eco-light-Space-Optimizer\eco-light-space-optimizer\tests"
os.makedirs(os.path.join(base_dir, "pages"), exist_ok=True)

files = {
    "requirements.txt": """pytest==8.0.0
selenium==4.17.2
pytest-html==4.1.1
requests==2.31.0
python-dotenv==1.0.1
""",
    "config.py": """import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
API_URL = os.getenv("API_URL", "http://localhost:5000/api")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@ecolight.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

MAHASISWA_EMAIL = os.getenv("MAHASISWA_EMAIL", "mahasiswa@test.com")
MAHASISWA_PASSWORD = os.getenv("MAHASISWA_PASSWORD", "mhs123")
""",
    "conftest.py": """import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from tests.pages.login_page import LoginPage
from tests.config import ADMIN_EMAIL, ADMIN_PASSWORD, MAHASISWA_EMAIL, MAHASISWA_PASSWORD

@pytest.fixture(scope="function")
def driver():
    \"\"\"Inisialisasi dan teardown WebDriver.\"\"\"
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
    \"\"\"Fixture untuk driver yang sudah login sebagai admin.\"\"\"
    login_page = LoginPage(driver)
    login_page.load()
    login_page.login(ADMIN_EMAIL, ADMIN_PASSWORD)
    login_page.wait_for_url_contains("/dashboard")
    yield driver

@pytest.fixture(scope="function")
def logged_in_mahasiswa(driver):
    \"\"\"Fixture untuk driver yang sudah login sebagai mahasiswa.\"\"\"
    login_page = LoginPage(driver)
    login_page.load()
    login_page.login(MAHASISWA_EMAIL, MAHASISWA_PASSWORD)
    login_page.wait_for_url_contains("/student/dashboard")
    yield driver

@pytest.fixture(scope="function")
def api_create_test_schedule():
    \"\"\"Setup via API untuk membuat jadwal (contoh pre-existing data).\"\"\"
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
""",
    "pages/__init__.py": "",
    "pages/base_page.py": """from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from tests.config import BASE_URL

class BasePage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)
        self.base_url = BASE_URL

    def open_url(self, path):
        self.driver.get(f"{self.base_url}{path}")

    def find_element(self, locator):
        return self.wait.until(EC.presence_of_element_located(locator))

    def click_element(self, locator):
        element = self.wait.until(EC.element_to_be_clickable(locator))
        element.click()

    def enter_text(self, locator, text):
        element = self.find_element(locator)
        element.clear()
        element.send_keys(text)

    def get_text(self, locator):
        return self.find_element(locator).text

    def wait_for_url_contains(self, text):
        self.wait.until(EC.url_contains(text))

    def is_element_displayed(self, locator):
        try:
            return self.find_element(locator).is_displayed()
        except TimeoutException:
            return False
""",
    "pages/login_page.py": """from selenium.webdriver.common.by import By
from tests.pages.base_page import BasePage

class LoginPage(BasePage):
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[data-testid='email-input']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[data-testid='password-input']")
    SUBMIT_BUTTON = (By.CSS_SELECTOR, "button[data-testid='login-button']")
    ERROR_MESSAGE = (By.CSS_SELECTOR, "[data-testid='login-error']")

    def load(self):
        self.open_url("/login")

    def login(self, email, password):
        self.enter_text(self.EMAIL_INPUT, email)
        self.enter_text(self.PASSWORD_INPUT, password)
        self.click_element(self.SUBMIT_BUTTON)

    def get_error_message(self):
        return self.get_text(self.ERROR_MESSAGE)
""",
    "pages/dashboard_page.py": """from selenium.webdriver.common.by import By
from tests.pages.base_page import BasePage

class DashboardPage(BasePage):
    LIGHT_TOGGLE_ON = (By.CSS_SELECTOR, "button[data-testid='light-toggle-on']")
    LIGHT_TOGGLE_OFF = (By.CSS_SELECTOR, "button[data-testid='light-toggle-off']")
    AC_TEMP_SLIDER = (By.CSS_SELECTOR, "input[data-testid='ac-temp-slider']")
    TOAST_MESSAGE = (By.CSS_SELECTOR, "[data-testid='toast-message']")

    def toggle_light_on(self):
        self.click_element(self.LIGHT_TOGGLE_ON)

    def toggle_light_off(self):
        self.click_element(self.LIGHT_TOGGLE_OFF)

    def set_ac_temperature(self, temp: int):
        self.enter_text(self.AC_TEMP_SLIDER, str(temp))
        self.click_element((By.TAG_NAME, "body"))

    def get_toast_message(self):
        return self.get_text(self.TOAST_MESSAGE)
""",
    "pages/schedule_page.py": """from selenium.webdriver.common.by import By
from tests.pages.base_page import BasePage

class SchedulePage(BasePage):
    NEW_SCHEDULE_BUTTON = (By.CSS_SELECTOR, "button[data-testid='btn-new-schedule']")
    ROOM_INPUT = (By.CSS_SELECTOR, "input[data-testid='input-room']")
    START_TIME_INPUT = (By.CSS_SELECTOR, "input[data-testid='input-start-time']")
    END_TIME_INPUT = (By.CSS_SELECTOR, "input[data-testid='input-end-time']")
    SAVE_BUTTON = (By.CSS_SELECTOR, "button[data-testid='btn-save-schedule']")
    TOAST_MESSAGE = (By.CSS_SELECTOR, "[data-testid='toast-message']")
    ERROR_MESSAGE = (By.CSS_SELECTOR, "[data-testid='schedule-error']")
    DELETE_BUTTONS = (By.CSS_SELECTOR, "button[data-testid^='btn-delete-schedule']")

    def load(self):
        self.open_url("/admin/schedules")

    def click_new_schedule(self):
        self.click_element(self.NEW_SCHEDULE_BUTTON)

    def fill_schedule_form(self, room, start_time, end_time):
        if room: self.enter_text(self.ROOM_INPUT, room)
        if start_time: self.enter_text(self.START_TIME_INPUT, start_time)
        if end_time: self.enter_text(self.END_TIME_INPUT, end_time)
            
    def submit_form(self):
        self.click_element(self.SAVE_BUTTON)

    def delete_first_schedule(self):
        self.click_element(self.DELETE_BUTTONS)

    def get_toast_message(self):
        return self.get_text(self.TOAST_MESSAGE)

    def get_error_message(self):
        return self.get_text(self.ERROR_MESSAGE)
""",
    "pages/device_page.py": """from selenium.webdriver.common.by import By
from tests.pages.base_page import BasePage

class DevicePage(BasePage):
    ADD_DEVICE_BTN = (By.CSS_SELECTOR, "button[data-testid='btn-add-device']")
    DEVICE_TYPE_SELECT = (By.CSS_SELECTOR, "select[data-testid='select-device-type']")
    NAME_INPUT = (By.CSS_SELECTOR, "input[data-testid='input-device-name']")
    ZONE_SELECT = (By.CSS_SELECTOR, "select[data-testid='select-zone']")
    RELAY_CHANNEL_INPUT = (By.CSS_SELECTOR, "input[data-testid='input-relay-channel']")
    IP_ADDRESS_INPUT = (By.CSS_SELECTOR, "input[data-testid='input-ip-address']")
    SUBMIT_BTN = (By.CSS_SELECTOR, "button[data-testid='btn-submit-device']")
    INLINE_ERROR = (By.CSS_SELECTOR, "[data-testid='inline-error']")
    TOAST_MESSAGE = (By.CSS_SELECTOR, "[data-testid='toast-message']")

    def load(self):
        self.open_url("/admin/devices")

    def click_add_device(self):
        self.click_element(self.ADD_DEVICE_BTN)

    def select_device_type(self, dev_type):
        self.enter_text(self.DEVICE_TYPE_SELECT, dev_type)

    def fill_light_form(self, name, zone, relay_channel):
        self.enter_text(self.NAME_INPUT, name)
        self.enter_text(self.ZONE_SELECT, zone)
        self.enter_text(self.RELAY_CHANNEL_INPUT, str(relay_channel))

    def fill_camera_form(self, name, zone, ip_address):
        self.enter_text(self.NAME_INPUT, name)
        self.enter_text(self.ZONE_SELECT, zone)
        self.enter_text(self.IP_ADDRESS_INPUT, ip_address)

    def submit_form(self):
        self.click_element(self.SUBMIT_BTN)

    def get_inline_error(self):
        return self.get_text(self.INLINE_ERROR)

    def get_toast_message(self):
        return self.get_text(self.TOAST_MESSAGE)
""",
    "pages/monitoring_page.py": """from selenium.webdriver.common.by import By
from tests.pages.base_page import BasePage

class MonitoringPage(BasePage):
    ENERGY_PANEL = (By.CSS_SELECTOR, "[data-testid='energy-panel']")
    SENSOR_WARNING = (By.CSS_SELECTOR, "[data-testid='sensor-warning']")
    MULTI_PANEL_CONTAINER = (By.CSS_SELECTOR, "[data-testid='multi-panel-container']")

    def load(self):
        self.open_url("/admin/monitoring")

    def is_energy_panel_displayed(self):
        return self.is_element_displayed(self.ENERGY_PANEL)

    def get_sensor_warning_text(self):
        return self.get_text(self.SENSOR_WARNING)

    def is_multi_panel_displayed(self):
        return self.is_element_displayed(self.MULTI_PANEL_CONTAINER)
""",
    "test_auth.py": """import pytest
from tests.pages.login_page import LoginPage
from tests.config import ADMIN_EMAIL, ADMIN_PASSWORD, MAHASISWA_EMAIL, MAHASISWA_PASSWORD

class TestAuth:
    def test_tc_011_login_admin_success(self, driver):
        \"\"\"TC-011: Login berhasil sebagai admin\"\"\"
        login_page = LoginPage(driver)
        login_page.load()
        login_page.login(ADMIN_EMAIL, ADMIN_PASSWORD)
        login_page.wait_for_url_contains("/admin/dashboard")
        assert "/admin/dashboard" in driver.current_url

    def test_tc_012_login_mahasiswa_success(self, driver):
        \"\"\"TC-012: Login berhasil sebagai mahasiswa\"\"\"
        login_page = LoginPage(driver)
        login_page.load()
        login_page.login(MAHASISWA_EMAIL, MAHASISWA_PASSWORD)
        login_page.wait_for_url_contains("/student/dashboard")
        assert "/student/dashboard" in driver.current_url

    @pytest.mark.parametrize("email,password", [
        (ADMIN_EMAIL, "wrongpassword"),
    ])
    def test_tc_013_login_failed_wrong_password(self, driver, email, password):
        \"\"\"TC-013: Login gagal dengan password salah\"\"\"
        login_page = LoginPage(driver)
        login_page.load()
        login_page.login(email, password)
        error_msg = login_page.get_error_message()
        assert "password" in error_msg.lower() or "kredensial" in error_msg.lower() or "invalid" in error_msg.lower()
        assert "/login" in driver.current_url

    def test_tc_014_login_failed_unregistered_email(self, driver):
        \"\"\"TC-014: Login gagal dengan email tidak terdaftar\"\"\"
        login_page = LoginPage(driver)
        login_page.load()
        login_page.login("unknown@test.com", "password123")
        error_msg = login_page.get_error_message()
        assert "email" in error_msg.lower() or "not found" in error_msg.lower() or "tidak terdaftar" in error_msg.lower()

    def test_tc_015_redirect_to_login_without_auth(self, driver):
        \"\"\"TC-015: Redirect ke login jika akses halaman tanpa auth\"\"\"
        driver.get("http://localhost:3000/admin/dashboard")
        login_page = LoginPage(driver)
        login_page.wait_for_url_contains("/login")
        assert "/login" in driver.current_url
""",
    "test_schedule.py": """import pytest
from tests.pages.schedule_page import SchedulePage

class TestSchedule:
    def test_tc_001_create_schedule_success(self, logged_in_admin):
        \"\"\"TC-001: Berhasil membuat jadwal baru dengan data valid\"\"\"
        schedule_page = SchedulePage(logged_in_admin)
        schedule_page.load()
        schedule_page.click_new_schedule()
        schedule_page.fill_schedule_form("A101", "08:00", "10:00")
        schedule_page.submit_form()
        toast = schedule_page.get_toast_message()
        assert "berhasil" in toast.lower() or "added" in toast.lower()

    def test_tc_002_create_schedule_fail_end_time_earlier(self, logged_in_admin):
        \"\"\"TC-002: Gagal membuat jadwal karena jam selesai lebih awal\"\"\"
        schedule_page = SchedulePage(logged_in_admin)
        schedule_page.load()
        schedule_page.click_new_schedule()
        schedule_page.fill_schedule_form("A101", "10:00", "08:00")
        schedule_page.submit_form()
        error = schedule_page.get_error_message()
        assert "lebih awal" in error.lower() or "before" in error.lower() or "invalid" in error.lower()

    def test_tc_003_delete_schedule_success(self, logged_in_admin, api_create_test_schedule):
        \"\"\"TC-003: Berhasil menghapus jadwal\"\"\"
        schedule_page = SchedulePage(logged_in_admin)
        schedule_page.load()
        schedule_page.delete_first_schedule()
        toast = schedule_page.get_toast_message()
        assert "hapus" in toast.lower() or "deleted" in toast.lower()

    def test_tc_004_create_schedule_fail_empty_room(self, logged_in_admin):
        \"\"\"TC-004: Gagal membuat jadwal karena field ruangan kosong\"\"\"
        schedule_page = SchedulePage(logged_in_admin)
        schedule_page.load()
        schedule_page.click_new_schedule()
        schedule_page.fill_schedule_form("", "08:00", "10:00")
        schedule_page.submit_form()
        error = schedule_page.get_error_message()
        assert "kosong" in error.lower() or "required" in error.lower() or "wajib" in error.lower()
""",
    "test_device.py": """import pytest
from tests.pages.device_page import DevicePage
from tests.pages.dashboard_page import DashboardPage

class TestDeviceAndControl:
    def test_tc_admin_toggle_light_on(self, logged_in_admin):
        \"\"\"Admin toggle lampu ON via dashboard\"\"\"
        dashboard = DashboardPage(logged_in_admin)
        dashboard.toggle_light_on()
        toast = dashboard.get_toast_message()
        assert "menyala" in toast.lower() or "on" in toast.lower() or "berhasil" in toast.lower()

    def test_tc_admin_change_ac_temp(self, logged_in_admin):
        \"\"\"Admin ubah suhu target AC\"\"\"
        dashboard = DashboardPage(logged_in_admin)
        dashboard.set_ac_temperature(22)
        toast = dashboard.get_toast_message()
        assert "suhu" in toast.lower() or "updated" in toast.lower() or "berhasil" in toast.lower()

    def test_tc_admin_add_light_device(self, logged_in_admin):
        \"\"\"Admin tambah device baru (LIGHT)\"\"\"
        device_page = DevicePage(logged_in_admin)
        device_page.load()
        device_page.click_add_device()
        device_page.select_device_type("LIGHT")
        device_page.fill_light_form("Lampu Test", "Zona A", 1)
        device_page.submit_form()
        toast = device_page.get_toast_message()
        assert "berhasil" in toast.lower() or "added" in toast.lower()

    def test_tc_admin_add_camera_valid(self, logged_in_admin):
        \"\"\"Admin tambah kamera dengan IP address valid\"\"\"
        device_page = DevicePage(logged_in_admin)
        device_page.load()
        device_page.click_add_device()
        device_page.select_device_type("CAMERA")
        device_page.fill_camera_form("Kamera Test", "Zona A", "192.168.1.100")
        device_page.submit_form()
        toast = device_page.get_toast_message()
        assert "berhasil" in toast.lower() or "added" in toast.lower()

    def test_tc_admin_add_camera_invalid_ip(self, logged_in_admin):
        \"\"\"Admin tambah kamera dengan IP address invalid\"\"\"
        device_page = DevicePage(logged_in_admin)
        device_page.load()
        device_page.click_add_device()
        device_page.select_device_type("CAMERA")
        device_page.fill_camera_form("Kamera Invalid", "Zona A", "invalid_ip_format")
        device_page.submit_form()
        error = device_page.get_inline_error()
        assert "format" in error.lower() or "invalid" in error.lower()
""",
    "test_rbac.py": """import pytest
from tests.pages.base_page import BasePage

class TestRBAC:
    def test_tc_mahasiswa_access_admin_page(self, logged_in_mahasiswa):
        \"\"\"Mahasiswa coba akses halaman admin — verifikasi redirect/block\"\"\"
        driver = logged_in_mahasiswa
        driver.get("http://localhost:3000/admin/dashboard")
        
        base_page = BasePage(driver)
        base_page.wait_for_url_contains("/student/dashboard")
        assert "/student/dashboard" in driver.current_url
        
    def test_tc_access_protected_without_login(self, driver):
        \"\"\"Akses halaman protected tanpa login — verifikasi redirect ke /login\"\"\"
        driver.get("http://localhost:3000/admin/devices")
        
        base_page = BasePage(driver)
        base_page.wait_for_url_contains("/login")
        assert "/login" in driver.current_url
""",
    "test_monitoring.py": """import pytest
from tests.pages.monitoring_page import MonitoringPage

class TestMonitoring:
    def test_tc_021_admin_access_monitoring(self, logged_in_admin):
        \"\"\"TC-021: Admin akses halaman monitor energi\"\"\"
        monitoring_page = MonitoringPage(logged_in_admin)
        monitoring_page.load()
        assert monitoring_page.is_energy_panel_displayed()

    def test_tc_022_sensor_data_unavailable(self, logged_in_admin):
        \"\"\"TC-022: Verifikasi tampilan N/A atau warning jika data sensor tidak ada\"\"\"
        monitoring_page = MonitoringPage(logged_in_admin)
        monitoring_page.load()
        warning = monitoring_page.get_sensor_warning_text()
        assert "n/a" in warning.lower() or "data" in warning.lower() or "warning" in warning.lower()

    def test_tc_023_multi_panel_data_available(self, logged_in_admin):
        \"\"\"TC-023: Verifikasi multi-panel data tersedia\"\"\"
        monitoring_page = MonitoringPage(logged_in_admin)
        monitoring_page.load()
        assert monitoring_page.is_multi_panel_displayed()
        
    def test_tc_024_expired_token_redirect(self, logged_in_admin):
        \"\"\"TC-024: Expired token redirect ke login dengan pesan yang benar\"\"\"
        driver = logged_in_admin
        driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
        driver.delete_all_cookies()
        
        monitoring_page = MonitoringPage(driver)
        monitoring_page.load()
        
        monitoring_page.wait_for_url_contains("/login")
        assert "/login" in driver.current_url
""",
    "README.md": """# Panduan E2E Testing - Eco-Light & AC Space Optimizer

Folder ini berisi suite otomatisasi tes End-to-End (E2E) menggunakan **Python**, **pytest**, dan **Selenium WebDriver**. Struktur diatur menggunakan pola **Page Object Model (POM)**.

## Persiapan Lingkungan (Setup)

1. Pastikan Anda sudah menginstal Python (>= 3.9) dan Chrome browser.
2. Buka terminal di folder project utama.
3. Buat virtual environment dan aktifkan:
   ```bash
   python -m venv venv
   # Di Windows:
   venv\\Scripts\\activate
   # Di Linux/Mac:
   source venv/bin/activate
   ```
4. Instal semua dependensi:
   ```bash
   pip install -r tests/requirements.txt
   ```
5. Sesuaikan variabel kredensial. Anda dapat membuat file `.env` di dalam folder `tests/` dengan variabel:
   ```env
   BASE_URL=http://localhost:3000
   API_URL=http://localhost:5000/api
   ADMIN_EMAIL=admin@ecolight.com
   ADMIN_PASSWORD=admin123
   MAHASISWA_EMAIL=mahasiswa@test.com
   MAHASISWA_PASSWORD=mhs123
   ```
   *(Pastikan kredensial di atas valid di database lokal Anda)*.

## Atribut `data-testid` yang Diperlukan di Frontend
Banyak tes mengandalkan selector yang stabil yaitu `data-testid`. Pastikan komponen React Next.js Anda sudah memiliki atribut berikut:
- **Login Form**: `data-testid="email-input"`, `data-testid="password-input"`, `data-testid="login-button"`, `data-testid="login-error"`
- **Dashboard**: `data-testid="light-toggle-on"`, `data-testid="light-toggle-off"`, `data-testid="ac-temp-slider"`
- **Schedules**: `data-testid="btn-new-schedule"`, `data-testid="input-room"`, `data-testid="input-start-time"`, `data-testid="input-end-time"`, `data-testid="btn-save-schedule"`, `data-testid="schedule-error"`, `data-testid="btn-delete-schedule"`
- **Devices**: `data-testid="btn-add-device"`, `data-testid="select-device-type"`, `data-testid="input-device-name"`, `data-testid="select-zone"`, `data-testid="input-relay-channel"`, `data-testid="input-ip-address"`, `data-testid="btn-submit-device"`, `data-testid="inline-error"`
- **Monitoring**: `data-testid="energy-panel"`, `data-testid="sensor-warning"`, `data-testid="multi-panel-container"`
- **Global**: `data-testid="toast-message"`

## Cara Menjalankan Test

### Menjalankan Seluruh Test Case
```bash
pytest tests/
```

### Menjalankan Test per File/Kategori
```bash
# Test Autentikasi
pytest tests/test_auth.py

# Test Jadwal
pytest tests/test_schedule.py

# Test Manajemen Device dan Kontrol
pytest tests/test_device.py
```

### Menjalankan dengan Report HTML (pytest-html)
Plugin `pytest-html` otomatis menghasilkan file laporan interaktif yang mudah dibaca.
```bash
pytest tests/ --html=report.html --self-contained-html
```
File `report.html` akan terbentuk. Buka file tersebut di browser untuk melihat statistik PASS/FAIL dan log error.
"""
}

for filepath, content in files.items():
    full_path = os.path.join(base_dir, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
print("Files generated successfully.")
