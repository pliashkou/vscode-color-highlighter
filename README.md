# Code Highlighter

A VSCode extension that allows you to highlight code with different colors using keyboard shortcuts. Perfect for marking important code sections, todos, or organizing your thoughts while reading code.

## Features

- **Fast keyboard-driven highlighting**: Use `Cmd+K` followed by number keys 1-9 to instantly highlight selected text
- **Smart partial clearing**: Remove only selected portions of highlights while keeping the rest intact
- **Persistent highlights**: Your highlights are saved and restored when files are reopened
- **Configurable colors**: Customize the highlight colors in your VSCode settings
- **Dynamic adjustment**: Highlights automatically adjust when you edit the code

## Usage

### Highlighting Text
1. Select the text you want to highlight
2. Press `Cmd+K` followed by a number key (1-9) to apply a color:
   - `Cmd+K 1` - Yellow highlight
   - `Cmd+K 2` - Green highlight  
   - `Cmd+K 3` - Blue highlight
   - `Cmd+K 4` - Red highlight
   - `Cmd+K 5` - Purple highlight
   - `Cmd+K 6` - Orange highlight
   - `Cmd+K 7-9` - Additional colors (if configured)

### Clearing Highlights
- `Cmd+K 0` - Clear highlight from selected text (smart partial removal)
- Command Palette: "Clear All Highlights" - Remove all highlights from current file

### Smart Partial Clearing
When you select part of a highlighted text and press `Cmd+K 0`:
- Only the selected portion gets unhighlighted
- If you select the middle, it splits the highlight into two parts
- If you select the beginning/end, it trims that portion

**Example:**
- Highlight: `function myFunction()`
- Select: `Function` (middle part)
- Press `Cmd+K 0`
- Result: `function my` and `()` remain highlighted, `Function` is cleared

## Extension Settings

This extension contributes the following settings:

* `codeHighlighter.colors`: Array of colors to use for highlighting (with alpha channel)

**Default colors:**
```json
{
  "codeHighlighter.colors": [
    "#ffeb3b40",  // Yellow
    "#4caf5040",  // Green
    "#2196f340",  // Blue
    "#ff572240",  // Red
    "#9c27b040",  // Purple
    "#ff980040"   // Orange
  ]
}
```

### Customizing Colors
Add this to your VSCode settings.json to customize colors:
```json
{
  "codeHighlighter.colors": [
    "#your-color-1",
    "#your-color-2",
    // ... up to 9 colors
  ]
}
```

Colors should be in hex format with alpha channel (e.g., `#ff000040` for semi-transparent red).

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K 1` | Highlight with color 1 |
| `Cmd+K 2` | Highlight with color 2 |
| `Cmd+K 3` | Highlight with color 3 |
| `Cmd+K 4` | Highlight with color 4 |
| `Cmd+K 5` | Highlight with color 5 |
| `Cmd+K 6` | Highlight with color 6 |
| `Cmd+K 7` | Highlight with color 7 |
| `Cmd+K 8` | Highlight with color 8 |
| `Cmd+K 9` | Highlight with color 9 |
| `Cmd+K 0` | Clear highlight at selection |

## Release Notes

### 1.0.0

Initial release with:
- Keyboard-driven highlighting (Cmd+K + number keys)
- Smart partial highlight clearing
- Persistent highlights across file close/open
- Configurable colors
- Dynamic highlight adjustment during text editing
