# Persona

AI 编程 CLI Provider 管理工具

## 界面

![界面](docs/screenshot.png)

## 安装

从 [GitHub Releases](https://github.com/puterjam/persona/releases) 页面下载最新版本。

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
| Enter | 切换到选中的 provider |
| a | 新增 provider |
| e | 编辑选中的 provider |
| d | 删除选中的 provider |
| p | 测试 ping 选中的 provider |
| c | 编辑通用配置 |
| q | 退出 |

### 命令行模式

#### 查看 Providers

```bash
persona list
```

#### 新增 Provider

```bash
persona add
```

#### 切换 Provider

```bash
persona switch <provider-id>
```

#### 测试 Provider

```bash
persona test <provider-id>
```

#### 删除 Provider

```bash
persona delete <provider-id>
```

#### 编辑配置

```bash
persona config edit
```

## 配置文件

- **Provider 配置：** `~/.persona/config.json`
- **Claude 配置：** `~/.claude/settings.json`
- **通用配置：** `~/.persona/general.json`

## 许可证

MIT
