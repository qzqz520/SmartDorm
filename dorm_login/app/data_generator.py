# Built-in real-time random data generator.
# Runs in a Flask background thread, generates random sensor data
# synced to real clock time (every minute at :00 seconds).
# Pushes via SocketIO. No external MQTT broker required.

import random
import time
import logging
import threading
from datetime import datetime, timedelta

from app.config import Config
from app.models import get_db

logger = logging.getLogger(__name__)
socketio_ref = None

def set_socketio(sio):
    global socketio_ref
    socketio_ref = sio

def _get_dorm_list():
    try:
        db = get_db()
        rows = db.execute("SELECT DISTINCT dorm_number FROM students WHERE is_admin=0").fetchall()
        db.close()
        dorms = [r["dorm_number"] for r in rows]
        return dorms if dorms else [
            "A栋101", "A栋102", "A栋103", "A栋104",
            "B栋101", "B栋102", "B栋103",
            "C栋201", "C栋202", "C栋203",
            "D栋301", "D栋302",
        ]
    except Exception:
        return ["A栋101", "A栋102", "B栋101", "B栋102"]

def _random_sensor():
    temp = round(random.uniform(20.0, 36.0), 1)
    hum = round(random.uniform(35.0, 75.0), 1)
    smoke = random.randint(0, 30)
    if random.random() < 0.12:
        temp = round(random.uniform(37.5, 48.0), 1)
    if random.random() < 0.06:
        smoke = random.randint(55, 150)
    return temp, hum, smoke

def _random_count():
    return random.randint(1, Config.MAX_DORM_CAPACITY)

def _broadcast_to_clients(sensor_updates, count_map, timestamp):
    if not socketio_ref:
        return
    for d in sensor_updates:
        socketio_ref.emit("sensor_update", d, namespace="/")
    socketio_ref.emit(
        "batch_update",
        {
            "sensors": sensor_updates,
            "counts": count_map,
            "time": timestamp,
        },
        namespace="/",
    )

def _store_to_db(dorm, temp, hum, smoke):
    db = get_db()
    try:
        db.execute(
            "INSERT INTO sensor_data (dorm_number, temperature, humidity, smoke) VALUES (?,?,?,?)",
            (dorm, temp, hum, smoke),
        )
        db.commit()
        if temp > Config.TEMP_HIGH_THRESHOLD:
            db.execute("INSERT INTO alerts (dorm_number, alert_type, value) VALUES (?,?,?)", (dorm, "TEMP", temp))
            db.commit()
            _create_alert_notification(dorm, "TEMP", temp, db)
        if smoke > Config.SMOKE_HIGH_THRESHOLD:
            db.execute("INSERT INTO alerts (dorm_number, alert_type, value) VALUES (?,?,?)", (dorm, "SMOKE", smoke))
            db.commit()
            _create_alert_notification(dorm, "SMOKE", smoke, db)
    except Exception:
        pass
    finally:
        db.close()


def _create_alert_notification(dorm, alert_type, value, db):
    """Create notifications for students in the dorm and all admins when an alert triggers"""
    alert_name = "高温告警" if alert_type == "TEMP" else "烟雾告警"
    title = f"🚨 {alert_name} - {dorm}"
    content = f"{dorm} {'温度' if alert_type == 'TEMP' else '烟雾浓度'}达到 {value}，已超过安全阈值，请及时处理！"
    try:
        # Notify students in that dorm
        students = db.execute(
            "SELECT student_id FROM students WHERE dorm_number=? AND is_admin=0", (dorm,)
        ).fetchall()
        for s in students:
            db.execute(
                "INSERT INTO notifications (user_id, type, title, content, related_dorm) VALUES (?,?,?,?,?)",
                (s["student_id"], "alert", title, content, dorm),
            )
        # Notify all admins
        admins = db.execute(
            "SELECT student_id FROM students WHERE is_admin=1"
        ).fetchall()
        for a in admins:
            db.execute(
                "INSERT INTO notifications (user_id, type, title, content, related_dorm) VALUES (?,?,?,?,?)",
                (a["student_id"], "alert", title, content, dorm),
            )
        db.commit()
        # Push via SocketIO
        if socketio_ref:
            socketio_ref.emit("notification", {
                "type": "alert",
                "title": title,
                "content": content,
                "dorm": dorm,
            }, namespace="/")
    except Exception:
        pass

def _sleep_until_next_minute():
    """Sleep until the next clock minute (:00 seconds) for real-time sync"""
    now = datetime.now()
    next_min = now.replace(second=0, microsecond=0) + timedelta(minutes=1)
    seconds = (next_min - now).total_seconds()
    time.sleep(max(0.1, seconds))

def run_data_generator():
    """Main loop: generate random sensor data at every clock minute"""
    logger.info("Data generator thread started")
    dorm_list = _get_dorm_list()
    logger.info("Monitoring %d dorms, synced to clock time", len(dorm_list))

    # Generate first batch immediately so the page isn't empty
    _generate_and_broadcast(dorm_list)
    logger.info("Initial data broadcast completed")

    while True:
        try:
            _sleep_until_next_minute()
            _generate_and_broadcast(dorm_list)
        except Exception as e:
            logger.error("Data generator error: %s", e)
            time.sleep(5)

def _generate_and_broadcast(dorm_list):
    """Generate random data for all dorms and broadcast via SocketIO"""
    sensor_updates = []
    count_map = {}
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for dorm in dorm_list:
        temp, hum, smoke = _random_sensor()
        count_map[dorm] = _random_count()
        alert = None
        if temp > Config.TEMP_HIGH_THRESHOLD:
            alert = {"type": "TEMP", "dorm": dorm, "value": temp}
        elif smoke > Config.SMOKE_HIGH_THRESHOLD:
            alert = {"type": "SMOKE", "dorm": dorm, "value": smoke}

        sensor_updates.append({
            "dorm": dorm,
            "temp": temp,
            "hum": hum,
            "smoke": smoke,
            "alert": alert,
            "count": count_map.get(dorm, _random_count()),
        })

        # Write to DB directly (already in a background generator thread)
        _store_to_db(dorm, temp, hum, smoke)

    _broadcast_to_clients(sensor_updates, count_map, now_str)
    logger.debug("Broadcast %d dorms at %s", len(dorm_list), now_str)