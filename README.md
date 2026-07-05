# Eco-Light & AC Space Optimizer

A comprehensive system for real-time occupancy detection and automated control of lighting and climate systems in institutional spaces. The system integrates computer vision-based people detection with IoT device management and MQTT-based automation.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Prerequisites](#prerequisites)
5. [Installation &amp; Setup](#installation--setup)
6. [Configuration](#configuration)
7. [Running the System](#running-the-system)
8. [AI Inference Model](#ai-inference-model)
9. [Testing](#testing)
10. [API Documentation](#api-documentation)
11. [Known Limitations &amp; Future Work](#known-limitations--future-work)

---

## System Architecture

The system is organized into three main tiers:

### 1. **Client (Web UI)**

- **Framework**: Next.js 16 with TypeScript and Tailwind CSS
- **Responsibilities**:
  - Role-based dashboard for Admin and Student users
  - Real-time monitoring of room occupancy and device status
  - Device configuration and automation scheduling
  - Energy usage visualization and savings reporting
- **Key Features**:
  - Responsive design with drag-and-drop room configuration
  - Live streaming from IP cameras
  - Export data to CSV and PDF
  - Automated light and AC control based on occupancy

### 2. **Backend Server (API & Database)**

- **Framework**: Express.js 5 with Node.js
- **Database**: PostgreSQL (primary), Supabase (cloud option)
- **Responsibilities**:
  - RESTful API endpoints for all system resources
  - Authentication and role-based access control (RBAC)
  - Data aggregation and reporting
  - Scheduler for device automation
- **Key Modules**:
  - User & Room Management
  - IoT Device Control (lights, AC, sensors)
  - Automation Scheduling
  - Energy Monitoring & Cost Analysis

### 3. **AI Service (Real-time Inference)**

- **Framework**: FastAPI (Python)
- **Primary ML Model**: YOLOv8 Nano (pre-trained, `yolov8n.pt`)
- **Fallback ML Model**: Fine-tuned YOLOv8 (`best.pt`)
- **Responsibilities**:
  - Real-time people detection from camera streams
  - Occupancy zone mapping and counting
  - MQTT-based device control signals
  - Snapshot and inference result logging
- **Communication**:
  - Receives camera streams via RTSP/HTTP
  - Sends occupancy counts via MQTT
  - Stores snapshots with annotations

---

## Project Structure

```
eco-light-space-optimizer/
├── client/                    # Next.js web frontend
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # UI components
│   │   ├── features/         # Feature modules (auth, dashboard, etc.)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and API client
│   │   └── types/            # TypeScript type definitions
│   └── package.json
│
├── server/                    # Express.js backend API
│   ├── app/
│   │   ├── app.js            # Express app initialization
│   │   ├── server.js         # Server entry point
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Route handlers
│   │   ├── models/           # Sequelize ORM models
│   │   ├── routes/           # API route definitions
│   │   ├── middlewares/      # Custom middleware (auth, RBAC, etc.)
│   │   ├── services/         # Business logic
│   │   ├── validations/      # Request validation schemas
│   │   └── utils/            # Helper functions
│   ├── migrations/           # Database migrations
│   ├── seed.js               # Database seeding script
│   └── package.json
│
├── service_ai/               # Python FastAPI AI service
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── inference_realtime.py  # Real-time inference worker
│   │   ├── snapshot.py       # Snapshot capture and logging
│   │   ├── decision_engine.py     # Occupancy-based automation logic
│   │   ├── mqtt_subscriber.py     # MQTT control receiver
│   │   ├── mqtt_commands.py       # MQTT command parser
│   │   ├── camera_loader.py       # Camera configuration loader
│   │   ├── zona_loader.py         # Zone/region loader from DB
│   │   └── models/           # Pre-trained ML models (not committed)
│   ├── tests/                # Unit, integration, and Selenium tests
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment configuration template
│
├── broker/                   # MQTT Broker (Mosquitto)
│   └── config/
│       └── mosquitto.conf    # Mosquitto configuration
│
└── README.md                 # This file
```

---

## Technology Stack

### Frontend

- **Next.js** 16.2.4 – Full-stack React framework
- **React** 19 – UI library
- **TypeScript** – Type safety
- **Tailwind CSS** – Utility-first CSS framework
- **Radix UI** – Unstyled, accessible UI components
- **TanStack React Query** – Server state management
- **Axios** – HTTP client

### Backend

- **Node.js** – JavaScript runtime
- **Express.js** 5 – Web framework
- **Sequelize** 6 – ORM for PostgreSQL
- **PostgreSQL** – Primary database
- **Redis** – Session and caching (optional)
- **MQTT** – Message broker for IoT device control
- **JWT** – Token-based authentication
- **Joi** – Schema validation

### AI & ML

- **Python** 3.x
- **FastAPI** – Modern web framework
- **Ultralytics YOLOv8** – Object detection model
- **OpenCV** – Computer vision library
- **PyTorch** – Deep learning framework
- **Paho MQTT** – MQTT client for Python
- **SQLAlchemy** – Python ORM

### Testing & DevOps

- **Jest** – JavaScript unit testing
- **Pytest** – Python unit testing
- **Selenium** – End-to-end browser testing
- **Locust** – Load testing (performance analysis)
- **Docker** – Containerization (optional)

---

## Prerequisites

- **Node.js**: v18+ (check with `node --version`)
- **Python**: 3.9+ (check with `python --version`)
- **PostgreSQL**: v12+ (or Supabase account for cloud database)
- **MQTT Broker**: Mosquitto or equivalent
- **Git**: for version control

### Optional but Recommended

- **Docker & Docker Compose** – For containerized deployment
- **Redis** – For caching and session management
- **Visual Studio Code** – With Pylance, ESLint, Prettier extensions

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/IF-MC-07/eco-light-space-optimizer.git
cd eco-light-space-optimizer
```

### 2. Setup Backend (Express.js)

```bash
cd server
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your database credentials and API settings
nano .env  # or use your preferred editor

# Run database migrations
npm run db:reset     # Seeds database with initial data

# Start backend in development mode
npm run dev
```

**Backend will be available at**: `http://localhost:5000`

### 3. Setup Frontend (Next.js)

```bash
cd ../client
npm install

# Copy environment template
cp .env.example .env

# Update .env with API URL (should point to your backend)
# Example: NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Start frontend in development mode
npm run dev
```

**Frontend will be available at**: `http://localhost:3000`

### 4. Setup AI Service (Python FastAPI)

```bash
cd ../service_ai

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download pre-trained YOLOv8 model
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

# Copy environment template
cp .env.example .env

# Edit .env with your database and MQTT broker settings
nano .env

# Start AI service
python -m uvicorn app.main:app --reload --port 8000
```

**AI Service will be available at**: `http://localhost:8000`

### 5. Setup MQTT Broker (Mosquitto)

```bash
# On macOS
brew install mosquitto
mosquitto -c broker/config/mosquitto.conf

# On Linux (Ubuntu/Debian)
sudo apt-get install mosquitto
sudo systemctl start mosquitto

# On Windows
# Download from: https://mosquitto.org/download/
# Or use Docker: docker run -d -p 1883:1883 eclipse-mosquitto
```

---

## Configuration

### Environment Variables

Each component requires a `.env` file. Templates are provided in each directory.

#### Server `.env`

```env
# Database
DB_TYPE=postgresql  # or 'supabase'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eco_light_optimizer
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_SSL=false

# API
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secure_jwt_secret_key

# MQTT
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USER=your_mqtt_user
MQTT_PASSWORD=your_mqtt_password

# AI Service
AI_SERVICE_URL=http://localhost:8000
```

#### Client `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### AI Service `.env`

```env
# Database
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eco_light_optimizer
DB_USER=postgres
DB_PASSWORD=your_secure_password

# MQTT
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USER=your_mqtt_user
MQTT_PASSWORD=your_mqtt_password

# AI Inference
MODEL_PATH=yolov8n.pt           # Primary model (pre-trained)
CONF_THRESHOLD=0.25             # Detection confidence threshold
IOU_THRESHOLD=0.45              # Intersection-over-Union threshold
SNAPSHOT_INTERVAL=3              # Seconds between frames
ZONE_FETCH_INTERVAL=60           # Seconds between zone refreshes

# API
PORT=8000
API_URL=http://localhost:5000/api
CLIENT_URL=http://localhost:3000
```

---

## Running the System

### Development Mode (All Components)

**Terminal 1 - MQTT Broker**:

```bash
mosquitto -c broker/config/mosquitto.conf
```

**Terminal 2 - Backend**:

```bash
cd server
npm run dev
```

**Terminal 3 - Frontend**:

```bash
cd client
npm run dev
```

**Terminal 4 - AI Service**:

```bash
cd service_ai
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

Access the system at: **http://localhost:3000**

### Production Mode

[CONFIRM: Provide production deployment instructions including reverse proxy setup, HTTPS configuration, and systemd service files if applicable]

---

## AI Inference Model

The AI service uses a dual-model inference strategy for occupancy detection:

### Model Loading Logic

```python
# Primary Model: best.pt (fine-tuned YOLOv8)
# - Custom-trained on institution-specific occupancy data
# - Intended for high accuracy in target environments
# - Location: app/models/best.pt

# Fallback Model: yolov8n.pt (pre-trained YOLOv8 Nano)
# - Official Ultralytics pre-trained model
# - Loaded from Ultralytics repository if not cached locally
# - Lightweight and universally applicable

def get_model():
    # Both models loaded at startup with thread-safe locking
    # Primary model attempted first; fallback loaded in parallel
```

### Fallback Trigger Condition

The system switches from the primary model to the fallback model when:

```
if results is None or len(results[0].boxes) == 0:
    # Use fallback model (yolov8n.pt)
```

**Current Behavior**:

- If the primary model (`best.pt`) produces **zero detections** in a frame, the fallback model is invoked.
- This is a heuristic fallback, not a reliability assertion.
- **Important Note**: The effectiveness of this fallback depends on the specific training of `best.pt`. If the primary model systematically under-detects in certain conditions, switching to the fallback may or may not improve results. This requires empirical validation in production.

### Inference Parameters

- **Confidence Threshold (`CONF_THRESHOLD`)**: 0.25 – Minimum detection probability
- **IOU Threshold (`IOU_THRESHOLD`)**: 0.45 – Non-maximum suppression threshold
- **Snapshot Interval**: 3 seconds – Frequency of frame capture
- **Zone Fetch Interval**: 60 seconds – How often occupancy zones are refreshed from database

### Output

For each frame, the system:

1. Detects people (class 0 in COCO dataset)
2. Maps detections to predefined occupancy zones
3. Counts people per zone
4. Publishes counts via MQTT to trigger device control
5. Stores annotated snapshots in database

---

## Testing

### Backend Tests (Node.js + Jest)

```bash
cd server
npm test
```

### AI Service Tests (Python + Pytest)

```bash
cd service_ai
pytest tests/unit/ -v                    # Unit tests
pytest tests/selenium/ -v                # End-to-end browser tests
```

### Load Testing (Locust)

```bash
cd service_ai
locust -f tests/locust/locustfile.py --host=http://localhost:8000
```

Then open **http://localhost:8089** to configure and run load tests.

### Selenium Tests (Automated Browser Testing)

```bash
cd service_ai

# Run specific device configuration tests
pytest tests/selenium/test_device.py::TestDeviceAndControl::test_tc_admin_add_light_device -v
pytest tests/selenium/test_device.py::TestDeviceAndControl::test_tc_admin_add_camera_valid -v
pytest tests/selenium/test_device.py::TestDeviceAndControl::test_tc_admin_add_camera_invalid_ip -v
```

---

## API Documentation

### Authentication Endpoints

#### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response: { "data": { "token": "jwt_token", "user": {...} } }
```

#### Refresh Token

```
POST /api/auth/refresh
Authorization: Bearer {token}

Response: { "data": { "token": "new_jwt_token" } }
```

### Device Management

#### Add Device

```
POST /api/iot-devices
Authorization: Bearer {token}
Content-Type: application/json

{
  "room_id": "room_uuid",
  "device_name": "Light 1",
  "device_type": "LIGHT",  // or "AC", "SENSOR", "CAMERA"
  "status": "ACTIVE"
}
```

#### Get All Devices

```
GET /api/iot-devices
Authorization: Bearer {token}
```

### Monitoring & Control

#### Get Live Monitoring Stats

```
GET /api/monitoring/stats
Authorization: Bearer {token}

Response: { "data": { "active_lights": 5, "total_lights": 20, "running_ac": 2, ... } }
```

#### Master Control (Toggle All)

```
POST /api/monitoring/master-control
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "KILL_ALL"  // or "ECO_PULSE"
}
```

### Energy & Savings

#### Get Energy Summary

```
GET /api/energy/summary
Authorization: Bearer {token}
```

#### Get Savings Report

```
GET /api/savings/summary
Authorization: Bearer {token}
```

For complete API documentation, see: [CONFIRM: Link to API docs or Swagger endpoint]

---

## Known Limitations & Future Work

### Current Limitations

1. **Model Fallback Reliability**: The dual-model fallback strategy relies on the assumption that if the primary model returns zero detections, the fallback should be tried. However, the effectiveness of this approach depends heavily on the specific training of the `best.pt` model and has not been empirically validated in production across diverse environments.
2. **RTSP Stream Timeout**: OpenCV RTSP connections may hang if the camera is unreachable. This is partially mitigated by setting `OPENCV_FFMPEG_CAPTURE_OPTIONS`, but robust reconnection logic is not yet implemented.
3. **Zone Persistence**: Occupancy zones are fetched every 60 seconds from the database. Changes to zones require a wait before taking effect.
4. **MQTT Quality of Service**: The system uses QoS 0 (fire-and-forget) for MQTT messages. Critical control commands may be lost if the broker is temporarily unavailable.
5. **Horizontal Scaling**: The AI service is currently single-threaded per camera. Scaling to multiple cameras requires process management (e.g., systemd, Docker, Kubernetes).

### Planned Improvements

- [ ] Implement robust camera reconnection with exponential backoff
- [ ] Add MQTT message persistence for critical commands
- [ ] Support multiple AI inference workers with load balancing
- [ ] Empirical evaluation of the dual-model fallback in production environments
- [ ] Implement confidence-based alerting when primary model confidence drops below threshold
- [ ] Add support for custom model upload and switching via API
- [ ] Real-time model performance metrics dashboard
- [ ] Integration with cloud storage for snapshot archival

---

## License

Licensed by MIT License

---

## Authors & Contributors

Code Team: IF-4MC-07

Project Manager : Yeni Rokhayati S.Si., M.Sc.

AI & Web :  [![Github Pages](<https://img.shields.io/badge/Ridho%20Putrawan%20-%203312411050-100000?style=flat&logo=github&logoColor=white>)](https://github.com/sweeefff)

IoT : [![Github Pages](<https://img.shields.io/badge/Ruth%20Yohana%20Manurung-%203312411032-100000?style=flat&logo=github&logoColor=white>)](https://github.com/ruthyoh)


## Contact Support

- Email: ridhoptrawan@gmail.com
