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

- Version: `matrix-v1` (increment when updating cache)
- Caches all static assets during installation
- Serves from cache first, falls back to network
- Cleans up old caches on activation

### Updating the Cache

When updating the application:

1. Change `CACHE_NAME` in `service-worker.js` (e.g., `matrix-v2`)
2. Update `STATIC_ASSETS` array if adding/removing files
3. The new service worker will install in parallel with the old one
4. On activation, old caches are automatically deleted

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

### Service Worker Not Registering

- Check browser console for errors
- Ensure you're serving over HTTPS (or localhost for development)
- Clear browser cache and try again

### Offline Mode Not Working

- Verify service worker is active (DevTools > Application > Service Workers)
- Check that all resources are being cached (DevTools > Application > Cache Storage)
- Look for network errors when online

### Cache Not Updating

- Change `CACHE_NAME` in `service-worker.js`
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Unregister the old service worker and refresh

## References

- [Web.dev PWA Guide](https://web.dev/learn/pwa/)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

_"Welcome to the real world, Neo."_ - The Matrix can now follow you offline.
