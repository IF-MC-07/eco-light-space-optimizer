import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
API_URL = os.getenv("API_URL", "http://localhost:5000/api")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@ecolight.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

MAHASISWA_EMAIL = os.getenv("MAHASISWA_EMAIL", "mahasiswa@test.com")
MAHASISWA_PASSWORD = os.getenv("MAHASISWA_PASSWORD", "mhs123")
