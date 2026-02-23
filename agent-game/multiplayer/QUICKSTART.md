# 🚀 快速开始指南

## 1️⃣ 启动服务器（30秒）

```bash
cd /root/.openclaw/workspace/agent-game/multiplayer
npm install  # 首次运行需要
npm start
```

看到这个界面就成功了：
```
════════════════════════════════════════════════════════════
🎮 Agent Game Multiplayer Server
════════════════════════════════════════════════════════════
📡 服务器地址: http://0.0.0.0:3457
🔌 WebSocket: ws://0.0.0.0:3457/ws/game/{roomId}
```

## 2️⃣ 运行测试（1分钟）

### 方法 1：快速测试（推荐）

打开 3 个终端窗口，分别运行：

```bash
# 终端 1 - 战士
cd /root/.openclaw/workspace/agent-game/multiplayer
node example-ai-client.js ws://localhost:3457 warrior

# 终端 2 - 法师
node example-ai-client.js ws://localhost:3457 mage

# 终端 3 - 盗贼
node example-ai-client.js ws://localhost:3457 thief
```

当 3 个 AI 都加入后，游戏会自动开始！

### 方法 2：连接测试

```bash
cd /root/.openclaw/workspace/agent-game/multiplayer
node test-connection.js
```

## 3️⃣ 观察游戏（可选）

打开浏览器访问：
```
http://localhost:3457
```

## 🎮 游戏进行中

你会看到类似这样的输出：

```
⏱️  第 1 回合
────────────────────────────────────────────────────────────

🤖 AI_Warrior: attack → enemy_goblin_001
   💭 哥布林威胁着我们，我先攻击它！
   ⚔️  攻击 goblin，造成 12 点伤害 (8/20)

🤖 AI_Mage: attack → enemy_goblin_001
   💭 用魔法攻击敌人
   ⚔️  攻击 goblin，造成 18 点伤害 (-10/20)
   💀 goblin 被击败！

🤖 AI_Thief: move → room_2
   💭 继续探索，前往 room_2
   🚶 移动到 晶石矿脉

📊 回合结束
```

## 🛑 停止游戏

按 `Ctrl+C` 停止所有进程。

## 📚 更多信息

- 完整文档：`README.md`
- 技术方案：`TECHNICAL_DESIGN.md`
- 协议文档：`protocol.js` (底部)
- 完成总结：`SUMMARY.md`

## 🎯 下一步

### 实现自己的 AI

编辑 `example-ai-client.js`，修改 `makeDecision()` 方法：

```javascript
makeDecision(turn) {
  // 你的 AI 逻辑
  const decision = {
    action: 'attack',
    target: 'enemy_001',
    reason: '我的策略是...'
  };
  
  this.submitAction(decision);
}
```

### 部署到生产环境

```bash
./deploy.sh
# 选择 PM2 或 Systemd
```

## ❓ 常见问题

**Q: 端口被占用怎么办？**
```bash
lsof -i :3457  # 查看占用进程
kill -9 <PID>  # 停止进程
```

**Q: AI 连接失败？**
```bash
# 检查服务器状态
curl http://localhost:3457/health
```

**Q: 如何查看日志？**
```bash
# 服务器日志在控制台输出
# 或使用 PM2
pm2 logs agent-game-server
```

---

**祝你游戏愉快！** 🎮
