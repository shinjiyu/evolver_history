---
name: api-key-configurator
description: API Key 配置助手，自动检测、配置和验证各种服务的 API Key。适用于：(1) 工具报错提示 API Key 缺失、(2) 用户说"配置 API Key"、"检查配置"、(3) 启动时验证配置完整性、(4) 需要设置新的 API 集成。
---

# API Key Configurator - API Key 配置助手

自动检测、配置和验证系统所需的各种 API Key，确保所有工具和服务可用。

## 核心流程

```
检测缺失 → 诊断问题 → 提供指导 → 验证配置 → 持续监控
```

## 支持的 API Keys

| 服务 | 环境变量 | 用途 | 获取方式 |
|------|---------|------|---------|
| **Brave Search** | `BRAVE_API_KEY` | web_search 工具 | https://brave.com/search/api/ |
| **EvoMap** | `EVOMAP_API_KEY` | EvoMap Bounty 系统 | https://evomap.ai/settings/api |
| **GitHub** | `GITHUB_TOKEN` | Git 操作、API 调用 | https://github.com/settings/tokens |
| **OpenAI** | `OPENAI_API_KEY` | LLM 调用（备用） | https://platform.openai.com/api-keys |
| **Feishu** | `FEISHU_APP_ID` + `FEISHU_APP_SECRET` | 飞书集成 | https://open.feishu.cn/app |

## 使用场景

### 1. 检测缺失的 API Keys

```
用户：检查 API Key 配置
用户：验证配置完整性
```

**执行流程**:
1. 读取环境变量
2. 检查每个必需的 API Key
3. 验证 Key 格式（长度、前缀等）
4. 生成配置报告
5. 提供修复建议

### 2. 配置新的 API Key

```
用户：配置 Brave API Key
用户：设置 BRAVE_API_KEY=xxx
```

**执行流程**:
1. 接收 API Key
2. 验证格式
3. 保存到配置文件
4. 测试连接
5. 确认可用

### 3. 验证 API Key 有效性

```
用户：验证 Brave API Key 是否有效
```

**执行流程**:
1. 读取已配置的 Key
2. 发送测试请求
3. 验证响应
4. 报告状态

## 配置文件位置

**环境变量文件**（优先级从高到低）:

1. **系统环境变量** - 最高优先级
   - 通过 `export` 设置
   
2. **项目 .env 文件**
   - `/root/.openclaw/workspace/evolver/.env`
   - Git 忽略，适合本地配置

3. **全局 .env 文件**
   - `~/.env`
   - 全局配置

## 配置方法

### 方法 1: 环境变量（推荐用于生产）

```bash
# 临时设置（当前会话）
export BRAVE_API_KEY="your-api-key-here"

# 永久设置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export BRAVE_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc

# OpenClaw Gateway 配置
# 在 Gateway 环境中设置环境变量
```

### 方法 2: .env 文件（推荐用于开发）

```bash
# 创建 .env 文件
cat > /root/.openclaw/workspace/evolver/.env << EOF
# Brave Search API
BRAVE_API_KEY=your-api-key-here

# EvoMap API
EVOMAP_API_KEY=your-evomap-key-here

# GitHub Personal Access Token
GITHUB_TOKEN=ghp_your-token-here

# Feishu Integration
FEISHU_APP_ID=your-app-id
FEISHU_APP_SECRET=your-app-secret
EOF

# 设置权限（仅所有者可读）
chmod 600 /root/.openclaw/workspace/evolver/.env
```

### 方法 3: OpenClaw Configure 命令

```bash
# Web 搜索配置
openclaw configure --section web
# 按提示输入 BRAVE_API_KEY

# 通用配置
openclaw configure
# 交互式配置所有服务
```

## 验证脚本

### 自动检测脚本

```bash
#!/bin/bash
# check-api-keys.sh - 检查 API Key 配置状态

echo "=== API Key 配置检查 ==="
echo ""

# 检查函数
check_key() {
    local name=$1
    local var=$2
    local required=$3
    
    if [ -n "${!var}" ]; then
        echo "✅ $name: 已配置"
        # 可选：验证格式
        if [[ ${!var} == "BSA"* ]]; then
            echo "   格式: 正确 (Brave Search API)"
        fi
    else
        if [ "$required" = "required" ]; then
            echo "❌ $name: 缺失（必需）"
        else
            echo "⚠️  $name: 未配置（可选）"
        fi
    fi
}

# 检查各个 API Keys
check_key "Brave Search API" "BRAVE_API_KEY" "required"
check_key "EvoMap API" "EVOMAP_API_KEY" "optional"
check_key "GitHub Token" "GITHUB_TOKEN" "optional"
check_key "OpenAI API" "OPENAI_API_KEY" "optional"

echo ""
echo "=== 配置文件位置 ==="
echo ".env: /root/.openclaw/workspace/evolver/.env"
echo "全局: ~/.env"
echo ""
echo "建议：将 API Keys 添加到 .env 文件"
```

### 测试连接脚本

```javascript
// test-api-connection.js - 测试 API Key 连接
const fetch = require('node-fetch');

async function testBraveAPI() {
  const apiKey = process.env.BRAVE_API_KEY;
  
  if (!apiKey) {
    console.log('❌ BRAVE_API_KEY 未配置');
    return false;
  }
  
  try {
    const response = await fetch('https://api.search.brave.com/res/v1/web/search?q=test', {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey
      }
    });
    
    if (response.ok) {
      console.log('✅ Brave API 连接成功');
      return true;
    } else if (response.status === 401) {
      console.log('❌ Brave API Key 无效');
      return false;
    } else {
      console.log(`⚠️  Brave API 响应: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Brave API 连接失败: ${error.message}`);
    return false;
  }
}

// 执行测试
testBraveAPI();
```

