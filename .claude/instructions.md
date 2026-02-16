# 项目概览

## Persona v0.1.x
Claude CLI 配置切换工具，用于在不同的模型供应商之间切换。

## 技术栈
- Node.js + TypeScript
- 包管理: pnpm
- 配置文件存储: ~/.persona/config.json
- Claude 设置: ~/.claude/settings.json

## 常用命令
```bash
pnpm dev      # 开发模式
pnpm build    # 编译
pnpm link     # 全局安装
```

## 架构要点
- 命令式 CLI，使用 inquirer 做交互
- 使用 conf 库存储配置
- pre-commit hook 自动递增版本号

## 注意事项
- 配置文件在用户 home 目录，不是项目目录
- 修改 Claude 设置需要写入 ~/.claude/settings.json

---

# TUI Bug Fixes (persona)

## 列表导航问题

### 问题: 上下键切换列表时跳过某些项
**原因**: 手动调用 `providerList.up()/down()` 后，blessed 自己也处理了键，导致跳过一次
**解决**: 不要手动调用 `up()/down()`，让 blessed 处理导航，用 `setTimeout` 延迟获取选中项并更新详情
```typescript
screen.key('up', () => {
  setTimeout(() => {
    const selected = (providerList as any).selected;
    const providers = configStore.getProviders();
    if (providers[selected]) {
      showProviderDetails(providers[selected]);
    }
  }, 10);
});
```

### 问题: 鼠标点击列表不显示 info
**原因**: blessed list 的 `click` 事件不触发，需要监听 screen 的 `mouse` 事件
**解决**: 监听 screen 的 `mouseup` 事件
```typescript
screen.on('mouse', (data: any) => {
  if (data.action === 'mouseup' && data.button === 'left') {
    if (data.x < 30) { // 列表在左侧 30%
      setTimeout(() => {
        const selected = (providerList as any).selected;
        const providers = configStore.getProviders();
        if (providers[selected]) {
          showProviderDetails(providers[selected]);
        }
      }, 10);
    }
  }
});
```

### 问题: 中文显示为 ????
**解决**: 在程序入口 (index.ts) 设置 UTF-8 locale
```typescript
process.env.LC_ALL = 'en_US.UTF-8';
process.env.LANG = 'en_US.UTF-8';
```
