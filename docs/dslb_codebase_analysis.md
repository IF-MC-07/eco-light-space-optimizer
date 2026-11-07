# Analisis Codebase untuk Fitur DSLB (Dynamic Space Load Balancing)

**Tanggal:** 2026-10-22  
**Analis:** Antigravity (Software Architect AI)  
**Versi:** 1.0

---

## 1. Ringkasan Eksekutif

Eco-Light & Space Optimizer terdiri dari 3 layanan: backend Node.js/Express (server), service AI Python/YOLO (service_ai), dan frontend Next.js (client). Sistem sudah memiliki pipeline deteksi okupansi per-zona yang berjalan di service_ai, menyimpan `occupancy_count` ke tabel `detection_logs`. Tabel `rooms` sudah memiliki kolom `capacity` yang bisa dipakai sebagai pembagi threshold okupansi. Namun belum ada tabel status okupansi ruangan (Kosong/Rendah/Sedang/Padat), tabel log rekomendasi, maupun kolom `building`/`floor` di tabel `rooms`. Topic MQTT `ai/inference/result/{camera_id}` di-subscribe oleh backend Node.js tetapi **tidak pernah di-publish** oleh `inference_realtime.py` — ini adalah dead code di sisi publisher. Ada dua scheduler duplikat (Node.js `automationScheduler.js` dan Python `schedule_runner.py`) serta dua handler energi (`mqttService.js` dan `mqtt_subscriber.py`) yang menulis ke tabel yang sama, menimbulkan potensi race condition. DSLB paling tepat ditempatkan di service_ai Python karena di sanalah `occupancy_counts` per-zona sudah tersedia secara real-time.

---

## 2. Peta Arsitektur dan Alur Data

### 2.1 Struktur Direktori (3 level)

```
eco-light-space-optimizer/
├── broker/
│   ├── config/
│   │   └── mosquitto.conf
│   ├── data/
│   └── log/
├── client/                          # Frontend Next.js (TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (admin)/
│   │   │   ├── (auth)/
│   │   │   └── (main)/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── monitoring/
│   │   │   ├── rooms/
│   │   │   ├── zone/
│   │   │   └── ... (automation, camera, energy-monitor, dll.)
│   │   ├── guards/
│   │   ├── hooks/
│   │   ├── lib/                     # axios, api.ts, refreshToken
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── next.config.mjs
├── server/                          # Backend Node.js/Express
│   ├── app/
│   │   ├── config/                  # database.js, jwt.js, redis.js, email.js
│   │   ├── controllers/            # 18 controller files
│   │   ├── middlewares/            # auth, role, cors, errorHandler, rateLimiter, activityLogger
│   │   ├── models/                 # 13 Sequelize model files
│   │   ├── routes/                 # 19 route files + index.js
│   │   ├── schemas/                # schema.sql + migrations/ (kosong)
│   │   ├── services/              # 17 service files
│   │   ├── utils/                  # cameraCrypto, chartData, idGenerator, response, dll.
│   │   ├── validations/           # auth.validation.js, zone.validation.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/unit/
│   │   ├── controllers/
│   │   └── services/              # 13 test files (Jest)
│   ├── seed.js
│   └── package.json
└── service_ai/                      # AI Service (Python)
    ├── app/
    │   ├── models/                  # YOLO model files (best.pt)
    │   ├── boot_recovery.py
    │   ├── camera_loader.py
    │   ├── db.py
    │   ├── db_healthcheck.py
    │   ├── db_state.py
    │   ├── decision_engine.py       # ← Logika ON/OFF lampu & AC
    │   ├── inference_realtime.py    # ← Pipeline utama YOLO per-kamera
    │   ├── log_writer.py            # ← Tulis detection_logs
    │   ├── mqtt_commands.py         # ← Kirim perintah MQTT ke ESP32
    │   ├── mqtt_subscriber.py       # ← Subscribe MQTT + handle energy
    │   ├── results.py               # ← Dead code publisher
    │   ├── schedule_runner.py       # ← Scheduler jadwal Python
    │   ├── snapshot.py              # ← FastAPI (streaming + stats endpoint)
    │   ├── statistics_engine.py     # ← Statistik energi
    │   ├── zona_loader.py           # ← DB pool + zona dari DB
    │   └── test_camera.py, test_picture.py, train.py
    ├── tests/
    │   ├── unit/                    # 10 test files (pytest)
    │   ├── locust/
    │   └── selenium/
    ├── scripts/
    ├── data/
    ├── main.py                      # Entry point
    └── requirements.txt
```

### 2.2 Diagram Arsitektur

```
┌─────────────────┐      HTTP/REST       ┌─────────────────────┐
│    Frontend      │ ──────────────────── │   Backend (Node.js) │
│    (Next.js)     │  :5000/api           │   Express + Sequelize│
│    :3000         │                      │   + MQTT client      │
└────────┬────────┘                      └─────────┬───────────┘
         │                                         │
         │  HTTP :8000                             │ MQTT
         │  (pythonAPI)                            │ (mqtt.js)
         ▼                                         ▼
┌─────────────────┐      MQTT Broker       ┌──────────────────┐
│  Service AI     │ ◄────────────────────► │   Mosquitto      │
│  (Python/YOLO)  │                        │   :1883          │
│  FastAPI :8000  │                        └───────┬──────────┘
│  + MQTT client  │                                │
└────────┬────────┘                                │ MQTT
         │                                         ▼
         │ psycopg2 (direct)              ┌──────────────────┐
         ▼                                │   ESP32 (IoT)    │
┌─────────────────┐                       │   Relay, PZEM    │
│  Supabase       │ ◄──── Sequelize ──────│                  │
│  PostgreSQL     │                       └──────────────────┘
└─────────────────┘
```

### 2.3 Alur Komunikasi Antar Layanan

| Dari | Ke | Protokol | Keterangan |
|------|----|----------|------------|
| Frontend | Backend | REST HTTP :5000/api | Semua CRUD, auth, monitoring |
| Frontend | Service AI | REST HTTP :8000 | Streaming kamera, statistik energi |
| Backend | DB (Supabase) | Sequelize/PostgreSQL | ORM untuk semua tabel |
| Service AI | DB (Supabase) | psycopg2 (direct pool) | Read/write detection_logs, energy, dll. |
| Service AI | MQTT Broker | paho-mqtt | Publish perintah ke ESP32, subscribe trigger |
| Backend | MQTT Broker | mqtt.js | Subscribe `ai/inference/result/#`, energy, relay status |
| ESP32 | MQTT Broker | MQTT | Publish energy data, status; subscribe light/ac commands |

