import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, redirect, url_for, session, render_template, jsonify, request
from flask_wtf.csrf import CSRFProtect
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager, jwt_required, get_jwt
from flask_cors import CORS
from werkzeug.security import generate_password_hash
from app.config import Config
from app.models import init_db, get_db
from app.mqtt_client import set_socketio as mqtt_set_socketio
from app.data_generator import set_socketio as gen_set_socketio, run_data_generator
from app.routes import auth_bp, monitor_bp, admin_bp, api_bp
import threading
import sqlite3

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
app.config["WTF_CSRF_ENABLED"] = False

# JWT 配置
app.config["JWT_SECRET_KEY"] = Config.SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 86400  # 24 小时
jwt = JWTManager(app)

# CORS 配置，允许前端开发服务器跨域访问
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

csrf = CSRFProtect(app)
socketio = SocketIO(app, async_mode="threading", cors_allowed_origins="*")

# 注册 SocketIO 到各个模块
mqtt_set_socketio(socketio)
gen_set_socketio(socketio)

# JWT tokens provide CSRF protection for all /api/ routes.
# Only session-based routes need Flask-WTF CSRF.
csrf.exempt(api_bp)
csrf.exempt(auth_bp)
import functools

def _exempt_api_routes():
    """Exempt all /api/* routes from CSRF (protected by JWT instead)."""
    for rule in app.url_map.iter_rules():
        if rule.rule.startswith("/api/"):
            view = app.view_functions.get(rule.endpoint)
            if view:
                csrf.exempt(view)

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

@app.route("/api/dashboard", methods=["GET"])
@jwt_required()
def api_dashboard():
    claims = get_jwt()
    db = get_db()
    stats = {
        "total_students": db.execute("SELECT COUNT(*) FROM students").fetchone()[0],
        "total_dorms": db.execute("SELECT COUNT(*) FROM dormitories").fetchone()[0],
        "pending_repairs": db.execute("SELECT COUNT(*) FROM repair_requests WHERE status='pending'").fetchone()[0],
        "pending_visitors": db.execute("SELECT COUNT(*) FROM visitors WHERE status='pending'").fetchone()[0],
        "pending_leaves": db.execute("SELECT COUNT(*) FROM leave_requests WHERE status='pending'").fetchone()[0],
        "active_alerts": 0,
    }
    db.close()
    return jsonify(stats)

# ============================
# Admin REST API (JWT-protected)
# ============================

def _admin_required():
    claims = get_jwt()
    if not claims.get("is_admin"):
        return jsonify({"error": "Forbidden"}), 403
    return None


