import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
API_URL = os.getenv("API_URL", "http://localhost:5000/api")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@ecolight.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@12345")

MAHASISWA_EMAIL = os.getenv("MAHASISWA_EMAIL", "ruth@ecolight.com")
MAHASISWA_PASSWORD = os.getenv("MAHASISWA_PASSWORD", "Ruth@12345")