---

## 3. Temuan Per Bagian

### A. Arsitektur dan Stack

| Layanan | Bahasa/Framework | Port | Cara Jalankan |
|---------|-----------------|------|---------------|
| **Backend** | Node.js 18+, Express 5.1, Sequelize 6 | :5000 | `npm run dev` (nodemon) atau `npm start` |
| **Service AI** | Python 3.x, YOLO/Ultralytics, FastAPI, paho-mqtt, psycopg2 | :8000 | `python main.py` |
| **Frontend** | Next.js 15.5 (TypeScript, React 19), TailwindCSS 4, Zustand | :3000 | `npm run dev --turbopack` |
| **MQTT Broker** | Mosquitto | :1883 | Standalone (config di `broker/config/mosquitto.conf`) |

**FAKTA:** Tidak ditemukan `docker-compose.yml` atau Nginx config di repository.  
`server/package.json:8` → script `"start": "node app/server.js"`.  
`service_ai/main.py:54` → entry point `main()`.  
`client/package.json:7` → script `"dev": "next dev --turbopack"`.

---

### B. Alur Data Okupansi

#### B.1 Dari Kamera ke Angka Jumlah Orang

```
┌───────────┐   frame    ┌────────────────┐   boxes   ┌──────────────┐
│ Kamera    │ ─────────► │ YOLO predict() │ ────────► │ hitung_per_  │
│ (RTSP/USB)│            │ (dual model)   │           │ zona()       │
└───────────┘            └────────────────┘           └──────┬───────┘
                                                             │ occupancy_counts
                                                             ▼
                    ┌──────────────────┐   count per zone   ┌──────────────────┐
                    │ decision_engine  │ ◄────────────────── │ _maybe_process_  │
                    │ .process_infer() │                     │ decision()       │
                    └────────┬─────────┘                    └──────────────────┘
                             │ MQTT command                          │
                             ▼                                       ▼
                    ┌──────────────────┐               ┌──────────────────┐
                    │ mqtt_commander   │               │ write_detection_ │
                    │ → ESP32          │               │ logs() → DB      │
                    └──────────────────┘               └──────────────────┘
```

**File dan fungsi yang terlibat:**

1. **`service_ai/app/camera_loader.py:84-108`** — `get_active_camera_sources()`: membaca semua kamera aktif dari DB, mendekripsi IP address.
2. **`service_ai/app/inference_realtime.py:207-345`** — `camera_worker()`: loop utama per kamera, baca frame, jalankan YOLO inference, hitung per zona.
3. **`service_ai/app/inference_realtime.py:76-101`** — `get_model()`: load dual model (primary `best.pt` + fallback `yolov8n.pt`).
4. **`service_ai/app/inference_realtime.py:157-178`** — `hitung_per_zona()`: hitung jumlah orang per zona berdasarkan titik tengah bounding box.
5. **`service_ai/app/zona_loader.py:67-133`** — `ZoneManager.get_zones()` / `ambil_zona_dari_db()`: fetch zona dari DB dengan cache TTL 300 detik.
6. **`service_ai/app/zona_loader.py:135-169`** — `titik_di_zona()`: Ray-Casting Algorithm untuk cek apakah titik ada di dalam poligon zona (dengan skew).
7. **`service_ai/app/inference_realtime.py:195-204`** — `_maybe_process_decision()`: throttle panggilan ke `decision_engine.process_inference()` per 1 detik.
8. **`service_ai/app/decision_engine.py:96-230`** — `DecisionEngine.process_inference()`: logika delay ON/OFF lampu dan AC berdasarkan `occupancy_counts`.
9. **`service_ai/app/log_writer.py:15-86`** — `write_detection_logs()`: batch insert ke `detection_logs`.

#### B.2 Penyimpanan Jumlah Orang ke Database

**FAKTA:** Jumlah orang per zona disimpan ke tabel `detection_logs` melalui `write_detection_logs()` di `service_ai/app/log_writer.py:15-86`.

**Tabel:** `detection_logs`  
**Kolom terkait:** `occupancy_count` (INTEGER), `zone_id` (FK → zones), `camera_id` (FK → cameras), `zone_status` (VARCHAR — 'occupied' atau 'available'), `detection_time` (TIMESTAMPTZ).

**Interval penulisan:** Dikontrol oleh `DETECTION_LOG_INTERVAL` (default 120 detik = 2 menit) ATAU ketika state berubah (dari occupied ke available atau sebaliknya). Lihat `service_ai/app/inference_realtime.py:321-327`.

#### B.3 Definisi Zona

**FAKTA:** Zona didefinisikan sebagai **poligon persegi empat miring (skewed quadrilateral)** menggunakan koordinat persentase relatif terhadap resolusi kamera:
- `x1_pct`, `y1_pct`, `x2_pct`, `y2_pct`: batas persegi panjang dasar (dalam 0.0–1.0)
- `skew_x`, `skew_y`: offset miring pada sudut-sudut poligon
- Lihat `server/app/schemas/schema.sql:45-60` dan `service_ai/app/zona_loader.py:135-169`.

#### B.4 Kemungkinan Satu Orang Terhitung di Dua Zona

**FAKTA:** Tidak mungkin. Kode di `service_ai/app/inference_realtime.py:167-172` menggunakan `break` setelah orang pertama kali cocok dengan sebuah zona:

```python
for z in zones:
    if titik_di_zona(cx_rel, cy_rel, z):
        count[z["zone_name"]] += 1
        masuk_zona = True
        break  # ← keluar dari loop zona, orang hanya masuk satu zona
```

**DUGAAN:** Jika zona-zona tumpang tindih, orang akan dihitung di zona yang pertama kali cocok menurut `sort_order`. Ini bukan bug selama admin mengatur zona tanpa overlap — tetapi tidak ada validasi server-side yang mencegah overlap.

#### B.5 Frekuensi Update dan Penanganan Kamera Mati