## 常见问题

### Q1: API Key 配置后不生效

**原因**:
- 环境变量未重新加载
- .env 文件未被读取
- 配置文件权限问题

**解决方案**:
```bash
# 重启 Gateway
openclaw gateway restart

# 或者重新加载环境
source ~/.bashrc

# 检查文件权限
ls -la /root/.openclaw/workspace/evolver/.env
# 应该是 -rw------- (600)
```

### Q2: 如何安全地存储 API Keys

**最佳实践**:
1. ✅ 使用 .env 文件（Git 忽略）
2. ✅ 设置文件权限为 600
3. ✅ 不要在代码中硬编码
4. ✅ 不要提交到 Git 仓库
5. ✅ 定期轮换密钥

**检查清单**:
```bash
# 确认 .env 在 .gitignore 中
grep ".env" /root/.openclaw/workspace/.gitignore

# 确认文件权限
stat -c "%a %n" /root/.openclaw/workspace/evolver/.env
# 应该输出: 600

# 确认未提交到 Git
cd /root/.openclaw/workspace
git status | grep ".env"
# 应该没有输出
```

### Q3: 多个 API Key 如何管理

**推荐结构**:
```
/root/.openclaw/workspace/evolver/
├── .env                    # 主配置文件
├── .env.production         # 生产环境（可选）
├── .env.development        # 开发环境（可选）
└── credentials.js          # 凭证加载器
```

**凭证加载器** (credentials.js):
```javascript
require('dotenv').config({ path: '.env' });

module.exports = {
  brave: process.env.BRAVE_API_KEY,
  evomap: process.env.EVOMAP_API_KEY,
  github: process.env.GITHUB_TOKEN,
  feishu: {
    appId: process.env.FEISHU_APP_ID,
    appSecret: process.env.FEISHU_APP_SECRET
  }
};
```

## 安全最佳实践

### 1. 最小权限原则

- ✅ 只授予必要的权限
- ✅ 使用只读 Token（如果可能）
- ✅ 设置 IP 白名单（如果服务支持）

### 2. 密钥轮换

```bash
# 定期更换 API Keys（建议每 3-6 个月）
# 1. 生成新 Key
# 2. 更新配置文件
# 3. 验证新 Key 可用
# 4. 撤销旧 Key
```

### 3. 监控和审计

```bash
# 记录 API Key 使用情况
# 检测异常使用模式
# 设置使用限额告警
```

## 自动化配置

### 一键配置脚本

```bash
#!/bin/bash
# setup-api-keys.sh - 一键配置所有 API Keys

ENV_FILE="/root/.openclaw/workspace/evolver/.env"

# 创建 .env 文件（如果不存在）
if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
    chmod 600 "$ENV_FILE"
fi

# 交互式配置
read -p "请输入 Brave Search API Key: " brave_key
read -p "请输入 EvoMap API Key (可选，按 Enter 跳过): " evomap_key
read -p "请输入 GitHub Token (可选，按 Enter 跳过): " github_token

# 写入配置
cat > "$ENV_FILE" << EOF
# Brave Search API
BRAVE_API_KEY=$brave_key

$( [ -n "$evomap_key" ] && echo "# EvoMap API
EVOMAP_API_KEY=$evomap_key" )

$( [ -n "$github_token" ] && echo "# GitHub Token
GITHUB_TOKEN=$github_token" )
EOF

echo "✅ API Keys 已配置到 $ENV_FILE"
echo "🔄 请重启 Gateway 以生效: openclaw gateway restart"
```

## 集成到进化系统

### 自动检测和告警

在 `evolver-log-analysis` 中添加 API Key 检测：

```javascript
// 检测 API Key 缺失错误
if (errorMessage.includes('missing_brave_api_key')) {
  report.addIssue({
    type: 'configuration',
    severity: 'P1',
    pattern: 'PAT-004',
    message: 'Brave API Key 缺失',
    solution: '运行 openclaw configure --section web 配置 API Key',
    impact: 'web_search 工具不可用'
  });
}
```

## 相关 Skills

- **safe-operations**: 安全的文件操作，避免配置文件损坏
- **evolution-verification**: 验证配置更改的效果
- **log-analysis**: 从日志中识别配置问题

---

## 使用示例

### 示例 1: 检查配置

```bash
$ node check-api-keys.sh

=== API Key 配置检查 ===

✅ Brave Search API: 已配置
   格式: 正确 (Brave Search API)
⚠️  EvoMap API: 未配置（可选）
✅ GitHub Token: 已配置

=== 配置文件位置 ===
.env: /root/.openclaw/workspace/evolver/.env
全局: ~/.env

建议：将 API Keys 添加到 .env 文件
```

### 示例 2: 配置新 Key

```
用户：配置 Brave API Key

助手：我将帮你配置 Brave Search API Key。

步骤 1: 获取 API Key
访问 https://brave.com/search/api/ 注册并获取 Key

步骤 2: 配置 Key
请提供你的 Brave API Key（以 BSA 开头）：
```

---

**相关文件**:
- 配置文件: `/root/.openclaw/workspace/evolver/.env`
- 检查脚本: `/root/.openclaw/workspace/evolver/check-api-keys.sh`
- 测试脚本: `/root/.openclaw/workspace/evolver/test-api-connection.js`

**Pattern**: 解决 PAT-004 及类似的配置问题
