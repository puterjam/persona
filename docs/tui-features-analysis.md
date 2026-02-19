# TUI Features Analysis

## Overview
This document analyzes the original TUI implementation (`src/utils/tui.ts`, `src/utils/tui/dialogs.ts`, `src/utils/tui/views.ts`) to guide the refactoring to OpenTUI React (`src/tui/`).

## 1. Keyboard Shortcuts

### Implemented in Original (`handleGlobalKeyPress`)
| Key | Action | Implementation |
|-----|--------|----------------|
| `a` | Add Provider | Calls `startAddProviderFlow()` |
| `e` | Edit Provider | Calls `editProviderInTui(provider)` - requires selected provider |
| `p` | Ping Provider | Calls `testProviderInTui(provider)` - requires selected provider |
| `d` | Delete Provider | Calls `deleteProviderInTui(provider)` - requires selected provider |
| `r` | Refresh List | Calls `refreshProviderList()` |
| `q` | Quit | Destroys views and exits |

### Input Mode Check
```typescript
if (getIsInputMode() || getCurrentDialog()?.isOpen) {
  return  // Skip keyboard handling when in dialogs
}
```

### Status Bar Message
When provider list is focused:
```
↑↓ Navigate  Enter Switch  a Add  p Ping  d Delete  r Refresh  q Quit
```

## 2. Dialog System

### 2.1 Confirm Dialog
**File**: `src/utils/tui/dialogs.ts` - `showConfirmDialog()`

**Features**:
- Overlay with `zIndex: 200`
- Dialog box with `zIndex: 201`
- Two buttons: "Yes" and "No"
- Keyboard navigation:
  - `←/→` - Switch button selection
  - `Enter` - Confirm selection (returns `true` for Yes, `false` for No)
  - `Esc` - Cancel (returns `null`)
- Button highlighting: selected button uses `colors.selected` background

**Return Type**: `Promise<boolean | null>`

**Key Code**:
```typescript
let selectedButton = 0
const keyHandler = (k: any) => {
  if (k.name === "left" || k.name === "right") {
    selectedButton = selectedButton === 0 ? 1 : 0
    updateButtonStyles()
  } else if (k.name === "return") {
    resolve(selectedButton === 0)
  } else if (k.name === "escape") {
    resolve(null)
  }
}
renderer.keyInput.on("keypress", keyHandler)
```

### 2.2 Input Dialog
**File**: `src/utils/tui/dialogs.ts` - `showInputDialog()`

**Features**:
- Shows title and placeholder/message
- `InputRenderable` for actual text input
- Password mode support (`censored` prop)
- Required field validation
- Keyboard handling:
  - `Enter` - Confirm and return value (validates required fields)
  - `Esc` - Cancel and return `null`

**Parameters**:
- `title`: Dialog title
- `message`: Placeholder text for input
- `defaultValue`: Initial value
- `required`: If true, empty input triggers re-focus
- `password`: If true, censor the input

**Return Type**: `Promise<string | null>`

**Key Code**:
```typescript
input.on(InputRenderableEvents.ENTER, (value: string) => {
  const trimmed = value.trim()
  if (required && !trimmed) {
    input.focus()
    return
  }
  resolve(trimmed || defaultValue)
})
```

### 2.3 List Dialog
**File**: `src/utils/tui/dialogs.ts` - `showListDialog()`

**Features**:
- Select from a list of options
- `SelectRenderable` for the list
- Dynamic height based on number of choices (max 10)
- Keyboard handling:
  - `↑/↓` - Navigate options
  - `Enter` - Select option
  - `Esc` - Cancel and return `null`

**Parameters**:
- `title`: Dialog title
- `choices`: Array of `{name, value}` objects
- `defaultValue`: Pre-selected option value

**Return Type**: `Promise<string | null>` (returns the selected value)

**Key Code**:
```typescript
select.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
  currentDialog?.close()
  resolve(option.value)
})
```

## 3. Provider List Display

### File: `src/utils/tui/views.ts` - `createProviderList()`

**Features**:
- Left panel (30% width)
- Light background (`colors.bgLight`)
- Border on right side (`borderStyle: "heavy"`)
- `SelectRenderable` with:
  - First option: "(Default) ✓" or "(Default)" based on active state
  - Provider options: Name with ✓ if active
  - Description shows default model name

**List Options**:
```typescript
{
  showDescription: true,
  showScrollIndicator: true,
  wrapSelection: false,
  focusable: false  // Container handles focus
}
```

### Events
- `SELECTION_CHANGED`: Update detail panel, change border color based on active state
- `ITEM_SELECTED`: Switch to selected provider
- `FOCUSED`: Update status bar with help text

### Active Provider Border Color
- Active provider: `colors.primaryLight`
- Inactive provider: `colors.border`

## 4. Detail Panel

### File: `src/utils/tui/views.ts`

### Default Details (`showDefaultDetails`)
```
Default (Official)
Restore the official Anthropic configuration.
This will clear all custom provider settings.
✓ Active  (if default is active)
```

### Provider Details (`showProviderDetails`)
Shows:
- Name
- Website
- API URL
- Format
- Models:
  - Default: (model name or "(not set)")
  - Haiku: (model name or "(not set)")
  - Opus: (model name or "(not set)")
  - Sonnet: (model name or "(not set)")
- ✓ Active (if this provider is active)

### Ping Result Display
Success with timing breakdown:
```
✓ Ping successful!
  Latency: 123ms
    DNS: 45 ms
    CONN: 23 ms
    TTFB: 34 ms
    API: 21 ms
```