- **Frekuensi inference:** Setiap frame (tergantung kecepatan YOLO + kamera), dengan throttle `SNAPSHOT_INTERVAL` = 3 detik pada reconnect. Decision engine di-throttle 1 detik (`service_ai/app/inference_realtime.py:195-204`).
- **Log ke DB:** Setiap 120 detik atau saat state berubah (`service_ai/app/inference_realtime.py:42, 321`).
- **Zona reload dari DB:** Setiap `ZONE_FETCH_INTERVAL` = 60 detik (`service_ai/app/inference_realtime.py:41, 228-234`).
- **Kamera mati:** `camera_worker` melakukan reconnect otomatis dengan `open_capture()` dan sleep `SNAPSHOT_INTERVAL` detik. Lihat `service_ai/app/inference_realtime.py:236-264`. Selama kamera mati, **tidak ada data okupansi yang dihasilkan** — decision engine tidak akan dipanggil untuk kamera tersebut.
- **Data basi (stale):** `ZoneManager` di `zona_loader.py:68-76` memiliki cache TTL 300 detik; jika DB gagal, fallback ke cache basi (`zona_loader.py:117-120`). Frame buffer untuk streaming juga memiliki pengecekan basi 5 detik (`snapshot.py:70`).

#### B.6 Verifikasi `decision_engine.process_inference()` Dipanggil

**FAKTA:** `process_inference()` **BENAR-BENAR dipanggil** di pipeline aktif melalui `_maybe_process_decision()`.

Bukti dari grep:
- **Definisi:** `service_ai/app/decision_engine.py:96`
- **Dipanggil di pipeline:** `service_ai/app/inference_realtime.py:200` — `engine.process_inference(camera_id, occupancy_counts)`

#### B.7 Verifikasi Topic `ai/inference/result/{camera_id}`

**FAKTA:** Topic ini adalah **dead code di sisi publisher** tetapi **aktif di sisi subscriber**.

- **Publisher (Python):** `service_ai/app/results.py:7-16` — fungsi `publish_inference_result()` ada tetapi **TIDAK PERNAH dipanggil** dari `inference_realtime.py`. Tidak ada import `results.py` di `inference_realtime.py`. Grep di `inference_realtime.py` untuk "publish" menghasilkan 0 hit.
- **Subscriber (Node.js):** `server/app/services/mqttService.js:28,84-93` — backend **AKTIF** subscribe ke `ai/inference/result/#` dan memproses payload ke `DetectionPipelineService.processBulkAIResult()`. Tetapi karena tidak ada publisher, pipeline ini **tidak pernah menerima pesan**.
- **Bug di `results.py:14`:** Menggunakan `os.getenv()` tetapi `os` **tidak di-import** — file ini akan crash dengan `NameError` jika dipanggil.

**Konsekuensi:** `DetectionPipelineService` di backend (yang memanggil `automationService.handleDetection()`) **tidak pernah dipicu oleh AI service**. Backend Node.js memiliki jalur automasi sendiri yang sepenuhnya mati untuk deteksi AI.

---

### C. Database

#### C.1 Daftar Tabel dan Kolom

| Tabel | Kolom | Relasi | Lokasi definisi |
|-------|-------|--------|-----------------|
| **rooms** | `room_id` (PK, VARCHAR30), `room_name`, `location`, `capacity` (INT), `status` | hasMany: zones, cameras, iot_devices, power_sensors, energy_logs, automation_schedules, ac_controls | `schema.sql:5-11`, `models/room.js` |
| **users** | `user_id` (PK), `name`, `username`, `email`, `password`, `role` (default 'mahasiswa'), `avatar`, `email_notifications`, `system_notifications`, `daily_digest` | — | `schema.sql:13-24` |
| **iot_devices** | `device_id` (PK), `room_id` (FK→rooms), `device_name`, `type`, `status`, `last_seen` | belongsTo Room | `schema.sql:26-33` |
| **cameras** | `camera_id` (PK), `room_id` (FK→rooms), `name`, `ip_address`, `camera_hash`, `resolution`, `status` | belongsTo Room | `schema.sql:35-43` |
| **zones** | `zone_id` (PK), `room_id` (FK→rooms, CASCADE), `zone_name`, `sort_order`, `color`, `zone_status`, `x1_pct`, `y1_pct`, `x2_pct`, `y2_pct`, `skew_x`, `skew_y`, `created_at`, `updated_at` | belongsTo Room, hasMany DetectionLog, LightControl | `schema.sql:45-60` |
| **ac_controls** | `ac_control_id` (PK), `room_id` (FK), `device_id` (FK), `temperature_setting`, `ac_status`, `updated_at` | — | `schema.sql:66-73` |
| **light_controls** | `control_id` (PK), `zone_id` (FK→zones, CASCADE), `device_id` (FK), `relay_channel`, `light_status`, `updated_at` | belongsTo Zone, IotDevice | `schema.sql:75-82` |
| **automation_schedules** | `schedule_id` (PK), `room_id` (FK), `user_id` (FK), `schedule_name`, `start_time` (TIME), `end_time` (TIME), `schedule_days` | — | `schema.sql:84-92` |
| **detection_logs** | `detection_id` (PK), `zone_id` (FK), `camera_id` (FK), `occupancy_count` (INT), `zone_status`, `detection_time` (TIMESTAMPTZ) | belongsTo Zone, Camera | `schema.sql:98-105` |
| **energy_logs** | `log_id` (PK), `room_id` (FK), `date` (DATE), `total_watts`, `saved_watts` | belongsTo Room | `schema.sql:107-113` |
| **power_sensors** | `sensor_id` (PK), `room_id` (FK), `power_watts`, `voltage_v`, `current_a`, `read_at` | — | `schema.sql:115-122` |
| **activity_logs** | `log_id` (PK), `user_id` (FK), `action`, `details`, `ip_address`, `status_code`, `resource_id`, `resource_type`, `timestamp` | — | `schema.sql:132-145` |

#### C.2 Kolom Kapasitas, Gedung, Lantai

- **`rooms.capacity`:** **SUDAH ADA** — `schema.sql:9`, tipe `INTEGER`. Ini bisa langsung dipakai sebagai kapasitas maksimum untuk menghitung level okupansi.
- **`rooms.location`:** **SUDAH ADA** — `schema.sql:8`, tipe `VARCHAR(100)`. DUGAAN: mungkin berisi informasi gedung/lantai dalam format teks bebas, tapi **tidak ada kolom `building` atau `floor` terpisah**.
- **Tabel status okupansi ruangan:** **TIDAK DITEMUKAN**. Belum ada tabel yang menyimpan status okupansi level ruangan (Kosong/Rendah/Sedang/Padat).
- **Tabel log rekomendasi:** **TIDAK DITEMUKAN**.

#### C.3 Konvensi Database

