# OpenTUI 特性总结

## 概述

OpenTUI 是一个 TypeScript 终端 UI 库，提供组件化架构和灵活的布局系统。它使用 Yoga 布局引擎（Facebook 的 Flexbox 实现），支持 imperative API 和声明式组件模式。

## 核心概念

### 1. Renderer (渲染器)

```typescript
import { createCliRenderer, type CliRenderer } from "@opentui/core"

const renderer = await createCliRenderer({
  autoFocus: true,           // 默认: true, 点击自动聚焦
  exitOnCtrlC: true,         // 默认: true, Ctrl+C 退出
  consoleOptions: {          // 控制台覆盖层配置
    position: ConsolePosition.BOTTOM,
    sizePercent: 30,
  }
})

// 启动渲染循环
renderer.start()

// 获取键盘处理器
const keyHandler = renderer.keyInput  // EventEmitter

// 获取主题模式
const mode = renderer.themeMode  // "dark" | "light" | null

// 根容器
renderer.root.add(childRenderable)
```

### 2. Renderables (可渲染组件)

所有 UI 元素都继承自 Renderable 基类，使用 Yoga 布局引擎进行定位和尺寸控制。

#### 位置和尺寸属性

```typescript
{
  position: "absolute" | "relative"  // 定位模式
  left: number, top: number, right: number, bottom: number
  width: number | "100%" | "auto"
  height: number | "100%" | "auto"
  zIndex: number                      // 层级
  visible: boolean                    // 可见性
}
```

#### 布局属性 (Yoga Flexbox)

```typescript
{
  flexDirection: "row" | "column"
  justifyContent: "flex-start" | "center" | "space-between" | ...
  alignItems: "flex-start" | "center" | "stretch" | ...
  flexGrow: number
  flexShrink: number
  padding: number
  margin: number
}
```

### 3. Constructs (构造器/组件)

使用函数调用的方式创建 Renderable，类似 React 的 JSX 但使用函数调用。

```typescript
import { Text, Box, Input, Select } from "@opentui/core"

// 两种方式都可以
const text1 = new TextRenderable(renderer, { ... })
const text2 = Text({ ... })
```

## 组件详解

### 1. TextRenderable (文本)

显示带样式的文本内容。

```typescript
import { TextRenderable, TextAttributes, t, bold, underline, fg } from "@opentui/core"

const text = new TextRenderable(renderer, {
  id: "my-text",
  content: "Hello World",
  fg: "#FFFF00",                    // 前景色 (hex/rgba/CSS name)
  bg: "#000000",                    // 背景色
  attributes: TextAttributes.BOLD | TextAttributes.UNDERLINE,
  position: "absolute",
  left: 10,
  top: 5,
})

// 使用模板字符串创建复杂样式
const styled = new TextRenderable(renderer, {
  content: t`${bold("粗体")} ${fg("#FF0000")(underline("红色下划线"))}`,
})

// 动态更新
text.content = "New content"
text.fg = "#00FF00"
```

### 2. BoxRenderable (容器)

带边框和背景的容器组件。

```typescript
import { BoxRenderable } from "@opentui/core"

const panel = new BoxRenderable(renderer, {
  id: "panel",
  width: 40,
  height: 15,
  backgroundColor: "#1e293b",
  borderStyle: "single" | "double" | "round" | "none",
  borderColor: "#FFFFFF",
  borderTop: true,
  borderBottom: true,
  borderLeft: true,
  borderRight: true,
  title: "Panel Title",
  titleAlignment: "left" | "center" | "right",
  titleColor: "#FFFFFF",
  position: "absolute",
  left: 5,
  top: 3,
})

// 动态更新
panel.title = "New Title"
panel.borderStyle = "double"
```

### 3. SelectRenderable (列表选择)

列表选择组件，用于从多个选项中选择。

```typescript
import { SelectRenderable, SelectRenderableEvents } from "@opentui/core"

interface SelectOption {
  name: string
  description: string
  value?: any
}

const menu = new SelectRenderable(renderer, {
  id: "menu",
  width: 40,
  height: 15,
  options: [
    { name: "Option 1", description: "Description 1", value: "opt1" },
    { name: "Option 2", description: "Description 2", value: "opt2" },
  ],
  selectedIndex: 0,
  backgroundColor: "#1e293b",
  focusedBackgroundColor: "#2d3748",
  textColor: "#e2e8f0",
  focusedTextColor: "#f7fafc",
  selectedBackgroundColor: "#3b82f6",
  selectedTextColor: "#ffffff",
  descriptionColor: "#94a3b8",
  selectedDescriptionColor: "#cbd5e1",
  showDescription: true,
  showScrollIndicator: true,
  wrapSelection: false,
  fastScrollStep: 5,
  position: "absolute",
  left: 5,
  top: 3,
})

// 事件监听
menu.on(SelectRenderableEvents.SELECTION_CHANGED, (index: number, option: SelectOption) => {
  console.log("Selected:", option.name)
})

menu.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
  console.log("Confirmed:", option.name)
})

// 方法
menu.focus()
menu.blur()
menu.moveUp()
menu.moveDown()
menu.setSelectedIndex(2)
const selected = menu.getSelectedOption()
const index = menu.getSelectedIndex()

// 更新选项
menu.options = newOptions
```

**键盘绑定**:
- `↑/k`: 向上移动
- `↓/j`: 向下移动
- `Shift+↑/↓`: 快速滚动
- `Enter`: 确认选择

### 4. InputRenderable (文本输入)

单行文本输入组件。

