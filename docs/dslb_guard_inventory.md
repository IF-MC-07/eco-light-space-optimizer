# Inventaris Guard DSLB (Fase 5 Tahap A)

## 1. Tabel Inventaris Lengkap Titik Guard

### Titik Sisi Python (`service_ai`)

| # | File | Fungsi | Target / Topic | Guard Line | First Publish Line | Status | Catatan |
|---|------|--------|----------------|------------|--------------------|--------|---------|
| P1 | `service_ai/app/mqtt_commands.py` | `send_light_command` | `devices/{room_id}/light/{relay}` | 25 | 41 | ✅ Dijaga | Guard langsung sebelum publish ESP32 |
| P2 | `service_ai/app/mqtt_commands.py` | `send_ac_command` | `devices/{room_id}/ac` | 51 | 65 | ✅ Dijaga | Guard langsung sebelum publish ESP32 |
| P3 | `service_ai/app/mqtt_commands.py` | `request_status` | `devices/{room_id}/status/request` | 76 | 85 | ✅ Dijaga | Guard status request ke ESP32 |
| P4 | `service_ai/app/schedule_runner.py` | `_trigger_room_devices` | Perangkat & DB Room | 281 | 328 | ✅ Dijaga | Guard di awal fungsi sebelum query device & publish |
| P5 | `service_ai/app/boot_recovery.py` | `restore_for_room` | Perangkat & DB Room | 55 | 131 | ✅ Dijaga | Guard di awal fungsi sebelum check schedule & restore |

### Titik Sisi Node.js (`server`)

| # | File | Fungsi | Target / Topic | Guard Line | First Publish Line | Status | Catatan |
|---|------|--------|----------------|------------|--------------------|--------|---------|
| N1 | `server/app/services/lightControlService.js` | `update` | `kelas/control` & `devices/{roomId}/light/{relay}` | 26 | 41 | ✅ Dijaga | Room ID di-lookup terpisah; guard sebelum update DB & publish kelas/control |
| N2 | `server/app/services/lightControlService.js` | `update` | `devices/{roomId}/light/{relay}` | 26 | 55 | ✅ Dijaga | Tercakup oleh guard N1 |
| N3 | `server/app/services/acControlService.js` | `update` | `devices/{room_id}/ac` | 23 | 39 | ✅ Dijaga | Guard sebelum update DB & publish AC |
| N4 | `server/app/services/automationScheduler.js` | `turnOn` | `devices/{room_id}/light/{relay}` | 74 | 84 | ✅ Dijaga | Guard setelah ambil schedule.room_id sebelum update DB & publish |
| N5 | `server/app/services/automationScheduler.js` | `turnOff` | `devices/{room_id}/light/{relay}` | 98 | 108 | ✅ Dijaga | Guard setelah ambil schedule.room_id sebelum update DB & publish |
| N6 | `server/app/services/automationService.js` | `triggerLightAction` | `kelas/control` | 84 | 110 | ✅ Dijaga | Lookup room_id dari Zone di awal; guard sebelum update DB & publish kelas/control |
| N7 | `server/app/services/automationService.js` | `triggerLightAction` | `devices/{roomId}/light/{relay}` | 84 | 123 | ✅ Dijaga | Tercakup oleh guard N6 |
| N8 | `server/app/controllers/monitoring.controller.js` | `updateDevice` | `kelas/control` (device_status) | 152 | 178 | ✅ Dijaga | Lookup room_id di awal; guard sebelum save device, update DB & publish kelas/control |
| N9 | `server/app/controllers/monitoring.controller.js` | `updateDevice` | `devices/{room_id}/ac` (device_status) | 152 | 200 | ✅ Dijaga | Tercakup oleh guard N8 |
| N10 | `server/app/controllers/monitoring.controller.js` | `updateDevice` | `kelas/control` (light_status) | 152 | 227 | ✅ Dijaga | Tercakup oleh guard N8 |
| N11 | `server/app/controllers/monitoring.controller.js` | `updateDevice` | `devices/{room_id}/ac` (ac_status/temp) | 152 | 267 | ✅ Dijaga | Tercakup oleh guard N8 |

---

## 2. Titik Pengecualian & Alasan

### 1. `service_ai/app/decision_engine.py` (`process_inference`, `_turn_ac_on`, `_turn_ac_off`)
- **Alasan Tidak Di-Guard**:
  Ruangan simulasi (`is_simulated = true`) tidak memiliki kamera fisik di tabel `cameras`. Pemanggilan `process_inference` selalu dipicu oleh deteksi frame kamera via MQTT (`ai/inference/result/<camera_id>`), sehingga fungsi ini tidak pernah dipanggil untuk ruangan simulasi.
  Selain itu, seandainya ada panggilan tak terduga, panggilan `send_light_command` dan `send_ac_command` di dalamnya tetap dijaga oleh guard sentral di `mqtt_commands.py`.

### 2. `server/app/controllers/monitoring.controller.js:postMasterControl`
- **Alasan Tidak Di-Guard**:
  Fungsi ini menjalankan operasi bulk (`UPDATE light_controls ... WHERE {}` dan `UPDATE ac_controls ... WHERE {}`) tanpa filter per ruangan.
- **Syarat Keamanan**:
  1. Ruangan simulasi **tidak memiliki** baris kontrol di tabel `light_controls` maupun `ac_controls`.
  2. Perintah `simulator --seed` hanya membuat baris pada tabel `rooms` (dengan `is_simulated = true`), tanpa membuat baris pada `iot_devices`, `light_controls`, atau `ac_controls`.
  3. Dengan demikian, operasi bulk di `postMasterControl` tidak pernah mengubah state perangkat untuk ruangan simulasi, dan tidak ada publish MQTT yang dilakukan dari fungsi ini.
  4. Perilaku ini diverifikasi dengan unit test khusus.

### 3. `mqttService.publish` (Node.js MQTT Wrapper)
- **Hasil Pemeriksaan**:
  Semua publish MQTT di sisi Node.js memang memanggil `mqttService.publish(topic, payload)`.
- **Alasan Guard Kedua Tidak Ditambahkan di Sini**:
  1. Method `mqttService.publish` adalah fungsi sinkron (synchronous) tanpa `await`.
  2. Topic global seperti `kelas/control` sama sekali tidak memuat `room_id` di dalam string topic (hanya `device_id` / `zone_id` di payload).
  3. Memeriksa database memerlukan pemanggilan asynchronous (`await db.sequelize.query(...)`), yang tidak dapat dilakukan di dalam fungsi sinkron tanpa mengubah tanda tangan method dan seluruh titik pemanggilnya.
  4. Cache dalam memori tidak selalu terisi (cold cache), sehingga pengecekan sinkron tidak dapat menjamin keandalan lookup. Oleh karena itu, guard dipasang pada caller level (di awal fungsi masing-masing service/controller) sebelum pemanggilan publish pertama.

### 4. Topic Hasil Inferensi & Konfigurasi (Bukan Perintah ESP32)
- `service_ai/app/mqtt_subscriber.py:59` (`ai/inference/result`): Hasil inferensi model AI.
- `service_ai/app/results.py:15`: Hasil deteksi bounding box.
- `server/app/controllers/zoneController.js:44-76` (`ai/zone/reload`): Sinyal reload konfigurasi poligon zona.
- `service_ai/app/mqtt_commands.py:handle_status_response`: Membaca status aktual dari ESP32 fisik untuk disimpan ke DB; bukan perintah perangkat.

