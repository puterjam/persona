可以# 版本更新记录

## v0.1.0 (2026-02-15)

### 新增功能
- 项目初始化完成
- Node.js + TypeScript CLI 工具框架
- 配置存储路径: ~/.persona/config.json
- Claude CLI 配置写入: ~/.claude/settings.json

### 已实现命令
- `persona list` - 列出所有供应商
- `persona switch` - 切换供应商 (交互式)
- `persona switch --reset` - 重置为默认 (Anthropic 官方)
- `persona add` - 添加供应商 (交互式/命令行)
- `persona edit <id>` - 编辑供应商
- `persona delete <id>` - 删除供应商
- `persona test [id]` - 测试 API 连接
- `persona status` - 显示当前状态
- `persona templates` - 列出可用模板
- `persona interactive` - 启动 TUI 交互模式
- `persona help` - 帮助信息

### 内置供应商模板 (templates/claude/)
- claude-official.json - Anthropic 官方
- deepseek.json - DeepSeek
- zhipu-glm.json - 智谱 GLM (国内)
- zhipu-glm-en.json - 智谱 GLM (国际)
- bailian.json - 阿里百炼
- kimi.json - Kimi API
- kimi-coding.json - Kimi for Coding
- minimax.json - MiniMax (国内)
- minimax-en.json - MiniMax (国际)
- doubao-seed.json - 字节豆包
- modelscope.json - ModelScope
- siliconflow.json - SiliconFlow (国内)
- siliconflow-en.json - SiliconFlow (国际)
- openrouter.json - OpenRouter
- nvidia.json - Nvidia NIM
- xiaomi-mimo.json - 小米 MiMo
- ollama.json - Ollama (本地)
- openai.json - OpenAI
- cloudflare.json - Cloudflare Workers AI
- groq.json - Groq

### 技术实现
- 配置存储: ~/.persona/config.json
- Claude 设置: ~/.claude/settings.json
- 模板目录: ./templates/claude/*.json
- 环境变量: ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_MODEL, ANTHROPIC_DEFAULT_HAIKU_MODEL, ANTHROPIC_DEFAULT_OPUS_MODEL, ANTHROPIC_DEFAULT_SONNET_MODEL, API_TIMEOUT_MS, CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC
