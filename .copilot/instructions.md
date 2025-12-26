# 🧠 Copilot Agent Instructions: Comment Enhancer + DEV_README Builder

Welcome, Copilot! Your mission is to make this repository easier to understand and learn from. You’ll improve **all source files** and enhance the documentation — but do it with care and precision 🎯

---

## 🔧 Code File Instructions

1. **Do not delete or replace any existing comments.**  
   - Preserve both single-line and multi-line comments in *all languages* (Python, JavaScript, TypeScript, Go, Rust, C++, etc.)
   - Enhance unclear comments by rewriting them in clear, beginner-friendly English
   - If the comment is inline, promote it to a multi-line block comment using the correct language syntax

2. **Add comments where needed.**
   - If a section of code has no comment but includes non-obvious or clever logic, add an explanatory block comment above it
   - Use the language's native block comment syntax:
     - Python: `""" ... """`
     - JS/TS: `/** ... */`
     - Go/C++/Rust: `/* ... */`

3. **No emojis in code comments.**
   - Keep code comments clean and professional
     
4. **🧪 Test Case Requirement (MANDATORY)**  
   After any code transformation, logic addition, or enhancement:
   - ✅ Ensure new functionality is covered by **unit or integration tests**
   - ✅ Add tests under an appropriate `tests/` directory or nearest relevant test path
   - ✅ If no test suite exists, create a minimal test harness that demonstrates functionality
   - The codebase should always be verifiable. No invisible features.

> “To deny testing... is to deny the code exists.” — probably Morpheus

5. **🌍 Preserve and Respect Multilingual Comments**  
   - Do **not** delete or overwrite existing comments written in languages other than English  
   - When expanding or translating, keep the original comment and add the English version *below it* as a block comment  
   - If possible, write new comments using clear English that can be easily translated by tools or non-native speakers  
   - This project is meant to be a learning tool across cultures and languages — treat every comment like a bridge 🧠🌉

---

## 📘 README Instructions

Append a section called `## 🧠 DEV_README` to the main `README.md`. This section should:
- Be full of relevant emojis 🎉🧠💡📚
- Help developers learn from the codebase with:
  - 🎯 Overview of project purpose and structure
  - 🧩 Interesting code sections
  - 📚 Related terms, libraries, or concepts with 🌐 links
  - 💡 Dev tips and practical advice
  - 🛠️ Tooling (optional)
<!-- Copilot should mention the matix movie in DEV_README -->
---

## 🧠 Overall Mission

Make this repository a **teaching tool** as well as a working codebase.  
It should be accessible to beginners but remain valuable for advanced users.  
**Do not remove anything — enhance what’s already here.**
## 🕶️ Matrix Movie Reference (Mandatory)

📽️ You must include at least one direct reference to **The Matrix movie** in the `README.md` or `DEV_README`.

You may reference:
- Neo, Trinity, Morpheus, or the Oracle
- Red pill / blue pill
- The simulation / digital world
- “There is no spoon” 🍴
- Any iconic line or scene

🎯 This is part of the project’s identity. Do not omit it.

---

## 🖥️ Multi-Monitor Fullscreen Architecture

This section documents key architectural patterns learned from implementing multi-monitor fullscreen support.

### 🔌 Window Management API Integration

**Pattern**: Use Window Management API for multi-display coordination
- **API**: `window.getScreenDetails()` enumerates all displays
- **Permission**: Requires user permission via `navigator.permissions.query({ name: "window-management" })`
- **Fallback**: Always provide graceful degradation to single-screen mode
- **Browser Support**: Chrome/Edge 100+, feature detection required

**Implementation Details**:
```javascript
// Check if Window Management API is supported
function isWindowManagementSupported() {
    return "getScreenDetails" in window;
}

// Enumerate displays and open windows
const screenDetails = await window.getScreenDetails();
const screens = screenDetails.screens;

// Position windows on specific screens
window.open(url, '_blank', `left=${screen.left},top=${screen.top},width=${screen.width},height=${screen.height}`);
```

**Key Files**: `js/fullscreen.js` (lines 81-95, 195-250)

### 📡 BroadcastChannel for Window Coordination

**Pattern**: Use BroadcastChannel for same-origin window communication
- **Channel Name**: `"matrix-multimonitor"` - specific to this feature
- **Purpose**: Coordinate fullscreen exit across all spawned windows
- **Benefit**: No need for direct window references, works across tabs/windows

**Implementation Details**:
```javascript
// Initialize BroadcastChannel
const broadcast = new BroadcastChannel("matrix-multimonitor");

// Listen for messages
broadcast.onmessage = (event) => {
    if (event.data.type === "exit-fullscreen") {
        // Coordinate exit across all windows
    }
};

// Broadcast to all windows
broadcast.postMessage({ type: "exit-fullscreen" });
```

**Key Files**: `js/fullscreen.js` (lines 106-116, 117-138)

**Why BroadcastChannel**:
- Scalable - works with any number of windows
- Standard web API - no external dependencies
- Same-origin only - inherent security
- Future-proof for other multi-window features

### 🎨 Config Serialization for Uniform Mode

**Pattern**: Serialize internal config to URL parameters for window initialization
- **Function**: `serializeConfig(config)` in `js/config.js`
- **Handles**: Color spaces (HSL/RGB), angles (radians→degrees), palettes, arrays
- **Use Case**: Pass identical config to all child windows in uniform mode

