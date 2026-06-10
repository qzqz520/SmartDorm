"""共享认证辅助函数，避免循环导入"""
from flask import session, flash


def require_login():
    """检查是否已登录，未登录则 flash 提示并返回 False"""
    if "student_id" not in session:
        flash("请先登录", "warning")
        return False
    return True


def require_admin():
    """检查是否为管理员，非管理员则 flash 提示并返回 False"""
    if "student_id" not in session:
        flash("请先登录", "warning")
        return False
    if session.get("is_admin") != 1:
        flash("需要管理员权限", "danger")
        return False
    return True
