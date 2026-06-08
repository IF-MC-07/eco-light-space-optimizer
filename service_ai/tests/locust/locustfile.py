import os
import random
from locust import HttpUser, task, between, events
from locust.runners import MasterRunner, LocalRunner

# Digunakan sebagai fallback jika response /api/monitoring/devices kosong
MOCK_DEVICE_IDS = ["dev-01", "dev-02", "dev-03"]

# Gunakan token dari environment variable agar kita tidak terkena rate limit login (10 req/15 mnt) 
# akibat 50 concurrent users yang login bersamaan.
GLOBAL_TEST_TOKEN = os.environ.get("TEST_TOKEN", "")

class BaseUser(HttpUser):
    wait_time = between(1, 3)
    host = "http://localhost:5000"
    
    def on_start(self):
        """Dijalankan di awal sebelum task dimulai. Login otomatis dan simpan token."""
        self.token = GLOBAL_TEST_TOKEN
        self.headers = {"Content-Type": "application/json"}
        self.device_ids = []
        
        # Jika tidak ada token global, lakukan login
        if not self.token:
            self.login()
            
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"

    def login(self):
        """Melakukan otentikasi untuk mendapatkan JWT token"""
        payload = {
            "email": "admin@example.com",  # Ganti dengan email test yang valid
            "password": "password123"      # Ganti dengan password test yang valid
        }
        with self.client.post("/api/auth/login", name="POST Login", json=payload, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token") or (data.get("data", {})).get("token", "")
                response.success()
            else:
                response.failure(f"Login Gagal. Status {response.status_code}: {response.text[:100]}")

    def get_with_validation(self, name, url, timeout=3.5):
        """Helper function untuk GET request dengan validasi performa & error"""
        with self.client.get(url, name=name, headers=self.headers, catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Status {response.status_code}: {response.text[:100]}")
            elif response.elapsed.total_seconds() > timeout:
                response.failure(f"Terlalu lambat: {response.elapsed.total_seconds():.2f}s")
            else:
                response.success()
            return response

class MahasiswaUser(BaseUser):
    """Simulasi Mahasiswa: akses read-only. Weight: 80% (4 dari 5)"""
    weight = 4

    @task(1)
    def task_login(self):
        # login (jarang, hanya di awal sesi) - simulasi token refresh / reconnect
        if not GLOBAL_TEST_TOKEN:
            self.login()

    @task(5)
    def view_devices(self):
        # Paling sering (Dashboard real-time)
        self.get_with_validation("GET Devices", "/api/monitoring/devices")

    @task(4)
    def view_sensors(self):
        # Sering (Monitoring energi)
        self.get_with_validation("GET Sensor", "/api/monitoring/sensor")
        
    @task(2)
    def view_dashboard(self):
        # Sedang (Overview laporan mahasiswa)
        self.get_with_validation("GET Dashboard", "/api/dashboard/summary")

class AdminUser(BaseUser):
    """Simulasi Admin Fasilitas: akses penuh termasuk kontrol. Weight: 20% (1 dari 5)"""
    weight = 1

    @task(1)
    def task_login(self):
        if not GLOBAL_TEST_TOKEN:
            self.login()

    @task(5)
    def view_devices(self):
        # Akses devices sekaligus mengambil data ID untuk task toggle_device
        with self.client.get("/api/monitoring/devices", name="GET Devices", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                if response.elapsed.total_seconds() > 3.5:
                    response.failure(f"Terlalu lambat: {response.elapsed.total_seconds():.2f}s")
                else:
                    response.success()
                    try:
                        # Parsing JSON untuk mendapatkan real ID dari DB
                        data = response.json()
                        devices = data if isinstance(data, list) else data.get("data", [])
                        if devices:
                            ids = [str(d.get("id") or d.get("_id")) for d in devices if (d.get("id") or d.get("_id"))]
                            if ids:
                                self.device_ids = ids
                    except Exception:
                        pass
            else:
                response.failure(f"Status {response.status_code}: {response.text[:100]}")

    @task(4)
    def view_sensors(self):
        self.get_with_validation("GET Sensor", "/api/monitoring/sensor")

    @task(3)
    def view_savings(self):
        self.get_with_validation("GET Savings", "/api/savings/summary")

    @task(2)
    def view_dashboard(self):
        self.get_with_validation("GET Dashboard", "/api/dashboard/summary")

    @task(1)
    def view_schedules(self):
        self.get_with_validation("GET Schedules", "/api/automation-schedules")

    @task(2)
    def toggle_device(self):
        # Gunakan ID asli dari GET devices jika ada, kalau tidak pakai fallback dummy data
        device_id = random.choice(self.device_ids) if self.device_ids else random.choice(MOCK_DEVICE_IDS)
        payload = {"status": random.choice(["on", "off"])}
        url = f"/api/monitoring/devices/{device_id}"
        
        with self.client.put(url, name="PUT Toggle Device", json=payload, headers=self.headers, catch_response=True) as response:
            if response.status_code not in [200, 201]:
                response.failure(f"Status {response.status_code}: {response.text[:100]}")
            elif response.elapsed.total_seconds() > 3.5:
                response.failure(f"Terlalu lambat: {response.elapsed.total_seconds():.2f}s")
            else:
                response.success()

# --- Custom Metrics & Assertions ---
@events.quitting.add_listener
def check_performance_targets(environment, **kwargs):
    # Memastikan metrics dicek di local atau master runner (bukan worker instance)
    if isinstance(environment.runner, (MasterRunner, LocalRunner)) or environment.runner is None:
        stats = environment.runner.stats.total
        failures = []
        
        # Pengecekan target metrics dari test plan
        if stats.avg_response_time > 2000:
            failures.append(f"AVG response time {stats.avg_response_time:.0f}ms > 2000ms")
        
        p95 = stats.get_response_time_percentile(0.95)
        if p95 and p95 > 3500:
            failures.append(f"P95 {p95:.0f}ms > 3500ms")
            
        if stats.fail_ratio > 0.01:
            failures.append(f"Failure rate {stats.fail_ratio:.2%} > 1%")
            
        print("\n" + "="*50)
        if failures:
            print("❌ PERFORMANCE TEST FAILED:")
            for f in failures:
                print(f"  ✗ {f}")
            environment.process_exit_code = 1
        else:
            print("✅ PERFORMANCE TEST PASSED ✓")
            print(f"  • Total Requests: {stats.num_requests}")
            print(f"  • AVG Response Time: {stats.avg_response_time:.0f}ms")
            if p95:
                print(f"  • P95 Response Time: {p95:.0f}ms")
            print(f"  • Failure Rate: {stats.fail_ratio:.2%}")
        print("="*50 + "\n")
