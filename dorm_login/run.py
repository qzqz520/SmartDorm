import os, sys, threading, logging
_dir = os.path.dirname(os.path.abspath(__file__))
if _dir not in sys.path:
    sys.path.insert(0, _dir)
from app.config import Config
from app.models import init_db
from app.app import app, socketio
from app.data_generator import run_data_generator
logger = logging.getLogger("run")
if __name__ == "__main__":
    logger.info("===== SmartDorm Starting =====")
    os.makedirs(os.path.dirname(Config.DATABASE_PATH), exist_ok=True)
    init_db()
    gen_thread = threading.Thread(target=run_data_generator, daemon=True)
    gen_thread.start()
    logger.info("Real-time data generator started")
    socketio.run(app, debug=True, host=Config.FLASK_HOST, port=Config.FLASK_PORT, allow_unsafe_werkzeug=True)
