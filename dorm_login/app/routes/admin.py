from flask import Blueprint, render_template, request, session, flash, redirect, url_for
from werkzeug.security import generate_password_hash
from app.models import get_db, get_latest_utility_rate
from app.config import Config
from app.auth_helpers import require_admin
import sqlite3

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/admin/students")
def admin_students():
    if not require_admin():
        return redirect(url_for("auth.login"))
    db = get_db()
    students = db.execute("SELECT id, student_id, name, dorm_number, is_admin, is_leader, bed_number FROM students").fetchall()
    db.close()
    return render_template("admin_students.html", students=students)

@admin_bp.route("/admin/students/add", methods=["POST"])
def admin_add_student():
    if not require_admin():
        return redirect(url_for("auth.login"))
    student_id = request.form["student_id"]
    name = request.form["name"]
    dorm_number = request.form["dorm_number"]
    password = request.form["password"]
    if not all([student_id, name, dorm_number, password]):
        flash("所有字段都必须填写", "warning")
        return redirect(url_for("admin.admin_students"))
    db = get_db()
    try:
        db.execute("INSERT INTO students (student_id, name, dorm_number, password_hash, is_admin) VALUES (?,?,?,?,0)",
            (student_id, name, dorm_number, generate_password_hash(password)))
        db.commit()
        flash("学生 {} 添加成功".format(student_id), "success")
    except sqlite3.IntegrityError:
        flash("学号已存在", "danger")
    finally:
        db.close()
    return redirect(url_for("admin.admin_students"))

@admin_bp.route("/admin/students/delete/<int:student_id>", methods=["POST"])
def admin_delete_student(student_id):
    if not require_admin():
        return redirect(url_for("auth.login"))
    db = get_db()
    s = db.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    if s and s["is_admin"] == 1:
        flash("不能删除管理员账号", "danger")
    else:
        db.execute("DELETE FROM students WHERE id = ?", (student_id,))
        db.commit()
        flash("删除成功", "success")
    db.close()
    return redirect(url_for("admin.admin_students"))

@admin_bp.route("/admin/students/change_password/<int:student_id>", methods=["POST"])
def admin_change_password(student_id):
    if not require_admin():
        return redirect(url_for("auth.login"))
    new_password = request.form["new_password"]
    db = get_db()
    db.execute("UPDATE students SET password_hash = ? WHERE id = ?", (generate_password_hash(new_password), student_id))
    db.commit()
    db.close()
    flash("密码已修改", "success")
    return redirect(url_for("admin.admin_students"))

@admin_bp.route("/admin/repairs")
def admin_repairs():
    if not require_admin():
        return redirect(url_for("auth.login"))
    db = get_db()
    repairs = db.execute("SELECT r.*, s.name as student_name FROM repair_requests r LEFT JOIN students s ON r.student_id = s.student_id ORDER BY r.created_at DESC").fetchall()
    db.close()
    return render_template("admin_repairs.html", repairs=repairs)

@admin_bp.route("/admin/repairs/update/<int:repair_id>", methods=["POST"])
def admin_update_repair(repair_id):
    if not require_admin():
        return redirect(url_for("auth.login"))
    status = request.form["status"]
    remark = request.form.get("remark", "")
    db = get_db()
    db.execute("UPDATE repair_requests SET status=?, admin_remark=?, updated_at=CURRENT_TIMESTAMP WHERE id=?", (status, remark, repair_id))
    db.commit()
    db.close()
    flash("报修状态已更新", "success")
    return redirect(url_for("admin.admin_repairs"))

@admin_bp.route("/admin/announcements")
def admin_announcements():
    if not require_admin():
        return redirect(url_for("auth.login"))
    db = get_db()
    announcements = db.execute("SELECT * FROM announcements ORDER BY is_pinned DESC, created_at DESC").fetchall()
    db.close()
    return render_template("admin_announcements.html", announcements=announcements)

@admin_bp.route("/admin/announcements/add", methods=["POST"])
def admin_add_announcement():
    if not require_admin():
        return redirect(url_for("auth.login"))
    title = request.form["title"]
    content = request.form["content"]
    is_pinned = 1 if request.form.get("is_pinned") else 0
    expires_at = request.form.get("expires_at") or None
    db = get_db()
    db.execute("INSERT INTO announcements (title, content, is_pinned, is_active, created_by, expires_at) VALUES (?,?,?,1,?,?)",
        (title, content, is_pinned, session["student_id"], expires_at))
    db.commit()
    db.close()
    flash("公告已发布", "success")
    return redirect(url_for("admin.admin_announcements"))

