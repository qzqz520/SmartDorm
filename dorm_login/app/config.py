import os
import sys
import secrets
from pathlib import Path

if getattr(sys, "frozen", False):
    _EXE_DIR = Path(sys.executable).resolve().parent
    _DATA_DIR = _EXE_DIR / "data"
    _LOG_DIR = _EXE_DIR / "logs"
else:
    _BASE = Path(__file__).resolve().parent.parent
    _DATA_DIR = _BASE / "data"
    _LOG_DIR = _BASE / "logs"

# Ensure directories exist (for frozen exe)
_DATA_DIR.mkdir(parents=True, exist_ok=True)
_LOG_DIR.mkdir(parents=True, exist_ok=True)

class Config:
    SECRET_KEY = os.environ.get("SMARTDORM_SECRET_KEY") or secrets.token_hex(32)
    FLASK_HOST = os.environ.get("SMARTDORM_HOST", "0.0.0.0")
    FLASK_PORT = int(os.environ.get("PORT") or os.environ.get("SMARTDORM_PORT", 8888))
    DATABASE_PATH = os.environ.get("SMARTDORM_DB", str(_DATA_DIR / "dormitory.db"))
    MQTT_BROKER = os.environ.get("SMARTDORM_MQTT_BROKER", "localhost")
    MQTT_PORT = int(os.environ.get("SMARTDORM_MQTT_PORT", 8866))
    MQTT_TOPIC = os.environ.get("SMARTDORM_MQTT_TOPIC", "dorm/sensor")
    TEMP_HIGH_THRESHOLD = float(os.environ.get("SMARTDORM_TEMP_HIGH", 37.0))
    SMOKE_HIGH_THRESHOLD = int(os.environ.get("SMARTDORM_SMOKE_HIGH", 50))
    MAX_DORM_CAPACITY = int(os.environ.get("SMARTDORM_MAX_CAPACITY", 4))
    DEFAULT_WATER_RATE = float(os.environ.get("SMARTDORM_WATER_RATE", 3.5))
    DEFAULT_ELECTRICITY_RATE = float(os.environ.get("SMARTDORM_ELECTRICITY_RATE", 0.6))
    LOG_FILE = os.environ.get("SMARTDORM_LOG_FILE", str(_LOG_DIR / "smartdorm.log"))
    LOG_LEVEL = os.environ.get("SMARTDORM_LOG_LEVEL", "INFO")
