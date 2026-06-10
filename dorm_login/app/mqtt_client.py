import json
import time
import logging
import paho.mqtt.client as mqtt
from app.config import Config
from app.models import get_db

logger = logging.getLogger(__name__)
socketio_ref = None

def set_socketio(sio):
    global socketio_ref
    socketio_ref = sio

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info("MQTT connected successfully")
        client.subscribe(Config.MQTT_TOPIC)
    else:
        logger.warning("MQTT connection failed, rc=%s", rc)

def on_disconnect(client, userdata, rc):
    logger.warning("MQTT disconnected, rc=%s. Will auto-reconnect.", rc)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        dorm = payload["dorm_number"]
        temp = payload["temperature"]
        hum = payload["humidity"]
        smoke = payload["smoke"]
    except Exception:
        logger.error("Failed to parse MQTT message: %s", msg.payload)
        return
    db = get_db()
    db.execute("INSERT INTO sensor_data (dorm_number, temperature, humidity, smoke) VALUES (?,?,?,?)", (dorm, temp, hum, smoke))
    db.commit()
    alert = None
    if temp > Config.TEMP_HIGH_THRESHOLD:
        db.execute("INSERT INTO alerts (dorm_number, alert_type, value) VALUES (?,?,?)", (dorm, "TEMP", temp))
        db.commit()
        logger.warning("HIGH TEMP ALERT: %s %.1f C", dorm, temp)
        alert = {"type": "TEMP", "dorm": dorm, "value": temp}
        _create_mqtt_notification(dorm, "TEMP", temp, db)
    if smoke > Config.SMOKE_HIGH_THRESHOLD:
        db.execute("INSERT INTO alerts (dorm_number, alert_type, value) VALUES (?,?,?)", (dorm, "SMOKE", smoke))
        db.commit()
        logger.warning("SMOKE ALERT: %s %d", dorm, smoke)
        alert = {"type": "SMOKE", "dorm": dorm, "value": smoke}
        _create_mqtt_notification(dorm, "SMOKE", smoke, db)
    db.close()
    data = {"dorm": dorm, "temp": temp, "hum": hum, "smoke": smoke, "alert": alert}
    if socketio_ref:
        socketio_ref.emit("sensor_update", data, namespace="/")

def _create_mqtt_notification(dorm, alert_type, value, db):
    """Create notifications for MQTT-triggered alerts"""
    alert_name = "高温告警" if alert_type == "TEMP" else "烟雾告警"
    title = f"🚨 {alert_name} - {dorm}"
    content = f"{dorm} {'温度' if alert_type == 'TEMP' else '烟雾浓度'}达到 {value}，已超过安全阈值，请及时处理！"
    try:
        students = db.execute(
            "SELECT student_id FROM students WHERE dorm_number=? AND is_admin=0", (dorm,)
        ).fetchall()
        for s in students:
            db.execute(
                "INSERT INTO notifications (user_id, type, title, content, related_dorm) VALUES (?,?,?,?,?)",
                (s["student_id"], "alert", title, content, dorm),
            )
        admins = db.execute("SELECT student_id FROM students WHERE is_admin=1").fetchall()
        for a in admins:
            db.execute(
                "INSERT INTO notifications (user_id, type, title, content, related_dorm) VALUES (?,?,?,?,?)",
                (a["student_id"], "alert", title, content, dorm),
            )
        db.commit()
        if socketio_ref:
            socketio_ref.emit("notification", {
                "type": "alert",
                "title": title,
                "content": content,
                "dorm": dorm,
            }, namespace="/")
    except Exception:
        pass


def start_mqtt():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    client.reconnect_delay_set(min_delay=1, max_delay=30)
    connected = False
    while not connected:
        try:
            client.connect(Config.MQTT_BROKER, Config.MQTT_PORT, 60)
            connected = True
        except Exception:
            logger.error("Cannot connect to MQTT broker at %s:%s. Retrying in 5s...", Config.MQTT_BROKER, Config.MQTT_PORT)
            time.sleep(5)
    client.loop_forever()
