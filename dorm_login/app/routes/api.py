from flask import Blueprint, jsonify, session, request
from app.models import get_db, get_latest_utility_rate, get_dorm_members
from datetime import datetime
import random
from app.config import Config

api_bp = Blueprint("api", __name__)

@api_bp.route("/api/latest")
def api_latest():
    db = get_db()
    cur = db.execute("SELECT dorm_number, temperature, humidity, smoke, MAX(timestamp) as last_time FROM sensor_data GROUP BY dorm_number")
    result = [{"dorm": r["dorm_number"], "temp": r["temperature"], "hum": r["humidity"], "smoke": r["smoke"], "time": r["last_time"]} for r in cur.fetchall()]
    db.close()
    for d in result:
        d["count"] = random.randint(1, Config.MAX_DORM_CAPACITY)
    return jsonify(result)

@api_bp.route("/api/history/<dorm>")
def api_history(dorm):
    db = get_db()
    rows = db.execute("SELECT temperature, humidity, smoke, timestamp FROM sensor_data WHERE dorm_number = ? AND timestamp > datetime('now','-1 hour') ORDER BY timestamp", (dorm,)).fetchall()
    data = {"times": [], "temp": [], "hum": [], "smoke": []}
    for r in rows:
        data["times"].append(r["timestamp"])
        data["temp"].append(r["temperature"])
        data["hum"].append(r["humidity"])
        data["smoke"].append(r["smoke"])
    db.close()
    return jsonify(data)

@api_bp.route("/api/mydata")
def api_mydata():
    if "dorm_number" not in session: return jsonify([])
    db = get_db()
    row = db.execute("SELECT dorm_number, temperature, humidity, smoke, MAX(timestamp) as last_time FROM sensor_data WHERE dorm_number = ? GROUP BY dorm_number", (session["dorm_number"],)).fetchone()
    db.close()
    return jsonify([{"dorm": row["dorm_number"], "temp": row["temperature"], "hum": row["humidity"], "smoke": row["smoke"], "time": row["last_time"], "count": random.randint(1, Config.MAX_DORM_CAPACITY)}] if row else [])

@api_bp.route("/api/dorm_counts")
def api_dorm_counts():
    db = get_db()
    rows = db.execute("SELECT DISTINCT dorm_number FROM students WHERE is_admin = 0").fetchall()
    result = {r["dorm_number"]: random.randint(1, Config.MAX_DORM_CAPACITY) for r in rows}
    db.close()
    return jsonify(result)

# ========== Dorm Detail & Bed Management ==========