@admin_bp.route("/admin/announcements/delete/<int:ann_id>", methods=["POST"])
def admin_delete_announcement(ann_id):
    if not require_admin():
        return redirect(url_for("auth.login"))
    db = get_db()
    db.execute("DELETE FROM announcements WHERE id = ?", (ann_id,))
    db.commit()
    db.close()
    flash("公告已删除", "success")
    return redirect(url_for("admin.admin_announcements"))

@admin_bp.route("/admin/announcements/toggle/<int:ann_id>", methods=["POST"])
def admin_toggle_announcement(ann_id):
    if not require_admin():
        return redirect(url_for("auth.login"))
    db = get_db()
    a = db.execute("SELECT is_active FROM announcements WHERE id = ?", (ann_id,)).fetchone()
    if a:
        db.execute("UPDATE announcements SET is_active = ? WHERE id = ?", (0 if a["is_active"] else 1, ann_id))
        db.commit()
    db.close()
    return redirect(url_for("admin.admin_announcements"))

@admin_bp.route("/admin/visitors")
def admin_visitors():
    if not require_admin():
        return redirect(url_for("auth.login"))
    db = get_db()
    visitors = db.execute("SELECT v.*, s.name as student_name FROM visitors v LEFT JOIN students s ON v.visited_student_id = s.student_id ORDER BY v.created_at DESC").fetchall()
    db.close()
    return render_template("admin_visitors.html", visitors=visitors)

@admin_bp.route("/admin/visitors/approve/<int:visitor_id>", methods=["POST"])
def admin_approve_visitor(visitor_id):
    if not require_admin(): return redirect(url_for("auth.login"))
    db = get_db(); db.execute("UPDATE visitors SET status='approved' WHERE id=?", (visitor_id,)); db.commit(); db.close()
    flash("访客已审核通过", "success"); return redirect(url_for("admin.admin_visitors"))

@admin_bp.route("/admin/visitors/reject/<int:visitor_id>", methods=["POST"])
def admin_reject_visitor(visitor_id):
    if not require_admin(): return redirect(url_for("auth.login"))
    db = get_db(); db.execute("UPDATE visitors SET status='rejected' WHERE id=?", (visitor_id,)); db.commit(); db.close()
    flash("访客已拒绝", "success"); return redirect(url_for("admin.admin_visitors"))

@admin_bp.route("/admin/visitors/checkin/<int:visitor_id>", methods=["POST"])
def admin_checkin_visitor(visitor_id):
    if not require_admin(): return redirect(url_for("auth.login"))
    db = get_db(); db.execute("UPDATE visitors SET check_in_time=CURRENT_TIMESTAMP WHERE id=?", (visitor_id,)); db.commit(); db.close()
    flash("访客签到成功", "success"); return redirect(url_for("admin.admin_visitors"))

@admin_bp.route("/admin/visitors/checkout/<int:visitor_id>", methods=["POST"])
def admin_checkout_visitor(visitor_id):
    if not require_admin(): return redirect(url_for("auth.login"))
    db = get_db(); db.execute("UPDATE visitors SET status='checked_out', check_out_time=CURRENT_TIMESTAMP WHERE id=?", (visitor_id,)); db.commit(); db.close()
    flash("访客签退成功", "success"); return redirect(url_for("admin.admin_visitors"))

@admin_bp.route("/admin/scores")
def admin_scores():
    if not require_admin(): return redirect(url_for("auth.login"))
    db = get_db()
    scores = db.execute("SELECT * FROM dorm_scores ORDER BY created_at DESC").fetchall()
    dorms = db.execute("SELECT DISTINCT dorm_number FROM students WHERE is_admin=0").fetchall()
    db.close()
    return render_template("admin_scores.html", scores=scores, dorms=dorms)

