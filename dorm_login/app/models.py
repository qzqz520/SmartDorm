import sqlite3
import os
from app.config import Config
from werkzeug.security import generate_password_hash

def get_db():
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = sqlite3.connect(Config.DATABASE_PATH)
    c = conn.cursor()

    c.execute("""CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        dorm_number TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        bed_number INTEGER DEFAULT NULL,
        is_leader INTEGER DEFAULT 0
    )""")

    # Migration: add columns if they don't exist
    for col, typ in [("bed_number", "INTEGER DEFAULT NULL"), ("is_leader", "INTEGER DEFAULT 0")]:
        try:
            c.execute("ALTER TABLE students ADD COLUMN {} {}".format(col, typ))
        except sqlite3.OperationalError:
            pass

    c.execute("""CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dorm_number TEXT NOT NULL,
        temperature REAL,
        humidity REAL,
        smoke INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dorm_number TEXT NOT NULL,
        alert_type TEXT,
        value REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS repair_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        dorm_number TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT "pending",
        admin_remark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        is_pinned INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS visitors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visitor_name TEXT NOT NULL,
        id_card TEXT,
        phone TEXT,
        visited_student_id TEXT NOT NULL,
        visited_dorm TEXT NOT NULL,
        purpose TEXT,
        status TEXT DEFAULT "pending",
        check_in_time DATETIME,
        check_out_time DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS dorm_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dorm_number TEXT NOT NULL,
        inspector_id TEXT NOT NULL,
        score_cleanliness REAL DEFAULT 0,
        score_safety REAL DEFAULT 0,
        score_discipline REAL DEFAULT 0,
        total_score REAL DEFAULT 0,
        remark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS utility_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        water_rate REAL NOT NULL DEFAULT 3.5,
        electricity_rate REAL NOT NULL DEFAULT 0.6,
        effective_from DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS utility_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dorm_number TEXT NOT NULL,
        billing_month TEXT NOT NULL,
        prev_water REAL DEFAULT 0,
        curr_water REAL DEFAULT 0,
        water_usage REAL DEFAULT 0,
        water_fee REAL DEFAULT 0,
        prev_electricity REAL DEFAULT 0,
        curr_electricity REAL DEFAULT 0,
        electricity_usage REAL DEFAULT 0,
        electricity_fee REAL DEFAULT 0,
        total_fee REAL DEFAULT 0,
        is_paid INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    # Seed admin
    try:
        c.execute("INSERT INTO students (student_id, name, dorm_number, password_hash, is_admin) VALUES (?,?,?,?,?)",
            ("admin", "管理员", "管理室", generate_password_hash("admin123"), 1))
    except sqlite3.IntegrityError:
        pass

    c.execute("""CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        related_dorm TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        dorm_number TEXT NOT NULL,
        leave_type TEXT NOT NULL DEFAULT '事假',
        reason TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        admin_remark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    # Seed first student
    try:
        c.execute("INSERT INTO students (student_id, name, dorm_number, password_hash, is_admin, bed_number, is_leader) VALUES (?,?,?,?,?,?,?)",
            ("2021001", "张三", "A栋101", generate_password_hash("123456"), 0, 1, 1))
    except sqlite3.IntegrityError:
        pass

    c.execute("SELECT COUNT(*) FROM utility_rates")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO utility_rates (water_rate, electricity_rate) VALUES (?,?)",
            (Config.DEFAULT_WATER_RATE, Config.DEFAULT_ELECTRICITY_RATE))

    conn.commit()
    conn.close()

def get_student_count_in_dorm(dorm_number):
    db = get_db()
    row = db.execute("SELECT COUNT(*) as cnt FROM students WHERE dorm_number=? AND is_admin=0", (dorm_number,)).fetchone()
    db.close()
    return row["cnt"]

def get_latest_utility_rate():
    db = get_db()
    row = db.execute("SELECT water_rate, electricity_rate FROM utility_rates ORDER BY id DESC LIMIT 1").fetchone()
    db.close()
    if row:
        return {"water_rate": row["water_rate"], "electricity_rate": row["electricity_rate"]}
    return {"water_rate": Config.DEFAULT_WATER_RATE, "electricity_rate": Config.DEFAULT_ELECTRICITY_RATE}

def get_dorm_members(dorm_number):
    """Return all students in a dorm with bed numbers and leader status."""
    db = get_db()
    rows = db.execute(
        "SELECT student_id, name, bed_number, is_leader FROM students WHERE dorm_number=? AND is_admin=0 ORDER BY bed_number",
        (dorm_number,)
    ).fetchall()
    db.close()
    return [dict(r) for r in rows]