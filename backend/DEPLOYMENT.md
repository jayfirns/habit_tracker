# Habit Tracker Backend Deployment

**Current Deployment:** LXC 108 (192.168.0.60:8000)  
**Status:** ✅ Production (systemd managed)  
**Deployed:** 2026-02-13

## Quick Start

```bash
# Clone repo
git clone https://github.com/jayfirns/habit_tracker.git
cd habit_tracker/backend

# Install dependencies
pip3 install -r requirements.txt --break-system-packages

# Run in development mode
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Production Deployment (systemd)

### Prerequisites
- Python 3.11+
- Dependencies: fastapi, sqlalchemy, uvicorn, alembic

### Installation

1. **Deploy application:**
   ```bash
   cd /root
   git clone https://github.com/jayfirns/habit_tracker.git
   cd habit_tracker
   ```

2. **Install dependencies:**
   ```bash
   pip3 install -r requirements.txt --break-system-packages
   ```
   
   Or for virtualenv (recommended for multi-user systems):
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Verify installation:**
   ```bash
   python3 -m uvicorn --version
   # Should show: Running uvicorn 0.40.0
   ```

### systemd Service

**File:** `/etc/systemd/system/habit-tracker.service`

```ini
[Unit]
Description=Habit Tracker FastAPI Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/habit_tracker/backend
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10
StandardOutput=append:/var/log/habits.log
StandardError=append:/var/log/habits.log

[Install]
WantedBy=multi-user.target
```

**If using virtualenv, modify ExecStart:**
```ini
ExecStart=/root/habit_tracker/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
```

**Enable and start:**
```bash
systemctl daemon-reload
systemctl enable habit-tracker.service
systemctl start habit-tracker.service
systemctl status habit-tracker.service
```

**Verify:**
```bash
curl http://localhost:8000
# Should return: {"message":"Welcome to FocusOS Backend!"}

curl http://localhost:8000/docs
# Should return Swagger UI HTML
```

**Test auto-start:**
```bash
reboot
# After reboot:
systemctl status habit-tracker.service
curl http://localhost:8000
```

## Application Details

### Entry Point
- **File:** `backend/main.py`
- **Port:** 8000 (configurable via uvicorn args)
- **Framework:** FastAPI with uvicorn ASGI server

### Database
- **Type:** SQLite
- **File:** `backend/data/habit_tracker.db` (auto-created)
- **ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic (in `backend/alembic/`)

### API Endpoints
- **Root:** `GET /` - Welcome message
- **Docs:** `/docs` - Interactive Swagger UI
- **OpenAPI:** `/openapi.json` - API specification
- **Health:** (implement as needed)

### Project Structure
```
backend/
├── main.py              # FastAPI application entry point
├── database.py          # Database connection and session management
├── models.py            # SQLAlchemy ORM models
├── schemas.py           # Pydantic schemas for request/response
├── crud.py              # Database operations
├── alembic/             # Database migrations
│   └── versions/
├── frontend/            # Static frontend files (if any)
└── tests/               # pytest test suite
```

## Current Production Instance (LXC 108)

- **Container:** LXC 108 (Debian 12)
- **IP:** 192.168.0.60
- **Access:** http://192.168.0.60:8000 or http://habits.johnfirnschild.com:8000
- **Service:** habit-tracker.service (enabled, running since 2026-02-13 01:33 UTC)
- **Dependencies:** System-wide Python packages (no virtualenv)
- **Logs:** /var/log/habits.log
- **Database:** /root/habit_tracker/backend/data/habit_tracker.db

## Troubleshooting

### Module not found errors (uvicorn, fastapi, etc.)
**Cause:** Dependencies not installed.  
**Fix:** Run `pip3 install -r requirements.txt --break-system-packages`

### Service fails to start
**Cause:** Working directory or python path incorrect.  
**Fix:** 
- Check `systemctl status habit-tracker.service` for errors
- Verify WorkingDirectory is `/root/habit_tracker/backend`
- Ensure `main.py` exists in that directory

### Database errors
**Cause:** SQLite database not initialized or permissions issue.  
**Fix:** 
- Check if `backend/data/` directory exists (create if missing)
- Run alembic migrations: `alembic upgrade head`
- Verify write permissions on `backend/data/`

### Port already in use
**Cause:** Another process using port 8000.  
**Fix:** 
```bash
lsof -i :8000  # Find process using port
kill <PID>     # Kill the process
# Or change port in systemd service file
```

### SSH hanging (LXC 108 specific issue)
**Cause:** Unknown - container was responsive via Proxmox API but SSH hung.  
**Fix:** Reboot the container via Proxmox API or web UI.

## Development Workflow

### Local development with auto-reload
```bash
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Running tests
```bash
cd backend
pytest
```

### Creating database migrations
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## Maintenance

### View logs
```bash
tail -f /var/log/habits.log
```

### Restart service
```bash
systemctl restart habit-tracker.service
```

### Update code (production)
```bash
cd /root/habit_tracker
git pull origin main
systemctl restart habit-tracker.service
```

### Backup database
```bash
cp /root/habit_tracker/backend/data/habit_tracker.db /backup/habit_tracker.db.$(date +%Y%m%d)
```

## Security Notes

- Current deployment runs as root (not recommended for production)
- Consider creating a dedicated service user
- No authentication implemented - add auth middleware for production
- SQLite is single-user - consider PostgreSQL for multi-user deployments
- HTTPS/TLS should be handled by reverse proxy (Nginx Proxy Manager)