@admin_bp.route("/admin/scores/add", methods=["POST"])
def admin_add_score():
    if not require_admin(): return redirect(url_for("auth.login"))
    dorm_number = request.form["dorm_number"]
    try:
        score_cleanliness = float(request.form["score_cleanliness"])
        score_safety = float(request.form["score_safety"])
        score_discipline = float(request.form["score_discipline"])
    except (ValueError, TypeError):
        flash("评分必须是数字", "danger")
        return redirect(url_for("admin.admin_scores"))
    remark = request.form.get("remark", "")
    total = round((score_cleanliness + score_safety + score_discipline) / 3, 1)
    db = get_db()
    db.execute("INSERT INTO dorm_scores (dorm_number, inspector_id, score_cleanliness, score_safety, score_discipline, total_score, remark) VALUES (?,?,?,?,?,?,?)",
        (dorm_number, session["student_id"], score_cleanliness, score_safety, score_discipline, total, remark))
    db.commit(); db.close()
    flash("评分已录入", "success"); return redirect(url_for("admin.admin_scores"))

@admin_bp.route("/admin/utility")
def admin_utility():
    if not require_admin(): return redirect(url_for("auth.login"))
    db = get_db()
    records = db.execute("SELECT * FROM utility_records ORDER BY billing_month DESC, dorm_number").fetchall()
    dorms = db.execute("SELECT DISTINCT dorm_number FROM students WHERE is_admin=0").fetchall()
    rates = get_latest_utility_rate()
    db.close()
    return render_template("admin_utility.html", records=records, dorms=dorms, rates=rates)

@admin_bp.route("/admin/utility/set_rate", methods=["POST"])
def admin_set_rate():
    if not require_admin(): return redirect(url_for("auth.login"))
    try:
        water_rate = float(request.form["water_rate"])
        electricity_rate = float(request.form["electricity_rate"])
    except (ValueError, TypeError):
        flash("费率必须是数字", "danger")
        return redirect(url_for("admin.admin_utility"))
    db = get_db()
    db.execute("INSERT INTO utility_rates (water_rate, electricity_rate) VALUES (?,?)",
        (water_rate, electricity_rate))
    db.commit(); db.close()
    flash("费率已更新", "success"); return redirect(url_for("admin.admin_utility"))

@admin_bp.route("/admin/utility/add_record", methods=["POST"])
def admin_add_utility_record():
    if not require_admin(): return redirect(url_for("auth.login"))
    dorm_number = request.form["dorm_number"]
    billing_month = request.form["billing_month"]
    try:
        prev_water = float(request.form.get("prev_water", 0))
        curr_water = float(request.form.get("curr_water", 0))
        prev_electricity = float(request.form.get("prev_electricity", 0))
        curr_electricity = float(request.form.get("curr_electricity", 0))
    except (ValueError, TypeError):
        flash("读数必须是数字", "danger")
        return redirect(url_for("admin.admin_utility"))
    rates = get_latest_utility_rate()
    water_usage = max(0, round(curr_water - prev_water, 1))
    electricity_usage = max(0, round(curr_electricity - prev_electricity, 1))
    water_fee = round(water_usage * rates["water_rate"], 2)
    electricity_fee = round(electricity_usage * rates["electricity_rate"], 2)
    total_fee = round(water_fee + electricity_fee, 2)
    db = get_db()
    db.execute("INSERT INTO utility_records (dorm_number, billing_month, prev_water, curr_water, water_usage, water_fee, prev_electricity, curr_electricity, electricity_usage, electricity_fee, total_fee) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        (dorm_number, billing_month, prev_water, curr_water, water_usage, water_fee, prev_electricity, curr_electricity, electricity_usage, electricity_fee, total_fee))
    db.commit(); db.close()
    flash("账单已录入", "success"); return redirect(url_for("admin.admin_utility"))

@admin_bp.route("/admin/utility/mark_paid/<int:record_id>", methods=["POST"])
def admin_mark_paid(record_id):
    if not require_admin(): return redirect(url_for("auth.login"))
    db = get_db(); db.execute("UPDATE utility_records SET is_paid=1 WHERE id=?", (record_id,)); db.commit(); db.close()
    flash("已标记为缴费", "success"); return redirect(url_for("admin.admin_utility"))

# ===== Dashboard =====

@admin_bp.route("/admin/dashboard")
def admin_dashboard():
    if not require_admin():
        return redirect(url_for("auth.login"))
    return render_template("admin_dashboard.html")

# ===== Leave Management =====

@admin_bp.route("/admin/leaves")
def admin_leaves():
    if not require_admin():
        return redirect(url_for("auth.login"))
    return render_template("admin_leaves.html")