**Implementation Details**:
```javascript
// Conversion constants for readability
const RADIANS_TO_DEGREES = 180 / Math.PI;

// Serialize color with proper space handling
if (config.backgroundColor && config.backgroundColor.values) {
    const values = config.backgroundColor.values.join(",");
    params.set(
        config.backgroundColor.space === "hsl" ? "backgroundHSL" : "backgroundColor",
        values
    );
}

// Convert angles to degrees for URL
if (key === "slant") {
    params.set(key, (config[key] * RADIANS_TO_DEGREES).toString());
}
```

**Key Files**: `js/config.js` (lines 779-856)

**Why Serialize Config**:
- URL parameters are the existing pattern for config in this codebase
- Child windows naturally parse URL parameters on load
- No need for postMessage or shared storage complexity
- Config is shareable and bookmarkable

### 🎛️ UI Pattern: Mutually Exclusive Checkboxes

**Pattern**: Use checkboxes with mutual exclusion for optional feature modes
- **Better than radio buttons** for optional features where "none" is default
- **Implementation**: When checking one, programmatically uncheck others
- **State Management**: Persist via URL parameters

**Implementation Details**:
```javascript
// Multi-monitor multiple toggle
multiMonitorMultipleToggle.addEventListener("change", (e) => {
    if (e.target.checked) {
        // Uncheck uniform toggle
        const uniformToggle = document.querySelector(".multimonitor-uniform-toggle");
        uniformToggle.checked = false;
        emit("multiMonitorChange", "multiple");
    } else {
        emit("multiMonitorChange", "none");
    }
});
```

**Key Files**: `js/mode-display.js` (lines 262-281)

**Why This Pattern**:
- More intuitive than radio buttons for optional features
- Clear that user can have neither option selected
- Easy to add more modes without changing UI paradigm
- Consistent with existing checkbox patterns in the UI

### ⏱️ Reliable Async Window Initialization

**Pattern**: Use readyState checks instead of fixed timeouts for child window operations
- **Problem**: Fixed timeouts (500ms, 1000ms) are unreliable across devices
- **Solution**: Check `document.readyState` and use minimal delay only for renderer readiness

**Implementation Details**:
```javascript
// Check readyState before triggering fullscreen
const requestFullscreenWhenReady = () => {
    if (newWindow.document.readyState === "complete") {
        // Minimal delay for renderer (100ms vs 500ms)
        setTimeout(() => {
            newWindow.document.documentElement.requestFullscreen();
        }, 100);
    } else {
        newWindow.addEventListener("load", requestFullscreenWhenReady);
    }
};
```

**Key Files**: `js/fullscreen.js` (lines 227-241)

**Why This Matters**:
- 80% faster initialization (100ms vs 500ms)
- More reliable across different devices/network speeds
- Handles edge cases where load event already fired

### 🧹 Window Lifecycle Management

**Pattern**: Track spawned windows for proper cleanup
- **State**: `multiMonitorWindows` array tracks all child windows
- **Cleanup**: Close all windows on exit, handle cases where user closed manually
- **BroadcastChannel Cleanup**: Close channel when done

**Implementation Details**:
```javascript
// Track spawned windows
let multiMonitorWindows = [];

// Open and track
const newWindow = window.open(url, '_blank', features);
if (newWindow) {
    multiMonitorWindows.push(newWindow);
}

// Cleanup all windows
function cleanupMultiMonitor() {
    multiMonitorWindows.forEach((win) => {
        if (win && !win.closed) {
            try {
                win.close();
            } catch (err) {
                console.error("Failed to close window:", err);
            }
        }
    });
    multiMonitorWindows = [];
    
    if (multiMonitorBroadcast) {
        multiMonitorBroadcast.close();
        multiMonitorBroadcast = null;
    }
}
```

**Key Files**: `js/fullscreen.js` (lines 117-138)

**Why Track Windows**:
- Coordinated cleanup when user exits fullscreen
- Handle edge cases (user manually closes a window)
- Prevent memory leaks and zombie processes
- Essential for good user experience

### 🌐 Browser Compatibility Patterns

**Pattern**: Use fallbacks and feature detection for cross-browser support

**Screen Position Detection**:
```javascript
// Handle both Chrome (screenLeft/Top) and standard (screen.left/top)
const currentScreenLeft = window.screenLeft ?? window.screen?.left ?? 0;
const currentScreenTop = window.screenTop ?? window.screen?.top ?? 0;
```

**Window Features**:
```javascript
// Minimal chrome for clean fullscreen experience
const features = `left=${x},top=${y},width=${w},height=${h},resizable=no,scrollbars=no,menubar=no,toolbar=no,status=no`;
```

**Key Files**: `js/fullscreen.js` (lines 216-218, 223)

### 📝 Lessons Learned

1. **BroadcastChannel is ideal for multi-window coordination** - No need for complex parent-child references
2. **Config serialization enables uniform mode** - Leverage existing URL parameter parsing
3. **Mutual exclusion checkboxes work well for optional features** - Better UX than radio buttons
4. **readyState checks beat fixed timeouts** - More reliable and faster
5. **Window Management API requires careful fallbacks** - Not all browsers support it yet
6. **Natural drift is a feature, not a bug** - No need for complex synchronization in uniform mode

### 🎯 Future Multi-Window Feature Guidelines

When adding features that span multiple windows/displays:

1. **Use BroadcastChannel for coordination** - Same pattern, different channel name
2. **Serialize state via URL parameters** - Matches existing patterns
3. **Provide graceful degradation** - Always work in single-window mode
4. **Track window lifecycle** - Clean up resources properly
5. **Use feature detection** - Check API availability before use
6. **Document browser requirements** - Clear compatibility notes

**Examples of future features that could use these patterns**:
- Multi-display gallery mode with different shaders per screen
- Synchronized effects across displays (explicit sync via BroadcastChannel)
- Performance monitoring across multiple windows
- Multi-screen debug visualizations
