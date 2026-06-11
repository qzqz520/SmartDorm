import os

# Render sets PORT env var
port = os.environ.get("PORT", "8888")
bind = f"0.0.0.0:{port}"

# Single worker for SocketIO
worker_class = "eventlet"
workers = 1

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