- **Penamaan tabel:** snake_case plural (`rooms`, `zones`, `detection_logs`).
- **Penamaan kolom:** snake_case (`room_id`, `zone_status`, `occupancy_count`).
- **Tipe ID:** `CHARACTER VARYING(30)` dengan prefix 3 huruf + UUID hex pendek (contoh: `ROM-1464452b`, `ZON-xxx`, `DET-xxx`). Generator di `server/app/utils/idGenerator.js`.
- **Timestamp:** `TIMESTAMP WITH TIME ZONE`, default `NOW()`.
- **Enum/CHECK:** **TIDAK DIGUNAKAN**. Status disimpan sebagai `VARCHAR` tanpa constraint. Contoh: `rooms.status` bisa 'ACTIVE' atau apapun, `light_controls.light_status` bisa 'on'/'off'/'ON'/'OFF' — inkonsistensi casing terjadi di beberapa tempat.
- **Indeks:** Sudah ada indeks pada kolom filter tinggi: `detection_logs(zone_id, camera_id, detection_time)`, `energy_logs(room_id, date)`, `zones(room_id)`, dll. (`schema.sql:153-183`).
- **RLS (Row-Level Security):** **TIDAK DITEMUKAN** di schema.sql atau migrasi.
- **Format migrasi:** Direktori `server/app/schemas/migrations/` **KOSONG**. Sequelize CLI ada di devDependencies tapi tidak ada migrasi. **DUGAAN:** Schema dikelola manual via `schema.sql` atau `db.sequelize.sync()` di `server.js:17` dan `seed.js:14`.
- **UNIQUE constraint di `energy_logs`:** Kode Python di `mqtt_subscriber.py:193` menggunakan `ON CONFLICT (room_id, date)` yang mengasumsikan ada UNIQUE constraint `(room_id, date)`. **TETAPI** ini **TIDAK ada di `schema.sql`**. Sequelize model `energy_log.js` juga tidak mendefinisikannya. **DUGAAN:** Constraint ini mungkin sudah ditambahkan langsung di Supabase tanpa didokumentasikan di schema file.

#### C.4 Cara Koneksi

- **Backend (Node.js):** Sequelize pool — `max: 5, min: 0, acquire: 30000, idle: 10000` (`server/app/config/database.js:19-24`).
- **Service AI (Python):** `psycopg2.pool.ThreadedConnectionPool` — `minconn=1, maxconn=10, sslmode='require'` (`service_ai/app/zona_loader.py:20-25`).
- **Pola release:** Semua file Python menggunakan `release_connection()` (via `putconn()` pool). Grep `conn.close` hanya menemukan pengecekan `conn.closed != 0` di `zona_loader.py:126` (bukan pemanggilan close). **Tidak ada file Python yang memakai `conn.close()` langsung** — semua sudah benar menggunakan `release_connection()`.

---

### D. Backend REST

#### D.1 Daftar Endpoint

**Auth (tanpa autentikasi):**

| Method | Path | Middleware | Handler | File |
|--------|------|-----------|---------|------|
| POST | /api/auth/... | authLimiter | auth.controller | `auth.route.js` |

**Room:**

| Method | Path | Middleware | Handler | File |
|--------|------|-----------|---------|------|
| GET | /api/rooms/ | authenticate, requireRole(['admin','mahasiswa']) | roomController.getAll | `roomRoute.js:8` |
| GET | /api/rooms/:id | authenticate, requireRole(['admin','mahasiswa']) | roomController.getById | `roomRoute.js:9` |
| POST | /api/rooms/ | authenticate, requireRole(['admin']) | roomController.create | `roomRoute.js:10` |
| PUT | /api/rooms/:id | authenticate, requireRole(['admin']) | roomController.update | `roomRoute.js:11` |
| DELETE | /api/rooms/:id | authenticate, requireRole(['admin']) | roomController.remove | `roomRoute.js:12` |
| GET | /api/rooms/:id/zones | authenticate, requireRole(['admin','mahasiswa']) | roomController.getZones | `roomRoute.js:14` |
| GET | /api/rooms/:id/detection | authenticate, requireRole(['admin','mahasiswa']) | roomController.getDetections | `roomRoute.js:15` |
| GET | /api/rooms/:id/devices | authenticate, requireRole(['admin']) | roomController.getDevices | `roomRoute.js:16` |

**Zone:**

| Method | Path | Middleware | Handler | File |
|--------|------|-----------|---------|------|
| GET | /api/zones/ | authenticate | zoneController.getAll | `zoneRoute.js:7` |
| GET | /api/zones/camera/:cameraId | authenticate | zoneController.getByCamera | `zoneRoute.js:8` |
| GET | /api/zones/:id | authenticate | zoneController.getById | `zoneRoute.js:9` |
| GET | /api/zones/:id/detail | authenticate | zoneController.getDetail | `zoneRoute.js:10` |
| POST | /api/zones/simpan | authenticate | zoneController.simpan | `zoneRoute.js:11` |
| POST | /api/zones/ | authenticate | zoneController.create | `zoneRoute.js:12` |
| PUT | /api/zones/:id | authenticate | zoneController.update | `zoneRoute.js:13` |
| DELETE | /api/zones/:id | authenticate | zoneController.deleteZone | `zoneRoute.js:14` |

**Camera:**

| Method | Path | Middleware | Handler | File |
|--------|------|-----------|---------|------|
| GET | /api/cameras/ai/stream-urls | **TANPA AUTH** (x-ai-secret header) | cameraController.getAiStreamUrls | `cameraRoute.js:8` |
| GET | /api/cameras/ | authenticate, requireRole(['admin']) | cameraController.getAll | `cameraRoute.js:9` |

**Detection Log:**

| Method | Path | Middleware | Handler | File |
|--------|------|-----------|---------|------|
| GET | /api/detection-logs/ | authenticate | detectionLogController.getAll | `detectionLogRoute.js:7` |

**Monitoring:**

| Method | Path | Middleware | Handler | File |
|--------|------|-----------|---------|------|
| GET | /api/monitoring/stats | authenticate, requireRole(['admin','mahasiswa']) | getStats | `monitoring.route.js:11` |
| GET | /api/monitoring/devices | authenticate, requireRole(['admin','mahasiswa']) | getDevices | `monitoring.route.js:12` |
| POST | /api/monitoring/master-control | authenticate, requireRole(['admin']) | postMasterControl | `monitoring.route.js:14` |

**Lainnya:** light-controls, ac-controls, energy-logs, power-sensors, automation-schedules, dashboard, energy, savings, export, activity-logs — semua menggunakan pola yang sama.

