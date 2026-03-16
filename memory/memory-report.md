# 内存监控报告

**生成时间**: 2026-03-16 20:33:38
**生成者**: OpenClaw Memory Guardian (Round 336)

---

## 📊 内存状态

| 指标 | 数值 | 状态 |
|------|------|------|
| 内存使用率 | 84.7% | alert |
| 可用内存 | 317 MB | 🟡 |
| Swap 使用率 | 0% | ✅ |
| 系统负载 | 0.21 | ✅ |

---

## 🔍 高内存进程

```
root     3992712  6.4 47.7 23885996 1795596 ?    Rl   Mar15 107:47 openclaw-gateway
systemd+    3534  0.8  5.1 4015412 194876 ?      SLsl Feb25 226:28 mongod --bind_ip_all --replSet rs0 --keyFile /data/db/keyfile --auth
systemd+   19312  0.3  3.2 3733744 123940 ?      Ssl  Feb25 108:01 mongod --bind_ip_all --auth
root        4730  0.5  2.5 1174952 97504 ?       Sl   Feb25 149:58 /usr/local/qcloud/YunJing/YDEyes/YDService
root         567  0.0  1.6 498900 61976 ?        Ss   Feb25   9:47 /usr/lib/systemd/systemd-journald
```

---

## 📈 建议

🟠 内存使用警告，建议执行中度清理。
```bash
bash /root/.openclaw/workspace/evolver/fixes/memory-guardian.sh --clean-medium
```