# ===== Students API =====
@app.route("/api/admin/students", methods=["GET"])
@jwt_required()
def api_admin_students():
    err = _admin_required()
    if err: return err
    db = get_db()
    rows = db.execute(
        "SELECT id, student_id, name, dorm_number, is_admin, is_leader, bed_number FROM students ORDER BY id DESC"
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/students", methods=["POST"])
@jwt_required()
def api_admin_students_create():
    err = _admin_required()
    if err: return err
    data = request.get_json()
    db = get_db()
    try:
        db.execute(
            "INSERT INTO students (student_id, name, password_hash, dorm_number) VALUES (?,?,?,?)",
            [data["student_id"], data["name"],
             generate_password_hash(data.get("password", "123456")),
             data.get("dorm_number", "")]
        )
        db.commit()
        db.close()
        return jsonify({"message": "Created"}), 201
    except sqlite3.IntegrityError:
        db.close()
        return jsonify({"error": "Student ID already exists"}), 400


@app.route("/api/admin/students/<int:id>", methods=["PUT", "DELETE"])
@jwt_required()
def api_admin_student_item(id):
    err = _admin_required()
    if err: return err
    db = get_db()
    if request.method == "DELETE":
        s = db.execute("SELECT is_admin FROM students WHERE id = ?", (id,)).fetchone()
        if s and s["is_admin"] == 1:
            db.close()
            return jsonify({"error": "Cannot delete admin account"}), 400
        db.execute("DELETE FROM students WHERE id = ?", (id,))
        db.commit()
        db.close()
        return jsonify({"message": "Deleted"})
    data = request.get_json()
    db.execute(
        "UPDATE students SET name=?, dorm_number=? WHERE id=?",
        [data["name"], data.get("dorm_number", ""), id]
    )
    db.commit()
    db.close()
    return jsonify({"message": "Updated"})


# ===== Dormitories API =====
@app.route("/api/admin/dormitories", methods=["GET"])
@jwt_required()
def api_admin_dormitories():
    err = _admin_required()
    if err: return err
    db = get_db()
    rows = db.execute(
        "SELECT d.id, d.dorm_number, d.capacity, d.created_at, "
        "COALESCE((SELECT COUNT(*) FROM students s WHERE s.dorm_number = d.dorm_number AND s.is_admin = 0), 0) as occupant_count "
        "FROM dormitories d ORDER BY d.dorm_number"
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/dormitories", methods=["POST"])
@jwt_required()
def api_admin_dormitories_create():
    err = _admin_required()
    if err: return err
    data = request.get_json()
    db = get_db()
    try:
        db.execute(
            "INSERT INTO dormitories (dorm_number, capacity) VALUES (?,?)",
            [data["dorm_number"], data.get("capacity", 4)]
        )
        db.commit()
        db.close()
        return jsonify({"message": "Created"}), 201
    except sqlite3.IntegrityError:
        db.close()
        return jsonify({"error": "Dormitory number already exists"}), 400


@app.route("/api/admin/dormitories/<int:id>", methods=["PUT", "DELETE"])
@jwt_required()
def api_admin_dormitory_item(id):
    err = _admin_required()
    if err: return err
    db = get_db()
    if request.method == "DELETE":
        # Check if any students occupy this dorm
        dorm = db.execute("SELECT dorm_number FROM dormitories WHERE id = ?", (id,)).fetchone()
        if not dorm:
            db.close()
            return jsonify({"error": "Not found"}), 404
        occupant_count = db.execute(
            "SELECT COUNT(*) as cnt FROM students WHERE dorm_number = ? AND is_admin = 0",
            (dorm["dorm_number"],)
        ).fetchone()["cnt"]
        if occupant_count > 0:
            db.close()
            return jsonify({"error": "Dormitory has {} students, cannot delete".format(occupant_count)}), 400
        db.execute("DELETE FROM dormitories WHERE id = ?", (id,))
        db.commit()
        db.close()
        return jsonify({"message": "Deleted"})
    data = request.get_json()
    db.execute(
        "UPDATE dormitories SET dorm_number=?, capacity=? WHERE id=?",
        [data["dorm_number"], data["capacity"], id]
    )
    db.commit()
    db.close()
    return jsonify({"message": "Updated"})


# ===== Repairs API (table: repair_requests) =====
@app.route("/api/admin/repairs", methods=["GET"])
@jwt_required()
def api_admin_repairs():
    err = _admin_required()
    if err: return err
    db = get_db()
    rows = db.execute(
        "SELECT r.id, r.student_id, r.dorm_number, r.title, r.description, "
        "r.status, r.admin_remark, r.created_at, r.updated_at, "
        "s.name as student_name "
        "FROM repair_requests r "
        "LEFT JOIN students s ON r.student_id = s.student_id "
        "ORDER BY r.created_at DESC"
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/repairs/<int:id>", methods=["PUT"])
@jwt_required()
def api_admin_repair_item(id):
    err = _admin_required()
    if err: return err
    data = request.get_json()
    db = get_db()
    db.execute(
        "UPDATE repair_requests SET status=?, admin_remark=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        [data["status"], data.get("admin_remark", ""), id]
    )
    db.commit()
    db.close()
    return jsonify({"message": "Updated"})


# ===== Visitors API (actual columns differ!) =====
@app.route("/api/admin/visitors", methods=["GET"])
@jwt_required()
def api_admin_visitors():
    err = _admin_required()
    if err: return err
    db = get_db()
    rows = db.execute(
        "SELECT v.id, v.visitor_name, v.id_card, v.phone, "
        "v.visited_student_id, v.visited_dorm, v.purpose, "
        "v.status, v.check_in_time, v.check_out_time, v.created_at, "
        "s.name as student_name "
        "FROM visitors v "
        "LEFT JOIN students s ON v.visited_student_id = s.student_id "
        "ORDER BY v.created_at DESC"
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/visitors/<int:id>", methods=["PUT"])
@jwt_required()
def api_admin_visitor_item(id):
    err = _admin_required()
    if err: return err
    data = request.get_json()
    db = get_db()
    db.execute(
        "UPDATE visitors SET status=? WHERE id=?",
        [data["status"], id]
    )
    db.commit()
    db.close()
    return jsonify({"message": "Updated"})


# ===== Leaves API (table: leave_requests) =====
@app.route("/api/admin/leaves", methods=["GET"])
@jwt_required()
def api_admin_leaves():
    err = _admin_required()
    if err: return err
    db = get_db()
    rows = db.execute(
        "SELECT l.id, l.student_id, l.dorm_number, l.leave_type, l.reason, "
        "l.start_date, l.end_date, l.status, l.admin_remark, "
        "l.created_at, l.updated_at, "
        "s.name as student_name "
        "FROM leave_requests l "
        "LEFT JOIN students s ON l.student_id = s.student_id "
        "ORDER BY l.created_at DESC"
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/leaves/<int:id>", methods=["PUT"])
@jwt_required()
def api_admin_leave_item(id):
    err = _admin_required()
    if err: return err
    data = request.get_json()
    db = get_db()
    db.execute(
        "UPDATE leave_requests SET status=?, admin_remark=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        [data["status"], data.get("admin_remark", ""), id]
    )
    db.commit()
    db.close()
    return jsonify({"message": "Updated"})


# ===== Scores API (table: dorm_scores, no 'month' column!) =====
@app.route("/api/admin/scores", methods=["GET"])
@jwt_required()
def api_admin_scores():
    err = _admin_required()
    if err: return err
    db = get_db()
    rows = db.execute(
        "SELECT s.id, s.dorm_number, s.inspector_id, "
        "s.score_cleanliness, s.score_safety, s.score_discipline, "
        "s.total_score, s.remark, s.created_at "
        "FROM dorm_scores s ORDER BY s.created_at DESC"
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/scores", methods=["POST"])
@jwt_required()
def api_admin_scores_create():
    err = _admin_required()
    if err: return err
    data = request.get_json()
    claims = get_jwt()
    db = get_db()
    cleanliness = float(data.get("score_cleanliness", 0))
    safety = float(data.get("score_safety", 0))
    discipline = float(data.get("score_discipline", 0))
    total = round((cleanliness + safety + discipline) / 3, 1)
    db.execute(
        "INSERT INTO dorm_scores (dorm_number, inspector_id, score_cleanliness, score_safety, score_discipline, total_score, remark) "
        "VALUES (?,?,?,?,?,?,?)",
        [data["dorm_number"], claims.get("student_id", "admin"),
         cleanliness, safety, discipline, total,
         data.get("remark", "")]
    )
    db.commit()
    db.close()
    return jsonify({"message": "Created"}), 201


# ===== Utility API (table: utility_records) =====
@app.route("/api/admin/utility", methods=["GET"])
@jwt_required()
def api_admin_utility():
    err = _admin_required()
    if err: return err
    db = get_db()
    rows = db.execute(
        "SELECT u.id, u.dorm_number, u.billing_month, "
        "u.prev_water, u.curr_water, u.water_usage, u.water_fee, "
        "u.prev_electricity, u.curr_electricity, u.electricity_usage, u.electricity_fee, "
        "u.total_fee, u.is_paid, u.created_at "
        "FROM utility_records u ORDER BY u.billing_month DESC, u.dorm_number"
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/utility", methods=["POST"])
@jwt_required()
def api_admin_utility_create():
    err = _admin_required()
    if err: return err
    data = request.get_json()
    db = get_db()
    prev_water = float(data.get("prev_water", 0))
    curr_water = float(data.get("curr_water", 0))
    prev_electricity = float(data.get("prev_electricity", 0))
    curr_electricity = float(data.get("curr_electricity", 0))
    water_usage = max(0, round(curr_water - prev_water, 1))
    electricity_usage = max(0, round(curr_electricity - prev_electricity, 1))
    water_fee = round(water_usage * Config.DEFAULT_WATER_RATE, 2)
    electricity_fee = round(electricity_usage * Config.DEFAULT_ELECTRICITY_RATE, 2)
    total_fee = round(water_fee + electricity_fee, 2)
    db.execute(
        "INSERT INTO utility_records (dorm_number, billing_month, prev_water, curr_water, water_usage, water_fee, "
        "prev_electricity, curr_electricity, electricity_usage, electricity_fee, total_fee) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [data["dorm_number"], data.get("billing_month", ""),
         prev_water, curr_water, water_usage, water_fee,
         prev_electricity, curr_electricity, electricity_usage, electricity_fee, total_fee]
    )
    db.commit()
    db.close()
    return jsonify({"message": "Created"}), 201


# ===== Announcements API =====
@app.route("/api/admin/announcements", methods=["GET"])
@jwt_required()
def api_admin_announcements():
    err = _admin_required()
    if err: return err
    db = get_db()
    rows = db.execute(
        "SELECT a.id, a.title, a.content, a.is_pinned, a.is_active, "
        "a.created_by, a.created_at, a.expires_at "
        "FROM announcements a ORDER BY a.is_pinned DESC, a.created_at DESC"
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/announcements", methods=["POST"])
@jwt_required()
def api_admin_announcements_create():
    err = _admin_required()
    if err: return err
    data = request.get_json()
    claims = get_jwt()
    db = get_db()
    db.execute(
        "INSERT INTO announcements (title, content, is_pinned, is_active, created_by, expires_at) "
        "VALUES (?,?,?,?,?,?)",
        [data["title"], data["content"],
         data.get("is_pinned", 0), data.get("is_active", 1),
         claims.get("student_id", "admin"),
         data.get("expires_at") or None]
    )
    db.commit()
    db.close()
    return jsonify({"message": "Created"}), 201


@app.route("/api/admin/announcements/<int:id>", methods=["PUT", "DELETE"])
@jwt_required()
def api_admin_announcement_item(id):
    err = _admin_required()
    if err: return err
    db = get_db()
    if request.method == "DELETE":
        db.execute("DELETE FROM announcements WHERE id=?", (id,))
        db.commit()
        db.close()
        return jsonify({"message": "Deleted"})
    data = request.get_json()
    db.execute(
        "UPDATE announcements SET title=?, content=?, is_pinned=?, is_active=?, expires_at=? WHERE id=?",
        [data["title"], data["content"],
         data.get("is_pinned", 0), data.get("is_active", 1),
         data.get("expires_at") or None, id]
    )
    db.commit()
    db.close()
    return jsonify({"message": "Updated"})


# ============================================================
# Student APIs (scoped to current user)
# ============================================================

@app.route("/api/student/repairs", methods=["GET", "POST"])
@jwt_required()
def api_student_repairs():
    claims = get_jwt()
    student_id = claims.get("student_id")
    db = get_db()
    if request.method == "POST":
        data = request.get_json()
        db.execute("INSERT INTO repair_requests (student_id, dorm_number, title, description, status) VALUES (?,?,?,?,'pending')",
                   [student_id, data.get("dorm_number", ""), data.get("title", ""), data.get("description", "")])
        db.commit()
        db.close()
        return jsonify({"message": "Submitted"}), 201
    rows = db.execute("SELECT * FROM repair_requests WHERE student_id=? ORDER BY created_at DESC", [student_id]).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/student/visitors", methods=["GET", "POST"])
@jwt_required()
def api_student_visitors():
    claims = get_jwt()
    student_id = claims.get("student_id")
    db = get_db()
    if request.method == "POST":
        data = request.get_json()
        db.execute("INSERT INTO visitors (visited_student_id, visitor_name, phone, purpose, status) VALUES (?,?,?,?,'pending')",
                   [student_id, data["visitor_name"], data.get("phone", ""), data.get("purpose", "")])
        db.commit()
        db.close()
        return jsonify({"message": "Submitted"}), 201
    rows = db.execute("SELECT * FROM visitors WHERE visited_student_id=? ORDER BY created_at DESC", [student_id]).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/student/leaves", methods=["GET", "POST"])
@jwt_required()
def api_student_leaves():
    claims = get_jwt()
    student_id = claims.get("student_id")
    db = get_db()
    if request.method == "POST":
        data = request.get_json()
        db.execute("INSERT INTO leave_requests (student_id, leave_type, reason, start_date, end_date, status) VALUES (?,?,?,?,?,'pending')",
                   [student_id, data.get("leave_type", "事假"), data["reason"], data["start_date"], data["end_date"]])
        db.commit()
        db.close()
        return jsonify({"message": "Submitted"}), 201
    rows = db.execute("SELECT * FROM leave_requests WHERE student_id=? ORDER BY created_at DESC", [student_id]).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/student/scores", methods=["GET"])
@jwt_required()
def api_student_scores():
    claims = get_jwt()
    db = get_db()
    student = db.execute("SELECT dorm_number FROM students WHERE student_id=?", [claims.get("student_id")]).fetchone()
    if not student:
        db.close()
        return jsonify([])
    rows = db.execute("SELECT * FROM dorm_scores WHERE dorm_number=? ORDER BY created_at DESC", [student["dorm_number"]]).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/student/utility", methods=["GET"])
@jwt_required()
def api_student_utility():
    claims = get_jwt()
    db = get_db()
    student = db.execute("SELECT dorm_number FROM students WHERE student_id=?", [claims.get("student_id")]).fetchone()
    if not student:
        db.close()
        return jsonify([])
    rows = db.execute("SELECT * FROM utility_records WHERE dorm_number=? ORDER BY billing_month DESC", [student["dorm_number"]]).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/student/announcements", methods=["GET"])
@jwt_required()
def api_student_announcements():
    db = get_db()
    rows = db.execute("SELECT * FROM announcements ORDER BY created_at DESC").fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


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


# Exempt all /api/ routes from CSRF (JWT tokens provide CSRF protection)
_exempt_api_routes()

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
