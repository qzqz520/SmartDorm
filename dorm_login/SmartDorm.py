import os, sys, time, webbrowser, threading, logging, shutil, socket

_dir = os.path.dirname(os.path.abspath(__file__))
if _dir not in sys.path:
    sys.path.insert(0, _dir)

from app.config import Config
from app.models import init_db
from app.app import app, socketio
from app.data_generator import run_data_generator

if getattr(sys, "frozen", False):
    data_dir = os.path.join(os.path.dirname(sys.executable), "data")
    db_path = os.path.join(data_dir, "dormitory.db")
    if not os.path.exists(db_path):
        os.makedirs(data_dir, exist_ok=True)
        bundled_db = os.path.join(sys._MEIPASS, "data", "dormitory.db")
        if os.path.exists(bundled_db):
            shutil.copy2(bundled_db, db_path)

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def start_server():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    logger = logging.getLogger("SmartDorm")
    # init_db() and data_generator are auto-started by app.app module import
    local_ip = get_local_ip()
    print("=" * 50)
    print("  智慧宿舍管理系统 - 已启动")
    print("=" * 50)
    print("  本机访问: http://127.0.0.1:{}".format(Config.FLASK_PORT))
    print("  分享地址: http://{}:{}".format(local_ip, Config.FLASK_PORT))
    print("  （同网络下的其他设备可访问分享地址）")
    print("  管理员: admin / admin123")
    print("  学生:   2021001 / 123456")
    print("=" * 50)
    webbrowser.open("http://127.0.0.1:{}".format(Config.FLASK_PORT))
    is_prod = os.environ.get("RENDER") or os.environ.get("PORT")
    socketio.run(app, debug=not is_prod, host=Config.FLASK_HOST, port=Config.FLASK_PORT, allow_unsafe_werkzeug=True, use_reloader=False)

if __name__ == "__main__":
    start_server()