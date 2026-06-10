# 智慧宿舍管理系统 (SmartDorm)

基于 Flask 的智能宿舍管理系统，支持 IoT 传感器实时监控、报修、访客登记、宿舍评分、水电费管理等。

## 技术栈
- Python Flask + Flask-SocketIO + Flask-WTF
- SQLite 数据库
- MQTT (paho-mqtt) IoT 数据接入
- Bootstrap 5 + ECharts 数据可视化
- pywebview 桌面端打包

## 快速开始

### 1. 安装依赖
```bash
pip install -r requirements.txt
```

### 2. 安装 MQTT Broker (Mosquitto)
- 下载: https://mosquitto.org/download/
- 安装后默认监听 localhost:1883，如需改端口请设置环境变量 `SMARTDORM_MQTT_PORT`

### 3. 启动系统
```bash
python run.py
```

### 4. 启动传感器模拟器 (可选)
```bash
python sensor_simulator.py
```

### 5. 访问
- 浏览器打开 http://127.0.0.1:8888
- 学生账号: `2021001` / `123456`
- 管理员账号: `admin` / `admin123`

## 配置
通过环境变量配置（均有默认值）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| SMARTDORM_SECRET_KEY | 随机生成 | Flask 密钥 |
| SMARTDORM_HOST | 127.0.0.1 | 监听地址 |
| SMARTDORM_PORT | 8888 | 监听端口 |
| SMARTDORM_DB | dormitory.db | 数据库路径 |
| SMARTDORM_MQTT_BROKER | localhost | MQTT broker |
| SMARTDORM_MQTT_PORT | 8866 | MQTT 端口 |
| SMARTDORM_MQTT_TOPIC | dorm/sensor | MQTT 主题 |
| SMARTDORM_TEMP_HIGH | 37.0 | 高温告警阈值 |
| SMARTDORM_SMOKE_HIGH | 50 | 烟雾告警阈值 |
| SMARTDORM_MAX_CAPACITY | 4 | 宿舍最大人数 |
| SMARTDORM_WATER_RATE | 3.5 | 水费单价 |
| SMARTDORM_ELECTRICITY_RATE | 0.6 | 电费单价 |

## 功能模块
- 学生/管理员登录注册
- 宿舍传感器实时监控（温度、湿度、烟雾）
- 异常告警（高温、烟雾）
- 报修系统（提交/处理/完成）
- 公告通知
- 访客登记（预约/审核/签到/签退）
- 宿舍卫生评分
- 水电费管理（费率设置/账单录入/缴费标记）
