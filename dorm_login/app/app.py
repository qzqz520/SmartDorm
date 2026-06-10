import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, redirect, url_for, session, render_template
from flask_wtf.csrf import CSRFProtect
from flask_socketio import SocketIO
from app.config import Config
from app.models import init_db
from app.mqtt_client import set_socketio as mqtt_set_socketio
from app.data_generator import set_socketio as gen_set_socketio, run_data_generator
from app.routes import auth_bp, monitor_bp, admin_bp, api_bp
import threading

logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        RotatingFileHandler(Config.LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["SECRET_KEY"] = Config.SECRET_KEY
app.config["WTF_CSRF_ENABLED"] = True

csrf = CSRFProtect(app)
socketio = SocketIO(app, async_mode="threading", cors_allowed_origins="*")

# 注册 SocketIO 到各个模块
mqtt_set_socketio(socketio)
gen_set_socketio(socketio)

csrf.exempt(api_bp)

app.register_blueprint(auth_bp)
app.register_blueprint(monitor_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(api_bp)

# ============================
# 页面路由
# ============================

@app.route("/")
def index():
    if "student_id" in session:
        return redirect(url_for("monitor.admin_monitor")) if session.get("is_admin") else redirect(url_for("monitor.monitor"))
    return redirect(url_for("auth.login"))

@app.route("/dashboard")
def dashboard():
    if "student_id" not in session:
        return redirect(url_for("auth.login"))
    return redirect(url_for("monitor.admin_monitor")) if session.get("is_admin") else redirect(url_for("monitor.monitor"))

@app.route("/student/repairs")
def student_repairs():
    return render_template("student_repairs.html") if "student_id" in session else redirect(url_for("auth.login"))

@app.route("/student/visitors")
def student_visitors():
    return render_template("student_visitors.html") if "student_id" in session else redirect(url_for("auth.login"))

@app.route("/student/scores")
def student_scores():
    return render_template("student_scores.html") if "student_id" in session else redirect(url_for("auth.login"))

@app.route("/student/utility")
def student_utility():
    return render_template("student_utility.html") if "student_id" in session else redirect(url_for("auth.login"))

@app.route("/student/announcements")
def student_announcements():
    return render_template("student_announcements.html") if "student_id" in session else redirect(url_for("auth.login"))

@app.route("/student/leave")
def student_leave():
    return render_template("student_leave.html") if "student_id" in session else redirect(url_for("auth.login"))

@app.errorhandler(400)
def csrf_error(e):
    logger.warning("CSRF validation failed: %s", e)
    return {"error": "CSRF 令牌缺失或无效"}, 400


# ============================
# 后台线程 —— 内置实时数据生成
# ============================

def _start_background_threads():
    """在 app 启动后启动各个后台线程"""
    # 内建随机数据生成器（无需 MQTT Broker）
    gen_thread = threading.Thread(target=run_data_generator, daemon=True)
    gen_thread.start()
    logger.info("Real-time data generator thread started")

    # MQTT 线程尝试连接（可选，若 broker 可用则自动接收外接数据）
    try:
        from app.mqtt_client import start_mqtt
        mqtt_thread = threading.Thread(target=start_mqtt, daemon=True)
        mqtt_thread.start()
        logger.info("MQTT listener thread started (optional)")
    except Exception:
        logger.info("MQTT not available, using only built-in generator")


if __name__ == "__main__":
    init_db()
    _start_background_threads()
    socketio.run(app, debug=True, host=Config.FLASK_HOST, port=Config.FLASK_PORT, allow_unsafe_werkzeug=True)
