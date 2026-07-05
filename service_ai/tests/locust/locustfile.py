from locust import HttpUser, task, between

class EcoLightWebUser(HttpUser):
    # Waktu tunggu simulasi user (1 hingga 3 detik antar task)
    wait_time = between(1, 3)
    
    # Ganti dengan email & password admin yang ada di database Anda
    EMAIL = "admin@ecolight.com"
    PASSWORD = "Admin@12345"

    def on_start(self):
        """Inisialisasi header dan login saat user virtual mulai berjalan."""
        # Menambahkan header untuk membypass Rate Limiter
        self.client.headers.update({
            "x-bypass-ratelimit": "true",
            "Content-Type": "application/json"
        })
        
        # Lakukan proses Login
        response = self.client.post("/api/auth/login", json={
            "email": self.EMAIL,
            "password": self.PASSWORD
        })
        
        if response.status_code == 200:
            # Token dari backend ecolight berada di dalam objek "data"
            token = response.json().get("data", {}).get("token")
            self.client.headers.update({
                "Authorization": f"Bearer {token}"
            })
            print(f"✅ User berhasil login.")
        else:
            print(f"⚠️ Gagal login: {response.text}")

    @task(3)
    def dashboard_summary(self):
        """Melihat ringkasan dashboard."""
        self.client.get("/api/dashboard/summary", name="GET /api/dashboard/summary")

    @task(2)
    def savings_summary(self):
        """Melihat ringkasan penghematan."""
        self.client.get("/api/savings/summary", name="GET /api/savings/summary")

    @task(2)
    def zones_list(self):
        """Mengambil daftar zona."""
        self.client.get("/api/zones", name="GET /api/zones")

    @task(1)
    def rooms_list(self):
        """Mengambil daftar ruangan."""
        self.client.get("/api/rooms", name="GET /api/rooms")