# Multi-Monitor Fullscreen Feature

## Overview

The Matrix Digital Rain now supports fullscreen across multiple displays using the Window Management API. This feature allows the Matrix effect to span across all connected monitors, creating an immersive multi-screen experience.

## Features

### Two Fullscreen Modes

1. **Independent Instances** (`fullscreenMultiple=true`)
   - Opens a separate Matrix instance on each display
   - Each display gets its own random seed and natural variations
   - Perfect for creating diverse, organic-looking multi-screen setups

2. **Uniform Config** (`fullscreenUniform=true`)
   - Opens Matrix on all displays with the same initial configuration
   - All displays start with identical settings (version, effect, colors, etc.)
   - Natural drift occurs over time due to random glyph mutations
   - Perfect for synchronized visual effects across multiple screens

### How to Use

#### Via UI Controls

1. Open the Matrix effect in your browser
2. Click on the "Matrix Mode" panel in the top-right corner to expand it
3. Scroll down to the "Multi-Monitor Fullscreen" section
4. Check either:
   - **Independent Instances** - for varied effects across screens
   - **Uniform Config** - for synchronized effects across screens
5. Double-click anywhere on the canvas to activate multi-monitor mode
   - The main window will attempt to enter fullscreen
   - Additional windows will open on other displays
   - **Important**: You must manually double-click each child window to enter fullscreen due to browser security restrictions

#### Via URL Parameters

Add these parameters to the URL:

```
# Independent instances mode
?fullscreenMultiple=true

# Uniform config mode
?fullscreenUniform=true

# Example with other settings
?version=resurrections&effect=rainbow&fullscreenUniform=true
```

## Technical Details

### Browser Support

This feature requires:
- A browser that supports the [Window Management API](https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API)
- Currently supported in:
  - Chrome/Edge 100+ (with experimental flag enabled)
  - Chrome/Edge 109+ (full support)

### Permission Requirements

The first time you activate multi-monitor fullscreen, the browser will request permission to:
- Access information about your connected displays
- Open windows on different screens

You must grant this permission for the feature to work.

### Architecture

The implementation consists of:

1. **MultiMonitorManager** (`js/multi-monitor.js`)
   - Manages window spawning and lifecycle
   - Handles Window Management API interactions
   - Coordinates fullscreen entry/exit across windows
   - Uses BroadcastChannel for cross-window communication

2. **Fullscreen Integration** (`js/fullscreen.js`)
   - Modified to detect when multi-monitor mode is active
   - Spawns windows across displays instead of single-screen fullscreen
   - Maintains backward compatibility with standard fullscreen

3. **Configuration System** (`js/config.js`)
   - New config parameters: `fullscreenMultiple`, `fullscreenUniform`
   - Config serialization for uniform mode
   - Child window detection via `multiMonitorChild` flag

4. **UI Controls** (`js/mode-display.js`)
   - Toggle checkboxes for each mode
   - Mutual exclusivity enforcement (only one mode active at a time)
   - Visual feedback and instructions

### How It Works

#### Independent Mode Flow

1. User checks "Independent Instances" checkbox
2. User double-clicks canvas to enter fullscreen
3. MultiMonitorManager:
   - Requests Window Management permission (if needed)
   - Enumerates all connected displays
   - Opens a new window on each display with current URL
   - Each window initializes with its own random seed
4. Main window enters fullscreen
5. Child windows log a message prompting user to double-click for fullscreen
6. User must manually double-click each child window to activate fullscreen

#### Uniform Mode Flow

1. User checks "Uniform Config" checkbox
2. User double-clicks canvas to enter fullscreen
3. MultiMonitorManager:
   - Requests Window Management permission (if needed)
   - Enumerates all connected displays
   - Serializes current config to URL parameters
   - Opens a new window on each display with serialized config
   - All windows start with identical settings
4. Main window enters fullscreen
5. Child windows log a message prompting user to double-click for fullscreen
6. User must manually double-click each child window to activate fullscreen
7. Natural drift occurs from random glyph timing

#### Exit Flow

1. User exits fullscreen on any window (ESC key, or manual exit)
2. Child window broadcasts exit event via BroadcastChannel
3. Coordinator window receives message and closes all windows
4. All displays exit fullscreen simultaneously

### Config Serialization

For uniform mode, the following config parameters are serialized to URL:

- Core: `version`, `effect`, `font`
- Visual: `numColumns`, `resolution`, `animationSpeed`, `cycleSpeed`, `fallSpeed`, `raindropLength`, `slant`
- Colors: `stripeColors`, `palette`
- Bloom: `bloomSize`, `bloomStrength`
- 3D: `volumetric`, `forwardSpeed`
- Other: `fps`, `renderer`

### BroadcastChannel Messages

The system uses `BroadcastChannel("matrix-multi-monitor")` for coordination:

```javascript
// Notify child windows (they must manually enter fullscreen via double-click)
{ type: "requestFullscreen" }

// Exit fullscreen on all windows
{ type: "exitFullscreen" }

// Child window exited fullscreen
{ type: "childExitedFullscreen", screenIndex: <number> }

// Window closed
{ type: "windowClosed", screenIndex: <number> }
```

**Note**: Due to browser security restrictions, the `requestFullscreen` message cannot actually trigger fullscreen on child windows. It only serves as a notification. Users must manually double-click each window.

