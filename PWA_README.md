# Matrix Digital Rain - Progressive Web App (PWA)

The Matrix Digital Rain is now a fully functional Progressive Web App, enabling offline access and installation on devices.

## Features

### 🔌 Offline Support

The application can be used completely offline after the first visit. All assets including:

- JavaScript modules (WebGL and WebGPU renderers)
- GLSL and WGSL shaders
- MSDF font textures
- TrueType fonts
- Texture assets

...are cached by the service worker and served from cache when offline.

### 📱 Installable

The app can be installed on:

- Desktop (Chrome, Edge, Safari)
- Mobile devices (iOS, Android)
- As a standalone app with its own window/icon

### ⚡ Cache-First Strategy

The service worker uses a cache-first approach:

1. Check cache for requested resource
2. If found in cache, serve immediately
3. If not in cache, fetch from network and cache for future use
4. Handles offline gracefully by serving cached content

## Installation

### Desktop (Chrome/Edge)

1. Visit the Matrix Digital Rain website
2. Look for the install icon (⊕) in the address bar
3. Click "Install" to add to your applications
4. Launch from your app menu or desktop

### iOS (Safari)

1. Visit the Matrix Digital Rain website
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to install

### Android (Chrome)

1. Visit the Matrix Digital Rain website
2. Tap the menu (⋮) and select "Add to Home screen"
3. Or use the "Install app" prompt that appears
4. Launch from your home screen

## Technical Details

### Manifest (`manifest.webmanifest`)

Defines the app's metadata:

- Name: "Matrix Digital Rain"
- Display mode: fullscreen (immersive experience)
- Theme color: #000000 (black, for that authentic Matrix feel)
- Icons: 192x192 and 512x512 PNG files

### Service Worker (`service-worker.js`)

Implements the caching strategy:

- **Dynamic Version Management**: Cache name is automatically generated from `VERSION` file (e.g., `matrix-v1.0.0`)
- Caches all static assets during installation
- Serves from cache first, falls back to network
- Cleans up old caches on activation
- Provides detailed console logging for debugging

### Version Output

The application outputs version information to the browser console on startup:

```
⎡ MATRIX DIGITAL RAIN ⎦
Version: 1.0.0
Cache: matrix-v1.0.0
"Wake up, Neo... The Matrix has you."

PWA Cache Debug Commands:
  caches.open("matrix-v1.0.0").then(c => c.keys()).then(k => console.log(k.map(r => r.url)))
  caches.keys().then(names => names.forEach(name => caches.delete(name)))
```

This information helps with:
- **Debugging cache issues** - Know which version is running
- **Verifying updates** - Confirm new versions are deployed
- **Cache management** - Easy access to debug commands

### Updating the Cache

When updating the application:

1. Update version number in `VERSION` file (e.g., `1.0.0` → `1.0.1`)
2. Update `STATIC_ASSETS` array in `service-worker.js` if adding/removing files
3. The service worker automatically reads `VERSION` file during installation
4. Cache name is generated as `matrix-v{version}` (e.g., `matrix-v1.0.1`)
5. On activation, old caches are automatically deleted

**Note**: You no longer need to manually update `CACHE_NAME` in the service worker - it's dynamically generated from the `VERSION` file!

## Using as a Screensaver

The offline capability makes this perfect for use as a screensaver:

1. Install the PWA on your device
2. Set it to launch on screensaver activation
3. Works even without internet connection
4. No worries about connectivity issues

## Development

### Testing Offline Functionality

```bash
# Start the development server
python3 -m http.server 8000

# Visit http://localhost:8000 in your browser
# Open DevTools > Application > Service Workers
# Click "Offline" to simulate offline mode
# Refresh the page - it should still work!
```

### Viewing Cache Contents

```javascript
// In browser console:
caches.open("matrix-v1").then((cache) => {
	cache.keys().then((keys) => {
		console.log(
			"Cached URLs:",
			keys.map((r) => r.url),
		);
	});
});
```

### Clearing Cache

```javascript
// In browser console:
caches.keys().then((names) => {
	names.forEach((name) => caches.delete(name));
});
```

## Browser Compatibility

| Feature        | Chrome | Firefox | Safari | Edge |
| -------------- | ------ | ------- | ------ | ---- |
| Service Worker | ✅     | ✅      | ✅     | ✅   |
| Install Prompt | ✅     | ⚠️      | ❌     | ✅   |
| Offline Mode   | ✅     | ✅      | ✅     | ✅   |
| Manifest       | ✅     | ✅      | ✅     | ✅   |

⚠️ Firefox supports PWAs but installation works differently
❌ Safari on iOS supports "Add to Home Screen" but not install prompts

## Troubleshooting

### Checking Version and Cache

The application outputs detailed version information to the browser console on startup. Press **F12** to open DevTools and look for:

```
⎡ MATRIX DIGITAL RAIN ⎦
Version: 1.0.0
Cache: matrix-v1.0.0
```

This tells you:
- **What version is running** - Compare with the `VERSION` file to confirm updates
- **Which cache is active** - Look for this cache name in DevTools > Application > Cache Storage
- **Debug commands** - Copy-paste commands to inspect or clear cache

### Service Worker Not Registering

- Check browser console for errors
- Ensure you're serving over HTTPS (or localhost for development)
- Look for "[Matrix Service Worker]" messages in console
- Verify `service-worker.js` file is accessible

### Offline Mode Not Working

- **Check version output** - Verify service worker registered successfully
- **Inspect cache storage** - DevTools > Application > Cache Storage should show `matrix-v{version}`
- **Verify service worker is active** - DevTools > Application > Service Workers should show "activated and is running"
- **Check console logs** - Look for service worker installation/activation messages
- **Test with network disabled** - DevTools > Network > Offline checkbox

### Cache Not Updating

1. **Check version number** - Look at console output to see current version
2. **Update VERSION file** - Change version number (e.g., `1.0.0` → `1.0.1`)
3. **Hard refresh** - Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
4. **Verify new version** - Check console output shows new version
5. **Check old cache cleanup** - Console should show "Deleting old cache: matrix-v{old-version}"

### Manual Cache Clearing

If automatic cache cleanup fails, use the debug commands from console output:

```javascript
// List all caches
caches.keys().then(names => console.log(names));

// Delete all caches (nuclear option)
caches.keys().then(names => names.forEach(name => caches.delete(name)));

// Then hard refresh the page
location.reload(true);
```

## References

- [Web.dev PWA Guide](https://web.dev/learn/pwa/)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

_"Welcome to the real world, Neo."_ - The Matrix can now follow you offline.
