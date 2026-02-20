# Persona

AI 编程 CLI Provider 管理工具

## 支持的 CLI 工具

| CLI | 描述 |
|-----|------|
| Claude | Anthropic's Claude CLI |
| Codex | OpenAI's Codex CLI |

## 界面

![界面](docs/screenshot.png)

[中文文档](README.zh-CN.md) | [English Documentation](README.md)

## 安装

### 快速安装

```bash
curl -sSfL https://puterjam.github.io/persona/install.sh | bash
```

自定义安装目录：
```bash
curl -sSfL https://puterjam.github.io/persona/install.sh | bash -s -- -d /usr/local/bin
```

### 手动下载
### 支持的平台

| 平台 | 架构 | 文件名 |
|------|------|--------|
| macOS | ARM64 (Apple Silicon) | `persona-{version}-bun-darwin-arm64` |
| macOS | x64 (Intel) | `persona-{version}-bun-darwin-x64` |
| Linux | x64 | `persona-{version}-bun-linux-x64` |
| Linux | ARM64 | `persona-{version}-bun-linux-arm64` |
| Windows | x64 | `persona-{version}-bun-windows-x64.exe` |

下载对应系统的可执行文件，在 Linux/macOS 上添加执行权限，并添加到 PATH。

## 使用方法

### 交互模式

启动交互式 TUI：

```bash
persona
```

**快捷键：**

| 按键 | 功能 |
|------|------|
| ↑/↓ | 浏览 provider 列表 |
| Tab | 切换 Claude/Codex 模式 |
| Enter | 切换到选中的 provider |
| a | 新增 provider |
| e | 编辑选中的 provider |
| d | 删除选中的 provider |
| p | 测试 ping 选中的 provider |
| t | 更换风格 |
| q | 退出 |

### 命令行模式

#### 查看 Providers

```bash
persona ls                    # 查看 Claude providers (默认)
persona ls --target claude    # 查看 Claude providers
persona ls --target codex     # 查看 Codex providers
```

#### 新增 Provider

```bash
persona add                   # 新增 Claude provider (默认)
persona add --target codex    # 新增 Codex provider
```

#### 切换 Provider

```bash
persona use <provider-id>                   # 切换 Claude provider (默认)
persona use --target claude <provider-id>   # 切换 Claude provider
persona use --target codex <provider-id>    # 切换 Codex provider
```

#### 测试 Provider

```bash
persona ping <provider-id>
```

#### 删除 Provider

```bash
persona rm <provider-id>
```

#### 查看当前状态

```bash
persona status        # 显示 Claude 和 Codex 的 provider 状态
```

#### 主题管理

```bash
persona theme              # 显示当前主题
persona theme list         # 列出可用主题
persona theme <名称>       # 切换主题 (persona, gruvbox, dracula, nord)
```

#### 环境变量覆盖

```bash
persona env                # 显示环境变量覆盖配置
persona env edit          # 编辑环境变量覆盖配置
```

#### Provider 模板

```bash
persona templates         # 列出可用的 provider 模板
persona templates codex  # 列出 Codex 模板
```

#### 同步模板和主题

```bash
persona sync                    # 从 GitHub 同步所有模板和主题
persona sync --templates        # 仅同步模板
persona sync --themes          # 仅同步主题
persona sync --force           # 强制覆盖现有文件
```

> 注意：安装后请运行 `persona sync` 将最新的模板和主题下载到 `~/.persona/`

## 支持的 CLI 目标

Persona 支持管理多种 AI CLI 工具的 providers：

| 目标 | 描述 |
|------|------|
| Claude | Anthropic's Claude CLI (默认) |
| Codex | OpenAI's Codex CLI |

### Codex 配置

新增 Codex provider 时，需要配置：

- **Wire API**: 选择 `responses`、`completions` 或 `chat`
- **OpenAI 认证**: 该 provider 是否需要 OpenAI 认证

示例 Codex providers:

- Ollama (本地)
- OpenAI 兼容 API (DeepSeek 等)

切换到 Codex provider 后，运行：

```bash
codex --profile persona
```

这将使用 Persona 配置的 `persona` 配置集。

## 配置文件

- **Provider 配置：** `~/.persona/config.json`
- **通用配置：** `~/.persona/general.json`

## 主题

![Themes](docs/screenshot2.png)

Persona 支持多种配色主题：

| 主题 | 描述 |
|------|------|
| persona | 默认深色主题 |
| gruvbox | 复古配色 |
| dracula | 紫色暗色主题 |
| nord | 北欧蓝 |

## 许可证

MIT
