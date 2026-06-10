from flask import Blueprint, render_template, session, redirect, url_for
from app.auth_helpers import require_login, require_admin

monitor_bp = Blueprint("monitor", __name__)

@monitor_bp.route("/monitor")
def monitor():
    if not require_login():
        return redirect(url_for("auth.login"))
    return render_template("monitor.html", dorm_number=session["dorm_number"])

@monitor_bp.route("/admin/monitor")
def admin_monitor():
    if not require_admin():
        return redirect(url_for("auth.login"))
    return render_template("admin_monitor.html")