Failure:
```
✗ Ping failed: error message
```

## 5. Add Provider Flow

### File: `src/utils/tui.ts` - `startAddProviderFlow()`

**Steps**:
1. **Use Template?** - Confirm dialog
   - `Esc` returns `null` - cancel
   - `No` continues to manual input
   - `Yes` shows template selection

2. **Select Template** (if Yes) - List dialog
   - Lists all available templates
   - Format: "Provider Name - Description"
   - Loads defaults from selected template

3. **Enter Provider Name** - Input dialog (required)
4. **Enter Website URL** - Input dialog
5. **Enter API Base URL** - Input dialog (required)
6. **Enter API Key** - Input dialog (required, password mode)
7. **Default Model** - Input dialog (optional)
8. **Haiku Model** - Input dialog (optional)
9. **Opus Model** - Input dialog (optional)
10. **Sonnet Model** - Input dialog (optional)

**After Save**:
- Refresh provider list
- Show success message in detail panel
- Update status bar
- Focus provider select

## 6. Edit Provider Flow

### File: `src/utils/tui.ts` - `editProviderInTui()`

**Steps** (same as Add, but with pre-filled values):
1. **Edit Provider Name** - Input dialog (pre-filled, required)
2. **Edit Base URL** - Input dialog (pre-filled, required)
3. **Edit API Key** - Input dialog (empty prompt, password mode, optional)
   - Empty keeps current value
4. **Default Model** - Input dialog (pre-filled)
5. **Haiku Model** - Input dialog (pre-filled)
6. **Opus Model** - Input dialog (pre-filled)
7. **Sonnet Model** - Input dialog (pre-filled)

**Key Detail**: API Key prompt says "leave empty to keep current"

**After Update**:
- Call `configStore.updateProvider(id, updates)`
- Refresh provider list
- Show success message
- Update status bar

## 7. Delete Provider Flow

### File: `src/utils/tui.ts` - `deleteProviderInTui()`

**Steps**:
1. **Confirm Dialog**: "Are you sure you want to delete "{name}"?"
2. If confirmed:
   - `configStore.deleteProvider(id)`
   - Refresh provider list
   - Focus provider select
   - Show "✓ Provider deleted. Select another provider."
   - Update status bar

## 8. Ping Provider Flow

### File: `src/utils/tui.ts` - `testProviderInTui()`

**Steps**:
1. Show "Pinging [name]..." in detail panel
2. Update status bar to "Pinging..."
3. Call `testProvider(provider)`
4. Display result with timing breakdown or error

## 9. Theme System

### File: `src/utils/theme.ts`

**Colors**:
```typescript
interface ThemeColors {
  primary: string
  primaryLight: string
  text: string
  textMuted: string
  textHighlight: string
  bg: string
  bgLight: string
  border: string
  selected: string
  selectedText: string
  success: string
  error: string
  warning: string
  overlay: string
  dialogText: string
}
```

**Layout**:
```typescript
{
  statusBarHeight: 3,
  headerHeight: 5,
  consoleHeightPercent: 20,
  dialogMinWidth: 50,
  dialogMaxWidth: 60
}
```

## 10. Known Issues in New TUI (src/tui/)

### Critical Issues to Fix:

1. **ConfirmDialog** (`src/tui/components/dialogs/ConfirmDialog.tsx`):
   - `handleKeyPress` function defined but NEVER connected to `useKeyboard`
   - Buttons won't respond to keyboard input

2. **InputDialog** (`src/tui/components/dialogs/InputDialog.tsx`):
   - Only shows static text: "Use old TUI for input"
   - No actual `<input>` component
   - Non-functional

3. **ListDialog** (`src/tui/components/dialogs/ListDialog.tsx`):
   - Missing `useKeyboard` hook for Escape key
   - No focus management

4. **Edit Provider** (`src/tui/components/App.tsx`):
   - Case "e" in `useKeyboard` has empty handler: `break`
   - No `handleEditProvider` function implemented

### Implementation Priority:
1. Fix ConfirmDialog keyboard handling
2. Implement proper InputDialog with `<input>` component
3. Fix ListDialog escape handling
4. Implement Edit Provider flow
5. Test all flows end-to-end

## 11. OpenTUI React API Reference

### Key Hooks:
- `useRenderer()` - Access renderer instance
- `useKeyboard(handler, options?)` - Handle keyboard events
- `useOnResize(callback)` - Handle terminal resize
- `useTerminalDimensions()` - Get terminal size

### Key Components:
- `<text>` - Display text with styling
- `<box>` - Container with borders and layout
- `<input>` - Text input field (supports `placeholder`, `focused`, `onInput`, `onSubmit`)
- `<select>` - Selection dropdown (supports `options`, `focused`, `onChange`, `onSelect`)
- `<ascii-font>` - ASCII art text
- `<scrollbox>` - Scrollable container

### Example Input Usage:
```tsx
<input
  placeholder="Type here..."
  focused={true}
  onInput={setValue}
  onSubmit={(value) => console.log("Submitted:", value)}
/>
```

### Example Select Usage:
```tsx
<select
  options={options}
  focused={true}
  onChange={(index, option) => setSelectedIndex(index)}
  onSelect={(index, option) => console.log("Selected:", option)}
/>
```

### Example Keyboard Usage:
```tsx
useKeyboard((key) => {
  if (key.name === "escape") {
    onClose(null)
  }
})
```
