import sqlite3
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from app.models import get_db, get_student_count_in_dorm, get_available_dormitories
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
                available_dorms = get_available_dormitories()
                return render_template("register.html", available_dorms=available_dorms)
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
    available_dorms = get_available_dormitories()
    return render_template("register.html", available_dorms=available_dorms)

@auth_bp.route("/logout")
def logout():
    session.clear()
    flash("已安全退出", "info")
    return redirect(url_for("auth.login"))


# ============================
# JWT API 端点 (供 React 前端使用)
# ============================

@auth_bp.route("/api/auth/login", methods=["POST"])
def api_login():
    """JWT-based login for React frontend.

    Reuses the same credential-checking logic as the existing session-based
    /login route (direct DB query + check_password_hash), since there is no
    standalone authenticate_user helper in auth_helpers.py.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request"}), 400

    student_id = data.get("student_id")
    password = data.get("password")

    if not student_id or not password:
        return jsonify({"error": "Please enter student ID and password"}), 400

    db = get_db()
    user = db.execute(
        "SELECT id, student_id, name, dorm_number, is_admin, password_hash FROM students WHERE student_id = ?",
        (student_id,),
    ).fetchone()
    db.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(
        identity=str(user["id"]),
        additional_claims={
            "student_id": user["student_id"],
            "name": user["name"],
            "dorm_number": user["dorm_number"],
            "is_admin": bool(user["is_admin"]),
        },
    )
    return jsonify(
        {
            "token": access_token,
            "user": {
                "student_id": user["student_id"],
                "name": user["name"],
                "dorm_number": user["dorm_number"],
                "is_admin": bool(user["is_admin"]),
            },
        }
    )


@auth_bp.route("/api/auth/register", methods=["POST"])
def api_register():
    """JWT-based registration for React frontend.

    Reuses the same validation + insert logic as the existing session-based
    /register route, since there is no standalone register_user helper in
    auth_helpers.py.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request"}), 400

    student_id = data.get("student_id")
    name = data.get("name")
    dorm_number = data.get("dorm_number")
    password = data.get("password")
    confirm = data.get("confirm")

    if not all([student_id, name, dorm_number, password, confirm]):
        return jsonify({"error": "All fields are required"}), 400

    if password != confirm:
        return jsonify({"error": "Passwords do not match"}), 400

    db = get_db()
    if get_student_count_in_dorm(dorm_number) >= Config.MAX_DORM_CAPACITY:
        db.close()
        return jsonify({"error": "Dormitory is full (max {} people)".format(Config.MAX_DORM_CAPACITY)}), 400

    try:
        db.execute(
            "INSERT INTO students (student_id, name, dorm_number, password_hash) VALUES (?,?,?,?)",
            (student_id, name, dorm_number, generate_password_hash(password)),
        )
        db.commit()
        db.close()
        return jsonify({"message": "Registration successful"}), 201
    except sqlite3.IntegrityError:
        db.close()
        return jsonify({"error": "Student ID already registered"}), 409


@auth_bp.route("/api/auth/me", methods=["GET"])
@jwt_required()
def api_me():
    """Return the current authenticated user's info from the JWT claims."""
    claims = get_jwt()
    return jsonify(
        {
            "id": get_jwt_identity(),
            "student_id": claims.get("student_id"),
            "name": claims.get("name"),
            "dorm_number": claims.get("dorm_number"),
            "is_admin": claims.get("is_admin"),
        }
    )
