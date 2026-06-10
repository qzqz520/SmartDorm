import paho.mqtt.client as mqtt
import time
import random
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import Config

BROKER = Config.MQTT_BROKER
PORT = Config.MQTT_PORT
TOPIC = Config.MQTT_TOPIC
dorm_list = ["A栋101", "A栋102", "B栋101", "B栋102", "C栋201", "C栋202"]

def main():
    client = mqtt.Client()
    try:
        client.connect(BROKER, PORT, 60)
        print("Connected to MQTT broker at {}:{}".format(BROKER, PORT))
    except Exception as e:
        print("Failed to connect to MQTT broker: {}".format(e))
        sys.exit(1)
    try:
        while True:
            for dorm in dorm_list:
                temp = round(random.uniform(20.0, 35.0), 1)
                hum = round(random.uniform(40.0, 70.0), 1)
                smoke = random.randint(0, 20)
                if random.random() < 0.1:
                    temp = round(random.uniform(38.0, 45.0), 1)
                if random.random() < 0.05:
                    smoke = random.randint(60, 100)
                payload = {"dorm_number": dorm, "temperature": temp, "humidity": hum, "smoke": smoke}
                client.publish(TOPIC, json.dumps(payload))
                print("Published: {}".format(payload))
            time.sleep(5)
    except KeyboardInterrupt:
        print("Simulator stopped.")

if __name__ == "__main__":
    main()