#### D.2 Pola Auth dan Role

- **Auth middleware:** `server/app/middlewares/auth.middleware.js:7-46` — verifikasi JWT dari header `Authorization: Bearer <token>` atau cookie `token`. Lookup user dari DB. Set `req.user`.
- **Role middleware:** `server/app/middlewares/role.middleware.js:1-21` — cek `req.user.role` terhadap array `allowedRoles`. Role yang digunakan: `'admin'` dan `'mahasiswa'`.
- **Pola:** `authenticate` → `requireRole([...])` → handler. Rute `/cameras/ai/stream-urls` adalah pengecualian: tidak pakai `authenticate`, tapi pakai header `x-ai-secret`.

#### D.3 Pola Validasi, Respons, dan Error

- **Validasi:** Hanya 2 file validasi: `auth.validation.js` dan `zone.validation.js` (menggunakan Joi: `server/package.json:33`). **DUGAAN:** Kebanyakan endpoint tidak memiliki validasi input eksplisit.
- **Format respons:** Menggunakan `responseFormatter` (`server/app/utils/response.js:1-17`):
  - Sukses: `{ success: true, message: "...", data: ... }` (status 200)
  - Error: `{ success: false, message: "..." }` (status 4xx/5xx)
- **Error handler:** `server/app/middlewares/errorHandler.middleware.js:1-13` — catch-all, log stack, respons JSON.
- **Rate limiter:** 3 tier — `authLimiter` (1000/15min), `controlLimiter` (30/1min per user), `apiLimiter` (200/15min per user). Lihat `server/app/middlewares/rateLimiter.middleware.js`.

#### D.4 Pola Layering

**FAKTA:** Proyek mengikuti pola `Route → Controller → Service → Model (Sequelize)` secara konsisten:
- Routes (`routes/*.js`): definisi path, middleware chain.
- Controllers (`controllers/*.js`): terima `req`, panggil service, kirim response via `responseFormatter`.
- Services (`services/*.js`): logika bisnis, interaksi model.
- Models (`models/*.js`): definisi Sequelize.

**Catatan:** Beberapa controller langsung query model tanpa melalui service (contoh: `roomController.getZones` di `roomController.js:61` langsung pakai `db.Zone.findAll()`).

---

### E. Penjadwalan dan Konkurensi

#### E.1 Daftar Scheduler

| # | Scheduler | File | Interval | Bahasa | Risiko Duplikat |
|---|-----------|------|----------|--------|-----------------|
| 1 | **ScheduleRunner (Python)** | `service_ai/app/schedule_runner.py:35-47` | 15 detik (polling loop) | Python | Tidak — berjalan sebagai daemon thread tunggal di `main.py:78` |
| 2 | **AutomationScheduler (Node.js)** | `server/app/services/automationScheduler.js:12-18` | 30 detik (setInterval) | Node.js | Tidak per-instance — tapi **DUPLIKAT logika** dengan #1 |
| 3 | **digestJob (Node.js)** | `server/app/server.js:25-51` | Cron harian `0 0 * * *` | Node.js | Tidak |
| 4 | **cleanupJob (Node.js)** | `server/app/server.js:53-69` | Cron harian `0 1 * * *` | Node.js | Tidak |
| 5 | **camera_worker threads (Python)** | `service_ai/app/inference_realtime.py:366-376` | Kontinu (per-frame) | Python | Satu thread per kamera, aman |
| 6 | **MQTT loop_start (Python)** | `service_ai/app/mqtt_subscriber.py:298` | Kontinu (background thread) | Python | Tidak |

**⚠️ Risiko scheduler duplikat #1 dan #2:** Keduanya membaca `automation_schedules` dan mengirim perintah MQTT ON/OFF ke ESP32 untuk ruangan yang sama. Jika backend dan service_ai berjalan bersamaan, **jadwal bisa di-trigger 2 kali** untuk ruangan yang sama (satu dari Python, satu dari Node.js). Python ScheduleRunner juga memiliki logika "No-Show Eco" yang tidak ada di Node.js — sehingga bisa terjadi konflik (Python mematikan lampu karena no-show, Node.js menyalakan lagi karena masih dalam jadwal).

#### E.2 Race Condition pada `energy_logs`

**⚠️ RISIKO:** Dua handler menulis ke tabel `energy_logs` secara bersamaan:
1. **Python:** `service_ai/app/mqtt_subscriber.py:99-230` — `_handle_energy()` — langsung dari MQTT `devices/+/energy`.
2. **Node.js:** `server/app/services/mqttService.js:108-223` — `handleEnergyData()` — juga dari MQTT `devices/+/energy`.

Keduanya subscribe ke topic yang sama dan keduanya INSERT/UPSERT ke `energy_logs` dan `power_sensors`. Ini bisa menyebabkan:
- **Double-insert** pada `power_sensors` (2 baris untuk 1 pembacaan).
- **Double-accumulation** pada `energy_logs.total_watts` (kWh dihitung 2 kali).

Selain itu, `MAX_GAP_HOURS` berbeda: Python = `1.0 jam` (`mqtt_subscriber.py:12`), Node.js = `5 menit` (`mqttService.js:160`). 

---

### F. Efek Samping ke Perangkat

#### F.1 Titik yang Mengirim Perintah MQTT ke ESP32

| # | File | Fungsi | Topic | Sumber |
|---|------|--------|-------|--------|
| 1 | `service_ai/app/mqtt_commands.py:19-41` | `send_light_command()` | `devices/{room_id}/light/{relay_channel}` | `ai_decision` |
| 2 | `service_ai/app/mqtt_commands.py:43-62` | `send_ac_command()` | `devices/{room_id}/ac` | `ai_decision` |
| 3 | `service_ai/app/schedule_runner.py:318-325` | Via `mqtt_commander.send_light_command()` | Idem | `schedule` |
| 4 | `server/app/services/automationScheduler.js:105,124` | Via `mqttService.publish()` | `devices/{room_id}/light/{relay_channel}` | `schedule_automation` |
| 5 | `server/app/services/lightControlService.js:38-48` | Via `mqttService.publish()` | `devices/{room_id}/light/{relay_channel}` | `admin_override` |
| 6 | `server/app/services/automationService.js:102,115` | Via `mqttService.publish()` | `kelas/control` + `devices/{room_id}/light/...` | `ai_automation` |
| 7 | `server/app/controllers/monitoring.controller.js:156-200` | Via `mqttService.publish()` | `devices/{room_id}/light/...` + `devices/{room_id}/ac` | `admin_override` |