@api_bp.route("/api/dorm_details/<dorm>")
def api_dorm_details(dorm):
    try:
        db = get_db()
        members = get_dorm_members(dorm)
        sensor = db.execute("SELECT temperature, humidity, smoke, timestamp FROM sensor_data WHERE dorm_number=? ORDER BY id DESC LIMIT 1", (dorm,)).fetchone()
        alerts = db.execute("SELECT alert_type, value, timestamp FROM alerts WHERE dorm_number=? ORDER BY id DESC LIMIT 10", (dorm,)).fetchall()
        db.close()
        # If no real sensor data, generate demo data
        if not sensor:
            sensor_data = {
                "temperature": round(random.uniform(22, 36), 1),
                "humidity": round(random.uniform(38, 72), 1),
                "smoke": random.randint(0, 30),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
        else:
            sensor_data = dict(sensor)
        leader = None; beds = [None] * Config.MAX_DORM_CAPACITY
        for m in members:
            bn = m.get("bed_number")
            if bn and 1 <= bn <= Config.MAX_DORM_CAPACITY: beds[bn - 1] = m
            if m.get("is_leader"): leader = m
        return jsonify({"dorm": dorm, "student_count": len(members), "leader": leader, "members": members, "beds": beds, "sensor": sensor_data, "alerts": [dict(a) for a in alerts]})
    except Exception as e: return jsonify({"error": str(e)}), 500

@api_bp.route("/api/dorm_beds/update", methods=["POST"])
def api_dorm_beds_update():
    if "student_id" not in session: return jsonify({"error": "未登录"}), 401
    data = request.get_json()
    dorm = data.get("dorm"); beds = data.get("beds")
    if not dorm or not beds or len(beds) != Config.MAX_DORM_CAPACITY: return jsonify({"error": "参数错误"}), 400
    is_admin = session.get("is_admin") == 1; is_leader = False
    db = get_db()
    if not is_admin:
        row = db.execute("SELECT is_leader FROM students WHERE student_id=? AND dorm_number=?", (session["student_id"], dorm)).fetchone()
        is_leader = row and row["is_leader"] == 1
    if not is_admin and not is_leader: db.close(); return jsonify({"error": "权限不足"}), 403
    try:
        db.execute("UPDATE students SET bed_number = NULL WHERE dorm_number = ? AND is_admin = 0", (dorm,))
        for i, b in enumerate(beds):
            if b and b.get("student_id"):
                db.execute("UPDATE students SET bed_number = ?, is_leader = ? WHERE student_id = ? AND dorm_number = ?", (i + 1, b.get("is_leader", 0), b["student_id"], dorm))
        db.commit(); updated = get_dorm_members(dorm); db.close()
        return jsonify({"ok": True, "members": updated})
    except Exception as e: db.close(); return jsonify({"error": str(e)}), 500

@api_bp.route("/api/my_bed_layout")
def api_my_bed_layout():
    if "dorm_number" not in session: return jsonify([])
    return jsonify(get_dorm_members(session["dorm_number"]))

# ========== Student Management APIs (Admin) ==========

@api_bp.route("/api/students/appoint_leader", methods=["POST"])
def api_appoint_leader():
    if not session.get("is_admin"): return jsonify({"error": "权限不足"}), 403
    data = request.get_json(); student_id = data.get("student_id")
    if not student_id: return jsonify({"error": "参数错误"}), 400
    db = get_db()
    try:
        student = db.execute("SELECT dorm_number FROM students WHERE student_id=? AND is_admin=0", (student_id,)).fetchone()
        if not student: db.close(); return jsonify({"error": "未找到"}), 404
        dorm = student["dorm_number"]
        db.execute("UPDATE students SET is_leader=0 WHERE dorm_number=? AND is_admin=0", (dorm,))
        db.execute("UPDATE students SET is_leader=1 WHERE student_id=?", (student_id,))
        db.commit(); db.close()
        return jsonify({"ok": True})
    except Exception as e: db.close(); return jsonify({"error": str(e)}), 500

@api_bp.route("/api/students/remove_from_dorm", methods=["POST"])
def api_remove_from_dorm():
    if not session.get("is_admin"): return jsonify({"error": "权限不足"}), 403
    data = request.get_json(); student_id = data.get("student_id")
    if not student_id: return jsonify({"error": "参数错误"}), 400
    db = get_db()
    try:
        student = db.execute("SELECT id, name FROM students WHERE student_id=? AND is_admin=0", (student_id,)).fetchone()
        if not student: db.close(); return jsonify({"error": "未找到"}), 404
        db.execute("UPDATE students SET dorm_number='未分配', bed_number=NULL, is_leader=0 WHERE id=?", (student["id"],))
        db.commit(); db.close()
        return jsonify({"ok": True})
    except Exception as e: db.close(); return jsonify({"error": str(e)}), 500

# ========== Existing APIs ==========
@api_bp.route("/api/my_repairs")
def api_my_repairs():
    if "student_id" not in session: return jsonify([])
    db = get_db()
    rows = db.execute("SELECT * FROM repair_requests WHERE student_id = ? ORDER BY created_at DESC", (session["student_id"],)).fetchall()
    db.close(); return jsonify([dict(r) for r in rows])

@api_bp.route("/api/repairs/add", methods=["POST"])
def api_add_repair():
    if "student_id" not in session: return jsonify({"error": "未登录"}), 401
    data = request.get_json(); title = (data.get("title") or "").strip(); desc = (data.get("description") or "").strip()
    if not title: return jsonify({"error": "请输入标题"}), 400
    db = get_db()
    db.execute("INSERT INTO repair_requests (student_id, dorm_number, title, description) VALUES (?,?,?,?)", (session["student_id"], session["dorm_number"], title, desc))
    db.commit(); db.close(); return jsonify({"ok": True})

@api_bp.route("/api/announcements")
def api_announcements():
    db = get_db()
    rows = db.execute("SELECT * FROM announcements WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > datetime('now')) ORDER BY is_pinned DESC, created_at DESC").fetchall()
    db.close(); return jsonify([dict(r) for r in rows])

@api_bp.route("/api/my_visitors")
def api_my_visitors():
    if "student_id" not in session: return jsonify([])
    db = get_db()
    rows = db.execute("SELECT * FROM visitors WHERE visited_student_id = ? ORDER BY created_at DESC", (session["student_id"],)).fetchall()
    db.close(); return jsonify([dict(r) for r in rows])

@api_bp.route("/api/visitors/add", methods=["POST"])
def api_add_visitor():
    if "student_id" not in session: return jsonify({"error": "未登录"}), 401
    data = request.get_json(); name = (data.get("visitor_name") or "").strip()
    if not name: return jsonify({"error": "请输入访客姓名"}), 400
    db = get_db()
    db.execute("INSERT INTO visitors (visitor_name, id_card, phone, visited_student_id, visited_dorm, purpose) VALUES (?,?,?,?,?,?)", (name, (data.get("id_card") or "").strip(), (data.get("phone") or "").strip(), session["student_id"], session["dorm_number"], (data.get("purpose") or "").strip()))
    db.commit(); db.close(); return jsonify({"ok": True})

@api_bp.route("/api/my_scores")
def api_my_scores():
    if "dorm_number" not in session: return jsonify([])
    db = get_db()
    rows = db.execute("SELECT * FROM dorm_scores WHERE dorm_number = ? ORDER BY created_at DESC", (session["dorm_number"],)).fetchall()
    db.close(); return jsonify([dict(r) for r in rows])

@api_bp.route("/api/my_utility")
def api_my_utility():
    if "dorm_number" not in session: return jsonify([])
    db = get_db()
    rows = db.execute("SELECT * FROM utility_records WHERE dorm_number = ? ORDER BY billing_month DESC", (session["dorm_number"],)).fetchall()
    db.close(); return jsonify([dict(r) for r in rows])

# ========== Notifications ==========

@api_bp.route("/api/notifications")
def api_notifications():
    if "student_id" not in session: return jsonify([])
    db = get_db()
    rows = db.execute(
        "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50",
        (session["student_id"],)
    ).fetchall()
    unread = db.execute(
        "SELECT COUNT(*) as cnt FROM notifications WHERE user_id=? AND is_read=0",
        (session["student_id"],)
    ).fetchone()["cnt"]
    db.close()
    return jsonify({"list": [dict(r) for r in rows], "unread": unread})

@api_bp.route("/api/notifications/read/<int:nid>", methods=["POST"])
def api_notification_read(nid):
    if "student_id" not in session: return jsonify({"error": "未登录"}), 401
    db = get_db()
    db.execute("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?", (nid, session["student_id"]))
    db.commit(); db.close()
    return jsonify({"ok": True})

@api_bp.route("/api/notifications/read_all", methods=["POST"])
def api_notification_read_all():
    if "student_id" not in session: return jsonify({"error": "未登录"}), 401
    db = get_db()
    db.execute("UPDATE notifications SET is_read=1 WHERE user_id=?", (session["student_id"],))
    db.commit(); db.close()
    return jsonify({"ok": True})

# ========== Statistics Dashboard ==========

@api_bp.route("/api/stats/overview")
def api_stats_overview():
    if not session.get("is_admin"): return jsonify({"error": "权限不足"}), 403
    db = get_db()
    total_dorms = db.execute("SELECT COUNT(DISTINCT dorm_number) as cnt FROM students WHERE is_admin=0").fetchone()["cnt"]
    total_students = db.execute("SELECT COUNT(*) as cnt FROM students WHERE is_admin=0").fetchone()["cnt"]
    pending_repairs = db.execute("SELECT COUNT(*) as cnt FROM repair_requests WHERE status='pending'").fetchone()["cnt"]
    today_visitors = db.execute(
        "SELECT COUNT(*) as cnt FROM visitors WHERE date(created_at)=date('now')"
    ).fetchone()["cnt"]
    pending_leaves = db.execute("SELECT COUNT(*) as cnt FROM leave_requests WHERE status='pending'").fetchone()["cnt"]
    active_alerts = db.execute("SELECT COUNT(*) as cnt FROM alerts WHERE timestamp > datetime('now','-1 hour')").fetchone()["cnt"]
    db.close()
    return jsonify({
        "total_dorms": total_dorms,
        "total_students": total_students,
        "pending_repairs": pending_repairs,
        "today_visitors": today_visitors,
        "pending_leaves": pending_leaves,
        "active_alerts": active_alerts,
    })

@api_bp.route("/api/stats/charts")
def api_stats_charts():
    if not session.get("is_admin"): return jsonify({"error": "权限不足"}), 403
    db = get_db()
    # Repair status distribution
    repair_stats = {}
    for row in db.execute("SELECT status, COUNT(*) as cnt FROM repair_requests GROUP BY status").fetchall():
        repair_stats[row["status"]] = row["cnt"]
    # Score ranking (top 10 dorms)
    scores = db.execute(
        "SELECT dorm_number, ROUND(AVG(total_score),1) as avg_score, COUNT(*) as cnt "
        "FROM dorm_scores GROUP BY dorm_number ORDER BY avg_score DESC LIMIT 10"
    ).fetchall()
    # Alerts by hour (last 24h)
    alerts = db.execute(
        "SELECT strftime('%H', timestamp) as hour, COUNT(*) as cnt "
        "FROM alerts WHERE timestamp > datetime('now','-24 hours') "
        "GROUP BY hour ORDER BY hour"
    ).fetchall()
    # Utility trends (last 6 months)
    utility = db.execute(
        "SELECT billing_month, ROUND(SUM(total_fee),2) as total, ROUND(SUM(water_usage),1) as water, "
        "ROUND(SUM(electricity_usage),1) as electricity "
        "FROM utility_records GROUP BY billing_month ORDER BY billing_month DESC LIMIT 12"
    ).fetchall()
    db.close()
    return jsonify({
        "repair_stats": repair_stats,
        "scores": [dict(r) for r in scores],
        "alerts": [dict(r) for r in alerts],
        "utility": [dict(r) for r in reversed(utility)],
    })

# ========== Leave Requests ==========

@api_bp.route("/api/my_leaves")
def api_my_leaves():
    if "student_id" not in session: return jsonify([])
    db = get_db()
    rows = db.execute(
        "SELECT * FROM leave_requests WHERE student_id=? ORDER BY created_at DESC",
        (session["student_id"],)
    ).fetchall()
    db.close(); return jsonify([dict(r) for r in rows])

@api_bp.route("/api/leaves/add", methods=["POST"])
def api_add_leave():
    if "student_id" not in session: return jsonify({"error": "未登录"}), 401
    data = request.get_json()
    leave_type = (data.get("leave_type") or "事假").strip()
    reason = (data.get("reason") or "").strip()
    start_date = (data.get("start_date") or "").strip()
    end_date = (data.get("end_date") or "").strip()
    if not reason: return jsonify({"error": "请填写请假原因"}), 400
    if not start_date or not end_date: return jsonify({"error": "请选择日期"}), 400
    db = get_db()
    db.execute(
        "INSERT INTO leave_requests (student_id, dorm_number, leave_type, reason, start_date, end_date) VALUES (?,?,?,?,?,?)",
        (session["student_id"], session["dorm_number"], leave_type, reason, start_date, end_date)
    )
    db.commit()
    # Notify admins
    title = f"📝 新请假申请 - {session.get('name','')}"
    content = f"{session.get('name','')} ({session['student_id']}) 提交了{leave_type}申请: {reason[:50]}"
    admins = db.execute("SELECT student_id FROM students WHERE is_admin=1").fetchall()
    for a in admins:
        db.execute(
            "INSERT INTO notifications (user_id, type, title, content, related_dorm) VALUES (?,?,?,?,?)",
            (a["student_id"], "leave", title, content, session.get("dorm_number", ""))
        )
    db.commit(); db.close()
    if socketio_ref:
        try:
            from app.data_generator import socketio_ref as sio
            if sio:
                sio.emit("notification", {"type": "leave", "title": title, "content": content}, namespace="/")
        except: pass
    return jsonify({"ok": True})

@api_bp.route("/api/leaves/all")
def api_all_leaves():
    if not session.get("is_admin"): return jsonify([])
    db = get_db()
    rows = db.execute(
        "SELECT l.*, s.name as student_name FROM leave_requests l "
        "LEFT JOIN students s ON l.student_id = s.student_id ORDER BY l.created_at DESC"
    ).fetchall()
    db.close(); return jsonify([dict(r) for r in rows])

@api_bp.route("/api/leaves/approve/<int:leave_id>", methods=["POST"])
def api_approve_leave(leave_id):
    if not session.get("is_admin"): return jsonify({"error": "权限不足"}), 403
    remark = (request.get_json() or {}).get("remark", "")
    db = get_db()
    db.execute("UPDATE leave_requests SET status='approved', admin_remark=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (remark, leave_id))
    # Notify student
    leave = db.execute("SELECT * FROM leave_requests WHERE id=?", (leave_id,)).fetchone()
    if leave:
        db.execute(
            "INSERT INTO notifications (user_id, type, title, content) VALUES (?,?,?,?)",
            (leave["student_id"], "leave", "✅ 请假已通过", f"你的{leave['leave_type']}申请已通过审批")
        )
    db.commit(); db.close()
    return jsonify({"ok": True})

@api_bp.route("/api/leaves/reject/<int:leave_id>", methods=["POST"])
def api_reject_leave(leave_id):
    if not session.get("is_admin"): return jsonify({"error": "权限不足"}), 403
    remark = (request.get_json() or {}).get("remark", "")
    db = get_db()
    db.execute("UPDATE leave_requests SET status='rejected', admin_remark=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (remark, leave_id))
    leave = db.execute("SELECT * FROM leave_requests WHERE id=?", (leave_id,)).fetchone()
    if leave:
        db.execute(
            "INSERT INTO notifications (user_id, type, title, content) VALUES (?,?,?,?)",
            (leave["student_id"], "leave", "❌ 请假被拒绝", f"你的{leave['leave_type']}申请已被拒绝" + (f": {remark}" if remark else ""))
        )
    db.commit(); db.close()
    return jsonify({"ok": True})