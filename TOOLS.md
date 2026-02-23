# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

### GitHub

- **Personal Access Token**: `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`
- **类型**: Classic Token
- **用途**: Git 操作、GitHub API 调用
- **配置位置**: `~/.git-credentials`, `/root/.openclaw/workspace/evolver/.env`（如果需要）
- **配置日期**: 2026-02-24

---

Add whatever helps you do your job. This is your cheat sheet.