#### F.2 Bagaimana Target Ruangan Dipilih

Semua perintah MQTT menggunakan `room_id` yang berasal dari:
- **Decision Engine (Python):** `room_id` didapat dari `cameras.room_id` melalui `_camera_room_cache` (`decision_engine.py:50-55`).
- **Schedule Runner:** `room_id` dari tabel `automation_schedules.room_id` (`schedule_runner.py:170`).
- **Admin override:** `room_id` dari `iot_devices.room_id` atau `zones.room_id` (`monitoring.controller.js:169`).

#### F.3 Guard yang Diperlukan untuk Ruangan Simulasi DSLB

**⚠️ PENTING:** Jika Anda menambah ruangan simulasi di database (misalnya `ROM-SIMULASI`), ruangan tersebut **AKAN** memicu perintah relay fisik jika:

1. Ada `kamera` aktif yang di-assign ke ruangan simulasi → decision engine akan mengirim MQTT ke `devices/ROM-SIMULASI/light/...` → ESP32 (jika ada) akan merespons.
2. Ada `automation_schedule` yang di-assign ke ruangan simulasi → ScheduleRunner Python DAN AutomationScheduler Node.js akan mengirim MQTT.
3. Ada `iot_device` + `light_control` atau `ac_control` yang di-assign → admin override dari UI akan mengirim MQTT.

**Titik penjaga yang perlu ditambahkan:**
1. **`mqtt_commands.py:send_light_command()` (baris 19)** — Tambahkan pengecekan apakah `room_id` adalah ruangan simulasi sebelum publish MQTT.
2. **`mqtt_commands.py:send_ac_command()` (baris 43)** — Idem.
3. **`schedule_runner.py:_trigger_room_devices()` (baris 272)** — Idem.
4. **`automationScheduler.js:turnOn()` dan `turnOff()` (baris 96, 115)** — Idem.
5. **`lightControlService.js:update()` (baris 34-48)** — Idem.
6. **`automationService.js:triggerLightAction()` (baris 76)** — Idem.

**DUGAAN:** Alternatif yang lebih elegan: beri flag `is_virtual` atau `is_simulation` pada tabel `rooms`, lalu filter di semua fungsi yang mengirim perintah MQTT.

---

### G. Frontend

#### G.1 Framework dan Stack

- **Framework:** Next.js 15.5 dengan TypeScript, React 19, TailwindCSS v4.
- **State management:** Zustand (`client/package.json:70`), React Query/TanStack (`client/package.json:37`).
- **Routing:** Next.js App Router (folder `src/app/`) dengan route groups: `(admin)`, `(auth)`, `(main)`.
- **Styling:** TailwindCSS + Radix UI primitives + class-variance-authority.
- **Charts:** Chart.js + react-chartjs-2 + Recharts.
- **Form:** React Hook Form + Zod.
- **Animation:** Motion (Framer Motion).

#### G.2 Cara Memanggil API

- **Dua Axios instance:** `serverAPI` (ke backend :5000/api) dan `pythonAPI` (ke service_ai :8000). Lihat `client/src/lib/api.ts:1-48`.
- **Interceptor:** Auto-refresh token pada 401 `TOKEN_EXPIRED`, redirect ke `/login` pada 401 lainnya. Lihat `client/src/lib/api.ts:27-46`.
- **Auth:** HTTP-only cookies (`withCredentials: true`).
- **Ada juga** `client/src/lib/axios.ts` — instance Axios lama yang juga mengarah ke :5000/api. **DUGAAN:** File lama yang belum di-deprecate.

#### G.3 Fitur/Halaman Terkait Ruangan

Berdasarkan `client/src/features/`:
- **`rooms/`** — API, komponen, hooks, types untuk manajemen ruangan.
- **`zone/`** — Pengelolaan zona dalam ruangan.
- **`monitoring/`** — Dashboard monitoring perangkat, energi, sensor.
- **`dashboard/`** — Dashboard utama.

**DUGAAN:** Komponen di `features/rooms/components/` dan `features/monitoring/components/` bisa dipakai ulang atau diextend untuk halaman ketersediaan ruangan DSLB. Halaman baru DSLB bisa ditempatkan di `client/src/app/(main)/room-availability/` atau `client/src/features/room-availability/`.

#### G.4 Middleware Frontend

`client/src/middleware.ts` (2834 bytes) — DUGAAN: menangani routing guard dan auth redirect di sisi server Next.js.

---

### H. Tes

#### H.1 Kerangka dan Lokasi

| Layanan | Framework | Lokasi | Perintah |
|---------|----------|--------|----------|
| Backend | Jest | `server/tests/unit/services/` (13 file), `server/tests/unit/controllers/` | `npm test` (dengan `cross-env NODE_ENV=test NODE_OPTIONS='--experimental-vm-modules' jest --verbose`) |
| Service AI | pytest | `service_ai/tests/unit/` (10 file) | `pytest` (dari root service_ai) |
| Load test | Locust | `service_ai/tests/locust/` | — |
| E2E | Selenium | `service_ai/tests/selenium/` | — |

#### H.2 Cakupan

**Backend (Jest):** 13 service test files yang mencakup semua service utama: room, zone, camera, detection log, energy log, light control, ac control, automation, auth, user, iot device, power sensor.

**Service AI (pytest):** 10 unit test files:
- `test_decision_engine.py` — test `process_inference()` untuk light ON/OFF/delay/recovery.
- `test_inference.py` — test inference pipeline.
- `test_inference_decision_hook.py` — test hook dari inference ke decision engine.
- `test_mqtt_publish.py` — test MQTT publish.
- `test_mqtt_subscriber_energy.py` — test energy handler.
- `test_schedule_runner.py` — test schedule runner.
- `test_snapshot.py` — test FastAPI snapshot endpoint.
- `test_snapshot_stream.py` — test streaming endpoint.
- `test_zona_loader.py` — test zona loader dan titik_di_zona().

**CATATAN:** Tes tidak dijalankan dalam analisis ini karena membutuhkan koneksi database dan MQTT broker yang aktif.

---

### I. Konfigurasi

#### I.1 Variabel Lingkungan Relevan

