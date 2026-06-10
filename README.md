# 🏠 智慧宿舍管理系统 (SmartDorm)

基于 **Flask** 的智能宿舍管理平台，支持 IoT 传感器实时监控、报修、访客登记、宿舍评分、水电费管理等。

## ✨ 功能模块

| 模块 | 说明 |
|------|------|
| 🔐 登录注册 | 学生/管理员双角色，session 认证 |
| 📊 实时监控 | 温度、湿度、烟雾传感器数据，ECharts 可视化 |
| 🚨 异常告警 | 高温/烟雾自动告警推送 |
| 🔧 报修系统 | 提交 → 处理中 → 已完成，全流程追踪 |
| 📢 公告通知 | 管理员发布，学生端查看 |
| 👥 访客登记 | 预约 → 审核 → 签到 → 签退 |
| ⭐ 宿舍评分 | 管理员评分，学生查看排名 |
| 💰 水电费 | 费率设置、账单录入、缴费标记 |

## 🛠 技术栈

- **后端**: Python Flask + Flask-SocketIO + Flask-WTF
- **数据库**: SQLite
- **IoT**: MQTT (paho-mqtt) + Mosquitto Broker
- **前端**: Bootstrap 5 + ECharts
- **实时通信**: WebSocket (Socket.IO)
- **打包**: PyInstaller (可打包为桌面应用)

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/qzqz520/SmartDorm.git
cd SmartDorm/dorm_login
```

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 安装 MQTT Broker（可选，IoT 功能需要）
- 下载 [Mosquitto](https://mosquitto.org/download/)
- 安装后默认监听 `localhost:1883`

### 4. 启动系统
```bash
python run.py
```

### 5. 启动传感器模拟器（可选）
```bash
python -m app.sensor_simulator
```

### 6. 访问
- 🌐 浏览器打开 **http://127.0.0.1:8888**

### 测试账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | `admin` | `admin123` |
| 学生 | `2021001` | `123456` |

## ⚙️ 环境变量配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `SMARTDORM_SECRET_KEY` | 随机生成 | Flask 密钥 |
| `SMARTDORM_HOST` | 127.0.0.1 | 监听地址 |
| `SMARTDORM_PORT` | 8888 | 监听端口 |
| `SMARTDORM_DB` | dormitory.db | 数据库路径 |
| `SMARTDORM_MQTT_BROKER` | localhost | MQTT broker |
| `SMARTDORM_MQTT_PORT` | 8866 | MQTT 端口 |
| `SMARTDORM_MQTT_TOPIC` | dorm/sensor | MQTT 主题 |
| `SMARTDORM_TEMP_HIGH` | 37.0 | 高温告警阈值 |
| `SMARTDORM_SMOKE_HIGH` | 50 | 烟雾告警阈值 |
| `SMARTDORM_MAX_CAPACITY` | 4 | 宿舍最大人数 |
| `SMARTDORM_WATER_RATE` | 3.5 | 水费单价 |
| `SMARTDORM_ELECTRICITY_RATE` | 0.6 | 电费单价 |

## 🌐 公网部署

项目根目录提供了 `启动公网.bat` / `启动公网.py`，使用 ngrok 一键发布到公网：

```bash
python 启动公网.py
```

前提：已安装 [ngrok](https://ngrok.com/) 并配置到 PATH。

## 📁 项目结构

```
SmartDorm/
├── 启动公网.bat / .py      # 公网部署脚本
└── dorm_login/             # 主项目
    ├── run.py              # 启动入口
    ├── SmartDorm.py        # 主应用入口
    ├── requirements.txt    # Python 依赖
    ├── data/               # SQLite 数据库
    └── app/                # Flask 应用
        ├── app.py          # Flask 工厂
        ├── config.py       # 配置
        ├── models.py       # 数据模型
        ├── auth_helpers.py # 认证辅助
        ├── mqtt_client.py  # MQTT 客户端
        ├── sensor_simulator.py  # 传感器模拟
        ├── routes/         # 路由模块
        │   ├── auth.py     # 登录/注册
        │   ├── admin.py    # 管理员后台
        │   ├── monitor.py  # 监控面板
        │   └── api.py      # API 接口
        ├── templates/      # Jinja2 模板 (18 个页面)
        └── static/         # 静态资源 (PWA)
```

## 📄 License

MIT License — 仅供学习参考
