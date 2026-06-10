import sqlite3
from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import get_db, get_student_count_in_dorm
from app.config import Config

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        sid = request.form["student_id"]
        pw = request.form["password"]
        db = get_db()
        user = db.execute("SELECT * FROM students WHERE student_id = ?", (sid,)).fetchone()
        db.close()
        if user and check_password_hash(user["password_hash"], pw):
            session["student_id"] = user["student_id"]
            session["name"] = user["name"]
            session["dorm_number"] = user["dorm_number"]
            session["is_admin"] = user["is_admin"]
            flash("登录成功", "success")
            return redirect(url_for("monitor.admin_monitor") if user["is_admin"] else url_for("monitor.monitor"))
        else:
            flash("学号或密码错误", "danger")
    return render_template("login.html")

@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        sid = request.form["student_id"]
        name = request.form["name"]
        dorm = request.form["dorm_number"]
        pw = request.form["password"]
        confirm = request.form["confirm"]
        if not all([sid, name, dorm, pw, confirm]):
            flash("所有字段都必须填写", "warning")
        elif pw != confirm:
            flash("两次输入的密码不一致", "warning")
        else:
            db = get_db()
            if get_student_count_in_dorm(dorm) >= Config.MAX_DORM_CAPACITY:
                flash("该宿舍已满员（最大{}人），请选择其他宿舍".format(Config.MAX_DORM_CAPACITY), "danger")
                db.close()
                return render_template("register.html")
            try:
                db.execute("INSERT INTO students (student_id, name, dorm_number, password_hash) VALUES (?,?,?,?)",
                    (sid, name, dorm, generate_password_hash(pw)))
                db.commit()
                db.close()
                flash("注册成功，请登录", "success")
                return redirect(url_for("auth.login"))
            except sqlite3.IntegrityError:
                flash("该学号已被注册", "danger")
                db.close()
    return render_template("register.html")

@auth_bp.route("/logout")
def logout():
    session.clear()
    flash("已安全退出", "info")
    return redirect(url_for("auth.login"))