```typescript
import { InputRenderable, InputRenderableEvents } from "@opentui/core"

const input = new InputRenderable(renderer, {
  id: "name-input",
  width: 30,
  value: "Initial value",
  placeholder: "Enter text...",
  maxLength: 100,
  password: false,
  focusedBackgroundColor: "#1a1a1a",
  position: "absolute",
  left: 10,
  top: 8,
})

// 事件
input.on(InputRenderableEvents.INPUT, (value: string) => {
  console.log("Input:", value)
})

input.on(InputRenderableEvents.CHANGE, (value: string) => {
  console.log("Changed:", value)
})

input.on(InputRenderableEvents.ENTER, (value: string) => {
  console.log("Submitted:", value)
})

// 方法
input.focus()
input.blur()
input.value = "New value"
const value = input.value
```

### 5. TabSelectRenderable (标签页选择)

水平标签页选择组件。

```typescript
import { TabSelectRenderable, TabSelectRenderableEvents } from "@opentui/core"

const tabs = new TabSelectRenderable(renderer, {
  id: "tabs",
  width: 60,
  options: [
    { name: "Home", description: "Dashboard" },
    { name: "Settings", description: "Configure" },
  ],
  tabWidth: 15,
  position: "absolute",
  left: 2,
  top: 1,
})

tabs.on(TabSelectRenderableEvents.ITEM_SELECTED, (index, option) => {
  console.log("Tab selected:", option.name)
})

tabs.focus()
```

**键盘绑定**:
- `←/[`: 上一个标签
- `→/]`: 下一个标签
- `Enter`: 确认选择

### 6. GroupRenderable (布局容器)

用于 Flexbox 布局的容器。

```typescript
import { GroupRenderable, BoxRenderable } from "@opentui/core"

const container = new GroupRenderable(renderer, {
  id: "container",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  height: 10,
})

const leftPanel = new BoxRenderable(renderer, {
  flexGrow: 1,
  height: 10,
})

const rightPanel = new BoxRenderable(renderer, {
  width: 20,
  height: 10,
})

container.add(leftPanel)
container.add(rightPanel)
```

## 样式系统

### 颜色

```typescript
import { RGBA, parseColor } from "@opentui/core"

// 多种颜色格式
RGBA.fromInts(255, 0, 0, 255)     // RGB 整数 (0-255)
RGBA.fromValues(1.0, 0, 0, 1.0)   // RGB 浮点 (0.0-1.0)
RGBA.fromHex("#FF0000")            // Hex 字符串

// 便捷函数
parseColor("#FF0000")
parseColor("red")
parseColor({ r: 255, g: 0, b: 0, a: 255 })
```

### 文本属性

```typescript
import { TextAttributes } from "@opentui/core"

// 位运算组合
TextAttributes.BOLD
TextAttributes.UNDERLINE
TextAttributes.ITALIC
TextAttributes.INVERSE
TextAttributes.STRIKETHROUGH

// 使用
attributes: TextAttributes.BOLD | TextAttributes.UNDERLINE
```

## 事件系统

### 键盘事件

```typescript
import { type KeyEvent } from "@opentui/core"

renderer.keyInput.on("keypress", (key: KeyEvent) => {
  console.log("Key:", key.name)
  console.log("Ctrl:", key.ctrl)
  console.log("Shift:", key.shift)
  console.log("Alt:", key.meta)
  console.log("Sequence:", key.sequence)
})

renderer.keyInput.on("paste", (event: PasteEvent) => {
  console.log("Pasted:", event.text)
})
```

### 焦点事件

```typescript
import { RenderableEvents } from "@opentui/core"

renderable.on(RenderableEvents.FOCUSED, () => {
  console.log("Focused!")
})

renderable.on(RenderableEvents.BLURRED, () => {
  console.log("Blurred!")
})

// 手动控制焦点
renderable.focus()
renderable.blur()
const isFocused = renderable.focused
```

### 组件特定事件

- `SelectRenderableEvents.SELECTION_CHANGED`: 选择改变
- `SelectRenderableEvents.ITEM_SELECTED`: 确认选择
- `InputRenderableEvents.INPUT`: 输入事件
- `InputRenderableEvents.CHANGE`: 值改变
- `InputRenderableEvents.ENTER`: 回车提交

## 样式模板

OpenTUI 提供 `t` 模板字符串函数用于创建复杂文本样式：

```typescript
import { t, bold, fg, bg, italic } from "@opentui/core"

const content = t`
  ${bold("粗体文本")}
  ${fg("#FF0000")("红色文本")}
  ${bg("#000000")("黑色背景")}
  ${italic("斜体")}
  正常文本
`
```

## 生命周期

```typescript
// 创建后
renderable.destroy()

// 检查状态
if (!renderable.isDestroyed) {
  // 使用组件
}
```

## 对比 blessed

| 功能 | blessed | OpenTUI |
|------|---------|---------|
| 创建屏幕 | `blessed.screen()` | `createCliRenderer()` |
| 列表 | `blessed.list()` | `SelectRenderable` |
| 输入框 | `blessed.textbox()` | `InputRenderable` |
| 文本 | `blessed.text()` | `TextRenderable` |
| 容器 | `blessed.box()` | `BoxRenderable` / `GroupRenderable` |
| 布局 | 手动计算 | Yoga Flexbox |
| 事件 | 回调函数 | EventEmitter |
| 样式 | 字符串/对象 | RGBA 类 |
| 颜色 | 字符串 | Hex/RGBA/CSS |

## 注意事项

1. **异步创建**: `createCliRenderer()` 返回 Promise
2. **需要 Zig**: 构建 OpenTUI 需要安装 Zig
3. **焦点管理**: 组件需要调用 `focus()` 才能接收键盘输入
4. **渲染请求**: 修改属性后调用 `requestRender()` 或等待自动重绘
5. **坐标**: 使用绝对坐标时设置 `position: "absolute"`
6. **zIndex**: 用于控制组件层级
