import os, sys, logging
_dir = os.path.dirname(os.path.abspath(__file__))
if _dir not in sys.path:
    sys.path.insert(0, _dir)
from app.config import Config
from app.app import app, socketio  # init_db + data_generator auto-start on import
logger = logging.getLogger("run")
if __name__ == "__main__":
    logger.info("===== SmartDorm Starting =====")
    os.makedirs(os.path.dirname(Config.DATABASE_PATH), exist_ok=True)
    is_prod = os.environ.get("RENDER") or os.environ.get("PORT")
    socketio.run(app, debug=not is_prod, host=Config.FLASK_HOST, port=Config.FLASK_PORT, allow_unsafe_werkzeug=True)
