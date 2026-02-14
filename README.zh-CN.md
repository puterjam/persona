# Persona

一个用于切换 Claude CLI 配置的 CLI 工具，支持在不同模型供应商之间切换。

## 功能特性

- 支持 20+ 模型供应商
- 交互式命令行引导
- TUI 键盘交互模式
- API 连接测试（自动端点检测）
- 配置存储在 `~/.persona/`
- Claude 配置写入 `~/.claude/settings.json`

## 安装

```bash
git clone https://github.com/puterjam/persona.git
cd persona
npm install
npm run build
sudo npm link
```

## 使用方法

```bash
# 列出所有已配置的供应商
persona list

# 切换供应商（交互模式）
persona switch

# 切换到指定供应商
persona switch <供应商ID>

# 重置为默认（Anthropic 官方）
persona switch --reset

# 添加新供应商（交互模式）
persona add

# 使用模板添加供应商
persona add --template claude/minimax --api-key YOUR_API_KEY

# 编辑供应商
persona edit <供应商ID>

# 删除供应商
persona delete <供应商ID>

# 测试 API 连接
persona test [供应商ID]

# 显示当前状态
persona status

# 列出可用模板
persona templates

# 启动交互式 TUI 模式
persona interactive

# 显示帮助
persona help
```

## 可用模板

### 国内官方
- DeepSeek
- 智谱 GLM
- 阿里百炼
- Kimi / Kimi for Coding
- MiniMax
- 字节豆包
- 小米 MiMo

### 聚合平台
- ModelScope
- SiliconFlow
- OpenRouter
- Nvidia NIM

### 国际
- Claude 官方
- OpenAI
- Ollama（本地）
- Cloudflare Workers AI
- Groq

## 配置说明

- 用户配置：`~/.persona/config.json`
- Claude 配置：`~/.claude/settings.json`

## 许可证

MIT