**Backend (`server/.env.example`):**
`PORT`, `NODE_ENV`, `CLIENT_URL`, `DB_TYPE`, `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`, `DB_SSL`, `SUPABASE_DATABASE_URL`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USE_SSL`, `SMTP_USER`, `SMTP_PASSWORD`, `FROM_EMAIL`, `REDIS_URL`, `MQTT_BROKER`, `MQTT_PORT`, `MQTT_USER`, `MQTT_PASSWORD`, `ROOM_ID`, `MQTT_TOPIC_TRIGGER`, `MQTT_TOPIC_REQUEST`, `MQTT_TOPIC_RESULT`, `MQTT_TOPIC_DEVICE_BASE`, `MQTT_TOPIC_ENERGY`, `MQTT_TOPIC_ZONE_RELOAD`, `OCCUPANCY_TIMEOUT_MINS`, `DEBOUNCE_TIME_MS`, `AI_SERVICE_URL`, `BOOT_RECOVERY_DELAY`, `DB_MAX_RETRIES`, `DB_RETRY_INTERVAL`, `MQTT_MAX_RETRIES`, `MQTT_RETRY_INTERVAL`, `CAMERA_SECRET_KEY`.

**Service AI (`service_ai/.env.example`):**
`APP_NAME`, `CLIENT_URL`, `DEBUG`, `ENVIRONMENT`, `PORT`, `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`, `DB_SSL`, `DB_TYPE`, `SUPABASE_DATABASE_URL`, `MQTT_BROKER`, `MQTT_PORT`, `MQTT_USER`, `MQTT_PASSWORD`, `MQTT_TOPIC_PUBLISH`, `MQTT_TOPIC_CONTROL`, `SEND_INTERVAL`, `ZONE_FETCH_INTERVAL`, `CONF_THRESHOLD`, `IOU_THRESHOLD`, `DELAY_ON_LIGHT_SECONDS`, `DELAY_ON_AC_MINUTES`, `DELAY_OFF_MINUTES`, `COMPRESSOR_PROTECTION_SECONDS`, `MQTT_TOPIC_TRIGGER`, `MQTT_TOPIC_CONTROL`, `AI_SERVICE_URL`, `CAMERA_BASE_URL`, `OPENCV_FFMPEG_THREADS`, `OPENCV_FFMPEG_CAPTURE_OPTIONS`, `ENERGY_THRESHOLD_WATTS`, `PLN_EMISSION_FACTOR`, `PLN_TARIFF_IDR_PER_WH`, `BOOT_RECOVERY_DELAY`, `DB_MAX_RETRIES`, `DB_RETRY_INTERVAL`, `MQTT_MAX_RETRIES`, `MQTT_RETRY_INTERVAL`, `CAMERA_SECRET_KEY`, `MODEL_PATH`, `DETECTION_LOG_INTERVAL`, `SCHEDULE_NO_SHOW_MINUTES`, `ZONE_CACHE_TTL`.

**Frontend (`client/.env.example`):**
`NEXT_PUBLIC_SERVER_API_BASE_URL`, `NEXT_PUBLIC_PYTHON_SERVICE_API_BASE_URL`, `NEXT_PUBLIC_CAMERA_BASE_URL`.

---

## 4. Rekomendasi Penempatan Modul DSLB

### 4.1 Rekomendasi: Di **service_ai Python** sebagai modul baru + REST endpoint baru di **backend Node.js**

**Alasan:**

1. **Data okupansi real-time tersedia di service_ai:** `occupancy_counts` per zona sudah dihitung di `inference_realtime.py:307` dan dipassing ke `decision_engine.process_inference()`. DSLB cukup menempel di jalur yang sama.

2. **Perhitungan status ruangan (Kosong/Rendah/Sedang/Padat):** Memerlukan jumlah total orang di seluruh zona ruangan + kapasitas ruangan. Data ini sudah tersedia:
   - Total orang: `count["total"]` di `inference_realtime.py:308`.
   - Kapasitas: `rooms.capacity` di database.

3. **Rekomendasi ruangan alternatif:** Memerlukan perbandingan status okupansi antar ruangan. Ini bisa dilakukan sebagai endpoint REST baru di backend Node.js (query `detection_logs` terbaru + `rooms.capacity`).

### 4.2 File yang Kemungkinan Dibuat atau Diubah

**File baru:**
| File | Keterangan |
|------|------------|
| `service_ai/app/dslb_engine.py` | Modul DSLB: hitung status okupansi level ruangan, simpan ke DB, publish ke MQTT |
| `server/app/services/dslbService.js` | Service DSLB: query status okupansi terkini, rekomendasi ruangan |
| `server/app/controllers/dslbController.js` | Controller DSLB |
| `server/app/routes/dslbRoute.js` | Route DSLB |
| `client/src/features/room-availability/` | Fitur frontend: halaman ketersediaan ruangan |
| Migrasi SQL (baru) | Tabel `room_occupancy_status`, tabel `room_recommendations_log` |

**File yang diubah (minor):**
| File | Perubahan |
|------|-----------|
| `service_ai/app/inference_realtime.py` | Panggil `dslb_engine` setelah `_maybe_process_decision()` |
| `server/app/routes/index.js` | Tambah route DSLB |
| `server/app/schemas/schema.sql` | Tambah tabel baru (opsional) |
| `server/app/models/index.js` | Register model baru |
| `server/app/models/room.js` | Tambah kolom `building`, `floor` jika diperlukan |

---

## 5. Risiko dan Hal yang Rawan Rusak (Urut dari Paling Berisiko)

| # | Risiko | Tingkat | Penjelasan |
|---|--------|---------|------------|
| 1 | **Scheduler duplikat mengirim perintah ganda ke ESP32** | 🔴 Tinggi | Python `ScheduleRunner` dan Node.js `AutomationScheduler` berjalan bersamaan, keduanya trigger ON/OFF untuk ruangan yang sama. DSLB yang mengandalkan status lampu/AC bisa mendapat state yang inkonsisten. |
| 2 | **Race condition `energy_logs` double-write** | 🔴 Tinggi | Kedua layanan (Python + Node.js) subscribe ke MQTT energy dan menulis ke `energy_logs` + `power_sensors`. Bisa menyebabkan data energi ganda. |
| 3 | **Ruangan simulasi DSLB memicu perintah fisik** | 🔴 Tinggi | Tanpa guard, ruangan simulasi baru di DB akan menyebabkan decision engine dan scheduler mengirim perintah MQTT ke ESP32. |
| 4 | **Inkonsistensi casing status** | 🟡 Sedang | `light_status` disimpan kadang 'on'/'off', kadang 'ON'/'OFF'. Kode pengecekan terpecah antara `['on', 'active', 'ON', 'ACTIVE']`. DSLB harus mengikuti konvensi yang sama atau bisa salah baca status. |
| 5 | **`rooms.capacity` NULL** | 🟡 Sedang | Kolom `capacity` bisa NULL (schema tidak ada NOT NULL constraint). DSLB yang membagi `total_orang / capacity` akan crash atau menghasilkan status salah jika capacity NULL atau 0. |
| 6 | **Tidak ada UNIQUE constraint `(room_id, date)` di `energy_logs` schema** | 🟡 Sedang | Kode Python mengasumsikan constraint ini ada untuk `ON CONFLICT`. Jika belum ada, UPSERT akan gagal atau insert duplikat. |
| 7 | **`decision_engine` in-memory state bisa desync** | 🟡 Sedang | `DecisionEngine` menyimpan `zone_states` dan `ac_states` di memori Python. Jika admin mengubah status via Node.js backend (tanpa `sync_room_zone_statuses()`), decision engine bisa konflik. |
| 8 | **Kamera mati = ruangan dianggap kosong** | 🟡 Sedang | Jika kamera ruangan mati, tidak ada data okupansi baru. DSLB bisa menandai ruangan sebagai "Kosong" padahal mungkin ada orang. Perlu logic "UNKNOWN" atau "NO_DATA". |
| 9 | **Zona tanpa overlap validation** | 🟢 Rendah | Tidak ada validasi server-side bahwa zona-zona dalam satu ruangan tidak tumpang tindih. Jika admin membuat zona overlap, jumlah orang bisa kurang dari sebenarnya (karena `break` pada match pertama). |
| 10 | **Topic MQTT `ai/inference/result` dead code** | 🟢 Rendah | Pipeline `DetectionPipelineService` + `AutomationService` di backend Node.js tidak pernah dieksekusi. Jika DSLB mengirim hasil via topic ini, pipeline itu akan aktif dan mungkin mengirim perintah MQTT duplikat. |

---

## 6. Bug atau Kode Mati yang Ditemukan

| # | File:Baris | Deskripsi | Dampak pada DSLB |
|---|-----------|-----------|-----------------|
| 1 | `service_ai/app/results.py:14` | `os.getenv()` dipanggil tetapi `os` **tidak di-import**. Akan crash `NameError: name 'os' is not defined` jika dipanggil. | Rendah — file ini dead code. Tapi jika diaktifkan untuk DSLB, harus diperbaiki. |
| 2 | `service_ai/app/results.py:7-16` | `publish_inference_result()` **tidak pernah dipanggil** dari pipeline apapun. | Rendah — tapi menunjukkan bahwa jalur publish `ai/inference/result` belum pernah aktif. |
| 3 | `server/app/services/detectionPipelineService.js:92,112-157` | `processBulkAIResult()` **tidak pernah menerima pesan** karena publisher-nya (results.py) dead code. Seluruh `DetectionPipelineService` efektif mati. | Sedang — pipeline ini memanggil `automationService.handleDetection()` yang juga efektif mati. Ada risiko jika DSLB mengaktifkan jalur ini. |
| 4 | `server/app/services/automationService.js:35-53` | `handleDetection()` dipanggil oleh `DetectionPipelineService` yang dead code. `AutomationService` ini **duplikat** dengan `DecisionEngine` Python — keduanya mengirim ON/OFF untuk zona, tapi melalui jalur berbeda. | Tinggi — jika salah satu diaktifkan tanpa mematikan yang lain, terjadi double command. |
| 5 | `server/app/services/automationScheduler.js` vs `service_ai/app/schedule_runner.py` | **Dua scheduler identik** berjalan bersamaan — keduanya membaca `automation_schedules` dan mengirim perintah ke ESP32. | Tinggi — potensi double trigger. |
| 6 | `server/app/services/mqttService.js:108-223` vs `service_ai/app/mqtt_subscriber.py:99-230` | **Dua energy handler** subscribe ke topic yang sama dan menulis ke tabel yang sama (`energy_logs`, `power_sensors`). | Tinggi — data bisa terduplikasi. |
| 7 | `client/src/lib/axios.ts` | File Axios lama yang kemungkinan sudah digantikan oleh `client/src/lib/api.ts` tetapi belum dihapus. | Rendah — tapi bisa membingungkan developer DSLB yang memilih file mana untuk memanggil API. |
| 8 | `service_ai/app/inference_realtime.py:346` | Baris terakhir loop `camera_worker` — setelah block `try/except` untuk `_store_frame`, **tidak ada `time.sleep()`** jika berhasil. Loop akan spin secepat mungkin tanpa jeda, berpotensi CPU 100%. | Rendah — tapi menunjukkan pattern yang perlu diperhatikan untuk DSLB throttling. |

---

## 7. Pertanyaan Terbuka

1. **Threshold status okupansi:** Berapa persen dari `capacity` yang mendefinisikan batas antara Kosong/Rendah/Sedang/Padat? Apakah harus bisa dikonfigurasi per-ruangan?

2. **Scope rekomendasi:** Ketika ruangan Padat, apakah rekomendasi hanya ruangan di **gedung/lantai yang sama**, atau seluruh sistem? Apakah kolom `building` dan `floor` perlu ditambahkan ke tabel `rooms`?

3. **Target pengguna:** Halaman ketersediaan ruangan ini diakses oleh role `mahasiswa`, `admin`, atau keduanya?

4. **Persistensi vs real-time:** Apakah status okupansi ruangan harus disimpan di tabel baru (agar bisa dianalisis historisnya), atau cukup dihitung on-the-fly dari `detection_logs` terbaru?

5. **Konflik scheduler:** Apakah Node.js `AutomationScheduler` dan `AutomationService` dimaksudkan sebagai fallback atau sudah seharusnya dimatikan karena digantikan oleh Python `ScheduleRunner` + `DecisionEngine`? Harus diklarifikasi sebelum DSLB ditambahkan.

6. **Ruangan simulasi:** Apakah Anda berencana menambah ruangan simulasi ke database yang TIDAK memiliki ESP32 fisik? Jika ya, apakah cukup menambahkan flag `is_virtual` di tabel `rooms` sebagai guard?

7. **Notifikasi:** Apakah DSLB perlu mengirim notifikasi (push/email) ketika ruangan menjadi Padat, atau cukup tampilan di dashboard?

8. **Frekuensi update status:** Apakah status okupansi ruangan harus diupdate setiap kali ada frame baru (setiap ~1 detik), atau cukup setiap interval log detection (setiap ~2 menit)?
