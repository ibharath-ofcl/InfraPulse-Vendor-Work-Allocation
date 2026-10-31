# InfraPulse AI — Intelligent Infrastructure Lifecycle, Vendor Coordination & Quality Assurance Platform

[![Stage 1: Project Foundation & Architecture](https://img.shields.io/badge/Stage%2001-Foundation%20%26%20Architecture%20Complete-brightgreen)](docs/DEVELOPMENT_ROADMAP.md)
[![Java](https://img.shields.io/badge/Java-21%20LTS-orange)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20PostGIS%203.4-blue)](https://postgis.net/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-yellow)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-teal)](https://fastapi.tiangolo.com/)

InfraPulse AI is an enterprise infrastructure project lifecycle coordination and quality assurance platform designed to manage multiple vendors operating across shared geographical zones. The platform provides centralized PIN-code-based work allocation, strictly enforces sequential work dependencies, inspects vendor-submitted photographic evidence using computer vision, and releases milestone payments only upon verified quality completion.

---

## Architecture Overview

InfraPulse AI follows a **modular monolithic backend** pattern with an independent, dedicated **Python AI vision service** and a modern **React SPA frontend**:

```
InfraPulse-Vendor-Work-Allocation/
├── frontend/             # React 18, TypeScript, Vite, Tailwind CSS, Lucide
├── backend/              # Spring Boot 3.3, Java 21, Spring Data JPA, Flyway
├── ai-service/           # Python 3.11+, FastAPI, OpenCV, Pillow, Pydantic
├── docs/                 # Architectural specifications & design documents
│   ├── PROJECT_OVERVIEW.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_CONVENTIONS.md
│   └── DEVELOPMENT_ROADMAP.md
├── docker-compose.yml    # Development & container orchestration
├── .env.example          # Baseline environment template
└── README.md
```

---

## Technology Stack

| Service | Technology | Key Libraries / Features |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | TypeScript, Tailwind CSS, React Router v6, Axios, Lucide React, Recharts |
| **Backend** | Spring Boot 3.3 (Java 21) | Spring Web, Spring Data JPA, Spring Security, Flyway, PostgreSQL Driver, Bean Validation |
| **Database** | PostgreSQL 16 + PostGIS 3.4 | Geospatial indexing, boundary polygons, spatial distance queries, Flyway migrations |
| **AI Service** | FastAPI (Python 3.11+) | Uvicorn, OpenCV, Pillow, Pydantic v2, Pytest |
| **Orchestration**| Docker & Docker Compose | Multi-stage Dockerfiles, healthchecks, bridge network |

---

## Prerequisites

Before running the application locally, ensure you have the following installed:
- **Node.js**: `v20.x` or `v22.x+` (with `npm`)
- **Java Development Kit (JDK)**: `21 LTS` or higher
- **Apache Maven**: `3.9.x` or higher
- **Python**: `3.11+` (with `pip` and `venv`)
- **Docker & Docker Compose**: Modern Docker Desktop with Docker Compose v2+

---

## Service Ports & Health Endpoints

| Service | Port | Endpoint | Expected Response |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | `3000` (or `5173`) | `GET http://localhost:3000/` | Interactive Landing Page |
| **Backend API** | `8080` | `GET http://localhost:8080/api/health` | `{"status":"UP","application":"InfraPulse AI"}` |
| **AI Vision Service** | `8000` | `GET http://localhost:8000/health` | `{"status":"UP","service":"InfraPulse AI Vision Service"}` |
| **PostgreSQL (PostGIS)**| `5432` | `TCP localhost:5432` | Database: `infrapulse_db` |

---

## Environment Configuration

1. Copy the root environment template:
   ```bash
   cp .env.example .env
   ```
2. Each service also contains an independent `.env.example`:
   - `frontend/.env.example`
   - `backend/.env.example`
   - `ai-service/.env.example`

---

## Execution Commands

### Option A: Run via Docker Compose (Recommended)

To launch the complete platform (PostgreSQL with PostGIS, Backend, AI Service, and Frontend):

```bash
# Start all containers in the background
docker compose up -d

# Check status of running containers
docker compose ps

# View real-time logs
docker compose logs -f

# Stop all containers
docker compose down
```

---

### Option B: Run Services Locally (Individual Development)

#### 1. Database (PostgreSQL with PostGIS)
Launch only the PostGIS container via Docker:
```bash
docker compose up -d postgres
```

#### 2. Backend (Spring Boot 3.3 & Java 21)
```bash
cd backend

# Compile, run tests and package
mvn clean test

# Run the Spring Boot application
mvn spring-boot:run
```
*Health endpoint test:*
```bash
curl http://localhost:8080/api/health
```

#### 3. AI Service (Python FastAPI)
```bash
cd ai-service

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run automated tests
pytest

# Start FastAPI server with live reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Health endpoint test:*
```bash
curl http://localhost:8000/health
```

#### 4. Frontend (React + Vite)
```bash
cd frontend

# Install dependencies
npm install

# Build verification
npm run build

# Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Documentation Index

- [Project Overview & Demonstration Scenario](docs/PROJECT_OVERVIEW.md)
- [System Architecture & Technology Choices](docs/ARCHITECTURE.md)
- [Database Schema & PostGIS Strategy](docs/DATABASE_DESIGN.md)
- [API Conventions & Error Standards](docs/API_CONVENTIONS.md)
- [15-Stage Development Roadmap](docs/DEVELOPMENT_ROADMAP.md)

---

## Official Repository & Branch Strategy

- **Official Repository**: `https://github.com/ibharath-ofcl/InfraPulse-Vendor-Work-Allocation.git`
- **Active Branch**: `main`
- **Current Stage**: `Stage 01 — Project Foundation & Architecture`
