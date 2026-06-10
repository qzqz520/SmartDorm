# -*- coding: utf-8 -*-
"""
SmartDorm - One-click public deployment
Starts Flask server + ngrok tunnel, displays public URL.
"""
import subprocess
import time
import sys
import os
import json
import urllib.request
import threading

os.chdir(os.path.dirname(os.path.abspath(__file__)))
DORM_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dorm_login")
FLASK_URL = "http://127.0.0.1:8888/login"
NGROK_API = "http://127.0.0.1:4040/api/tunnels"

def print_banner():
    print("""
    ========================================
       智慧宿舍管理系统 - SmartDorm
    ========================================
    """)

def start_flask():
    print("    [1/2] Starting Flask server...")
    subprocess.Popen(
        [sys.executable, "SmartDorm.py"],
        cwd=DORM_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print("    [*] Waiting for server to be ready...")
    for _ in range(30):
        try:
            urllib.request.urlopen(FLASK_URL, timeout=2)
            print("    [OK] Server is ready\n")
            return True
        except Exception:
            time.sleep(1)
    print("    [FAIL] Server did not start in time!")
    return False

def start_ngrok():
    print("    [2/2] Starting ngrok tunnel...")
    subprocess.Popen(
        ["ngrok", "http", "8888", "--log=stdout"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print("    [*] Fetching public URL...")
    for _ in range(20):
        try:
            resp = urllib.request.urlopen(NGROK_API, timeout=2)
            data = json.loads(resp.read())
            for t in data.get("tunnels", []):
                if t.get("public_url", "").startswith("https"):
                    return t["public_url"]
        except Exception:
            pass
        time.sleep(1)
    return None

def main():
    print_banner()

    if not start_flask():
        input("Press Enter to exit...")
        return

    url = start_ngrok()
    if not url:
        print("    [FAIL] ngrok tunnel failed!")
        input("Press Enter to exit...")
        return

    print("\n    ========================================\n")
    print("       >> 公网访问地址：\n")
    print(f"       {url}")
    print("\n    ========================================\n")
    print("    [管理员] admin / admin123")
    print("    [学生]   2021001 / 123456")
    print()
    print("    ─────────────────────────────────────")
    print("    按 Ctrl+C 停止所有服务")
    print("    ─────────────────────────────────────")

    try:
        while True:
            time.sleep(10)
    except KeyboardInterrupt:
        print("\n    Service stopped.")

if __name__ == "__main__":
    main()
