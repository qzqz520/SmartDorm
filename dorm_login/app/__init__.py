from app.config import Config
from app.models import init_db
from app.mqtt_client import set_socketio, start_mqtt
from app.routes import auth_bp, monitor_bp, admin_bp, api_bp
