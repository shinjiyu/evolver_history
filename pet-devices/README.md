# 宠物智能设备数据获取工具

本目录包含用于获取小米喂食器和小佩猫砂盆数据的脚本。

## 目录结构

```
pet-devices/
├── README.md              # 本文件
├── xiaomi-feeder.js       # 小米喂食器脚本
├── petkit-litter.js       # 小佩猫砂盆脚本
└── data/                  # 数据存储目录
```

## 一、小米自动喂食器

### 前置要求

1. **安装 Node.js 和 npm**
2. **安装 python-miio（用于获取 Token）**
   ```bash
   pip install python-miio
   ```

### 安装依赖

```bash
npm install miio
```

### 获取设备 Token

**方法 1：使用 miiocli（推荐）**

```bash
miiocli cloud
# 输入小米账号和密码
# 会列出所有设备及其 Token
```

**方法 2：从 Android App 提取**

1. 安装米家 App v5.x 版本
2. 使用 ADB 备份应用数据：
   ```bash
   adb backup --noapk com.xiaomi.smarthome -f mihome_backup.ab
   ```
3. 解压备份文件，提取 SQLite 数据库中的 Token

### 配置

设置环境变量：

```bash
export XIAOMI_DEVICE_IP="192.168.1.100"
export XIAOMI_DEVICE_TOKEN="your-token-here"
```

或直接修改脚本中的 `CONFIG` 对象。

### 使用方法

```bash
# 获取设备状态（一次）
node xiaomi-feeder.js status

# 手动喂食（1 份）
node xiaomi-feeder.js feed 1

# 持续监控（每分钟采集一次）
node xiaomi-feeder.js poll
```

### 可用数据

| 数据类型 | 获取方式 | 说明 |
|----------|----------|------|
| 设备信息 | `miIO.info` | 型号、固件版本等 |
| 剩余粮量 | `get_prop` | 百分比 |
| 喂食记录 | `get_feed_record` | 历史记录 |
| 设备状态 | `get_prop` | 在线/离线/故障 |

### 故障排除

**问题：连接失败**
- 检查设备 IP 是否正确
- 确保设备和电脑在同一局域网
- 验证 Token 是否正确

**问题：Token 无效**
- 重新使用 `miiocli cloud` 获取 Token
- 注意：设备重置后 Token 会改变

---

## 二、小佩自动猫砂盆

### 前置要求

1. **安装 Node.js 和 npm**
2. **安装 mitmproxy（用于抓包）**
   ```bash
   pip install mitmproxy
   ```

### 安装依赖

```bash
npm install axios
```

### 抓包分析（首次使用必须）

```bash
# 1. 启动 mitmproxy
mitmproxy -p 8080

# 2. 手机配置代理
# WiFi 设置 -> 代理 -> 手动
# 主机名: 电脑 IP
# 端口: 8080

# 3. 手机浏览器访问 mitm.it，安装证书

# 4. 打开 PETKIT App，完整操作一遍

# 5. 在 mitmproxy 中查看捕获的请求
# 记录以下信息：
# - API 基础 URL
# - 登录端点
# - 设备列表端点
# - 设备状态端点
# - 使用记录端点
# - 认证方式（Token/Session）
```

### 配置

根据抓包结果，修改脚本中的配置：

```javascript
const CONFIG = {
  baseUrl: 'https://api.petkit.com',  // 实际的 API URL
  email: 'your-email@example.com',
  password: 'your-password',
  deviceId: 'your-device-id',
};
```

### 使用方法

```bash
# 登录测试
node petkit-litter.js login

# 获取设备列表
node petkit-litter.js devices

# 获取设备状态
node petkit-litter.js status

# 触发清洁
node petkit-litter.js clean

# 持续监控
node petkit-litter.js poll
```

### 可用数据（需通过抓包确认）

| 数据类型 | 可能的端点 | 说明 |
|----------|------------|------|
| 设备列表 | `/v1/device/list` | 所有绑定设备 |
| 设备状态 | `/v1/device/{id}/status` | 当前状态 |
| 使用记录 | `/v1/device/{id}/usage` | 历史记录 |
| 清洁状态 | - | 自动清洁次数 |

---

## 三、集成到 OpenClaw

### 方案 1：定期 Cron 任务

```bash
# 添加到 crontab
# 每 5 分钟采集一次数据
*/5 * * * * cd /root/.openclaw/workspace/pet-devices && node xiaomi-feeder.js status >> /var/log/pet-feeder.log 2>&1
*/5 * * * * cd /root/.openclaw/workspace/pet-devices && node petkit-litter.js status >> /var/log/pet-litter.log 2>&1
```

### 方案 2：创建 OpenClaw Skill

在 `/root/.openclaw/workspace/skills/pet-monitor/` 创建：

```markdown
# SKILL.md - 宠物监控技能

## 触发条件
- 用户询问宠物喂食/如厕情况
- 定时心跳检查

## 执行步骤
1. 运行 xiaomi-feeder.js status
2. 运行 petkit-litter.js status
3. 汇总数据并报告给用户
```

### 方案 3：实时通知

当检测到以下情况时发送通知：
- 喂食器粮量低于 20%
- 喂食器故障/堵塞
- 猫砂盆清洁次数异常
- 设备离线

---

## 四、数据存储格式

数据以 JSON 格式存储在 `data/` 目录：

**feeder-data.json:**
```json
[
  {
    "timestamp": "2026-02-23T15:30:00.000Z",
    "data": {
      "deviceInfo": { ... },
      "status": { ... },
      "history": [ ... ]
    }
  }
]
```

**litter-data.json:**
```json
[
  {
    "timestamp": "2026-02-23T15:30:00.000Z",
    "data": {
      "status": { ... },
      "history": [ ... ],
      "parsedHistory": [ ... ]
    }
  }
]
```

---

## 五、安全注意事项

1. **Token 安全**
   - 不要将 Token 提交到 Git
   - 使用环境变量存储敏感信息
   - 定期更换 Token

2. **网络安全**
   - 仅在可信网络进行抓包
   - 抓包完成后关闭代理

3. **数据隐私**
   - 数据存储在本地
   - 不要上传到云端
   - 定期清理旧数据

---

## 六、故障排除

### 小米设备

| 问题 | 原因 | 解决方法 |
|------|------|----------|
| 连接超时 | 网络不通 | 检查 IP、防火墙 |
| Token 无效 | 设备重置或过期 | 重新获取 Token |
| 命令不支持 | 设备型号不支持 | 尝试 genericmiot |

### PETKIT 设备

| 问题 | 原因 | 解决方法 |
|------|------|----------|
| 登录失败 | API 端点错误 | 重新抓包确认 |
| 401 错误 | Token 过期 | 重新登录 |
| 404 错误 | 端点不存在 | 确认 API 版本 |

---

## 七、相关资源

- [研究报告](../memory/pet-devices-research.md)
- [python-miio 文档](https://github.com/rytilahti/python-miio)
- [mitmproxy 文档](https://docs.mitmproxy.org/)