## Error Handling

The system gracefully handles various error conditions:

### API Not Supported
- Checks if `window.getScreenDetails()` exists
- Shows alert: "Multi-monitor fullscreen is not supported in this browser"
- Falls back to standard single-screen fullscreen

### Permission Denied
- Catches permission denial
- Shows alert asking user to grant permission
- Falls back to standard single-screen fullscreen

### Insufficient Screens
- Detects when only one display is connected
- Shows alert: "Multi-monitor fullscreen requires at least 2 displays"
- Falls back to standard single-screen fullscreen

### Fullscreen Request Failure
- Fullscreen must be triggered by a direct user gesture (click, key press)
- Programmatic fullscreen requests fail with "Permissions check failed"
- Child windows cannot enter fullscreen automatically via message passing
- Solution: Users must double-click each child window

## Browser Security Restrictions

Modern browsers enforce strict security policies around the Fullscreen API to prevent malicious websites from hijacking the user's screen. These restrictions affect multi-monitor fullscreen:

### User Gesture Requirement

The `requestFullscreen()` method can **only** be called in direct response to a user interaction event (click, key press, touch). The browser considers these as valid user gestures:

- ✅ Mouse clicks (`click`, `dblclick`)
- ✅ Keyboard events (`keydown`, `keyup`, `keypress`)
- ✅ Touch events (`touchend`)

The browser **does not** consider these as user gestures:

- ❌ Timers (`setTimeout`, `setInterval`)
- ❌ Promises resolving asynchronously
- ❌ Message passing (`postMessage`, `BroadcastChannel`)
- ❌ Page load events (`DOMContentLoaded`, `load`)
- ❌ Network responses (`fetch`, `XMLHttpRequest`)

### Impact on Multi-Monitor Fullscreen

When the user double-clicks the main window:
1. ✅ The main window can enter fullscreen (direct user gesture)
2. ❌ Child windows cannot enter fullscreen via BroadcastChannel message (not a user gesture in that window)

This is why users must manually double-click each child window to activate fullscreen on multiple displays.

### Why This Matters

This security restriction prevents malicious scenarios like:
- Websites automatically entering fullscreen without user consent
- Phishing attacks that mimic system dialogs in fullscreen mode
- Unwanted fullscreen popups or advertisements
- Cross-window fullscreen hijacking attempts

The browser vendors (Chrome, Firefox, Safari) all enforce these restrictions to protect users.

## Backward Compatibility

- **Single-monitor systems**: Work exactly as before
- **Existing URL parameters**: All respected and functional
- **Standard fullscreen**: Double-click still works without any mode selected
- **Unsupported browsers**: Gracefully fall back to single-screen fullscreen

## Testing Checklist

### Basic Functionality
- ✅ Single monitor behavior unchanged
- ✅ UI controls display correctly
- ✅ Mutual exclusivity works (only one mode active)
- ✅ URL parameters update when toggling modes
- ✅ Config serialization works correctly

### Multi-Monitor Scenarios
- [ ] Permission request appears on first use
- [ ] Windows open on correct screens
- [ ] Fullscreen activates on all displays
- [ ] Independent mode creates varied instances
- [ ] Uniform mode starts with identical config
- [ ] Natural drift occurs in uniform mode over time
- [ ] Exit on one display closes all windows
- [ ] Manual window closure handled correctly

### Error Handling
- [ ] Unsupported browser shows appropriate message
- [ ] Permission denial handled gracefully
- [ ] Single display detection works
- [ ] Popup blocker doesn't break functionality
- [ ] Fallback to single-screen fullscreen works

### Edge Cases
- [ ] Rapid toggling between modes
- [ ] Closing coordinator window
- [ ] Network disconnection during operation
- [ ] Display disconnection during fullscreen
- [ ] Multiple rapid double-clicks

## Known Limitations

1. **Browser Support**: Limited to browsers with Window Management API support
2. **Permission Required**: Users must grant display access permission
3. **Popup Blockers**: May interfere with window spawning (users must allow popups)
4. **No Explicit Sync**: Uniform mode uses same initial config but doesn't maintain frame-perfect synchronization
5. **Wake Lock**: Each window manages its own wake lock independently
6. **Manual Fullscreen**: Due to browser security policies, each child window must be manually set to fullscreen by double-clicking it. Programmatic fullscreen requests across windows via BroadcastChannel are not allowed as they're not considered user gestures

## Future Enhancements

Possible improvements for future versions:

1. **Frame Synchronization**: Add explicit frame sync for perfectly synchronized animations
2. **Touch Gestures**: Support for mobile devices with external displays
3. **Display Arrangement**: Respect physical display layout (left, right, top, bottom)
4. **Bezel Compensation**: Account for physical bezels between displays
5. **Per-Display Settings**: Allow different configs per display
6. **Preview Mode**: Show miniature preview of what each display will show
7. **Keyboard Shortcuts**: Hotkeys for toggling multi-monitor modes

## Resources

- [Window Management API Specification](https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API)
- [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
- [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
- [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)

## Contributing

To contribute to this feature:

1. Test on different hardware configurations
2. Report issues with specific browser/OS combinations
3. Suggest UI/UX improvements
4. Propose new multi-monitor effects or modes

## License

This feature is part of the Matrix Digital Rain project and follows the same license terms.
