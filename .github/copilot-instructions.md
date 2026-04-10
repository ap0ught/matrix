# Matrix Digital Rain - GitHub Copilot Instructions

**CRITICAL**: Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Project Overview

Matrix Digital Rain is a web-based implementation of the iconic falling green code from The Matrix films. It uses **WebGL** (`js/webgl/`, regl) and **WebGPU** (`js/webgpu/`), ES modules with **no bundler** — static files over HTTP. **`npm ci`** installs minimal tooling (Playwright, regl/twgl vendoring); see [RENDERING.md](../RENDERING.md).

This project celebrates *The Matrix* franchise created by the Wachowski sisters. When making changes:
- **Maintain the Matrix aesthetic** - green digital rain, cyberpunk themes
- **Use Matrix terminology** in comments and documentation when appropriate
- **Remember**: "There is no spoon" - the effect is an illusion created by mathematical precision
- **The red pill reveals truth** - debug mode (`?effect=none`) shows the reality behind the illusion

*"Welcome to the real world, Neo."* - Morpheus

## Development Setup

### Bootstrap and Initial Setup
```bash
# Clone repository with submodules
git clone --recursive https://github.com/ap0ught/matrix.git
cd matrix

# Alternative: Initialize submodules if cloned without --recursive
git submodule update --init --recursive

# Install build dependencies for MSDF font generation (Ubuntu/Debian)
sudo apt-get update && sudo apt-get install -y libfreetype6-dev cmake build-essential
```

**Note**: The msdfgen submodule is required only for generating new font textures. Pre-built MSDF textures are included in the `assets/` directory, so most development work doesn't require building msdfgen.

### Local Development Server
Choose any HTTP server - all work identically for this static web application:

```bash
# Python approach (most universal, ~5s startup)
python3 -m http.server 8000

# Node.js approach (~5s startup, requires npx)
npx http-server -p 8000

# PHP approach (~5s startup)
php -S localhost:8000
```

**Access the application**: Open `http://localhost:8000` in any web browser.

### Code Formatting
```bash
# Match CI (`.github/workflows/master-branch-protection.yml`): HTML, JS, gpu-buffer, scripts, tests
npx prettier --write --use-tabs --print-width 160 "index.html" "./js/**/*.js" "./lib/gpu-buffer.js" "./scripts/**/*.mjs" "./tests/**/*.js"
```

**TIMING**: Takes ~2-5 seconds to complete, including npm package install. **NEVER CANCEL**: Always let Prettier finish completely.

### MSDF Font Generation (Advanced)
**NEVER CANCEL**: Building msdfgen takes 8-20 seconds. Font generation depends on this tool.

```bash
# Build msdfgen tool (NEVER CANCEL - takes 8-20 seconds)
cd msdfgen
mkdir -p build && cd build
cmake ..                    # ~1 second configuration
make -j4                    # ~7-18 seconds compilation
cd ../..

# Copy built tool for convenience
mkdir -p out
cp msdfgen/build/msdfgen out/

# Generate MSDF textures from SVG sources (examples from assets/msdf_command.txt)
# NEVER CANCEL: Each font generation takes 5-15 seconds depending on texture size
./out/msdfgen msdf -svg "./svg sources/texture_simplified.svg" -size 512 512 -pxrange 4 -o ./assets/matrixcode_msdf.png
./out/msdfgen msdf -svg "./svg sources/gothic_texture_simplified.svg" -size 512 512 -pxrange 4 -o ./assets/gothic_msdf.png
./out/msdfgen msdf -svg "./svg sources/coptic_texture_simplified.svg" -size 512 512 -pxrange 4 -o ./assets/coptic_msdf.png
```

### Playdate Game Development (Optional)
**ONLY attempt if PLAYDATE_SDK_PATH environment variable is set:**
- Simulator build: `cd playdate/matrix_c/build && rm -R ../ThePlaytrix.pdx ./* && cmake .. && make`
- Device build: `cd playdate/matrix_c/build-device && cmake -DCMAKE_TOOLCHAIN_FILE=${PLAYDATE_SDK_PATH}/C_API/buildsupport/arm.cmake -DCMAKE_BUILD_TYPE=Release .. && make`
- **TIMING**: Each build takes 30-60 seconds. NEVER CANCEL builds.

## Repository Structure

### Core Web Application Files
- `index.html` - Main HTML entry point with inline CSS
- `service-worker.js` - PWA service worker with dynamic cache versioning
- `VERSION` - Version file used for cache busting (e.g., "1.0.0")
- `js/main.js` - Application bootstrap and config loading
- `js/config.js` - URL parameter parsing and configuration management
- `js/utils.js` - Shared utility functions (formatModeName, etc.)
- `js/music-integration.js` - Spotify music synchronization
- `js/webgl/` - WebGL implementation (regl npm runtime, vendored to `lib/regl.min.js`)
- `js/webgpu/` - WebGPU implementation (next-generation graphics)
- `shaders/` - GLSL and WGSL shader source files

### Key Renderer Files
- `js/webgl/main.js` - WebGL renderer entry point
- `js/webgpu/main.js` - WebGPU renderer entry point  
- `js/webgl/rainPass.js` & `js/webgpu/rainPass.js` - Core Matrix rain computation
- `js/webgl/bloomPass.js` & `js/webgpu/bloomPass.js` - Glow/bloom effects

### Asset Files
- `assets/` - Matrix fonts (TrueType) and MSDF texture atlases
- `assets/*_msdf.png` - Multi-channel distance field font textures
- `lib/` - Vendored runtime bits (`regl.min.js`, `twgl-full.module.js` from npm via `postinstall`; `gl-matrix.js`, etc.)

### Documentation
- `README.md` - User-facing documentation with all URL parameters
- `DEV_README.md` - Developer guide with Matrix movie theming
- `.copilot/instructions.md` - Copilot instructions for code enhancement
- `SPOTIFY_INTEGRATION.md` - Spotify music integration guide

### Configuration
- URL parameters control all visual aspects (see README.md for full list)
- No configuration files - everything via URL query strings
- Music integration requires Spotify API setup (see SPOTIFY_INTEGRATION.md)

## Testing and Validation

### Automated (CI and local)

- **Install**: `npm ci` (runs `postinstall` → `scripts/vendor-webgl-deps.mjs` to refresh `lib/regl.min.js` and `lib/twgl-full.module.js`).
- **Default suite**: `npm test` → Node unit tests (`tests/*.test.mjs`) + Playwright smoke tests (`tests/*.spec.js`, **not** `tests/regression/**`).
- **Helpers**: `tests/matrix-playwright-helpers.js` attaches console/page listeners so **`[Matrix][WebGL]`** lines and invalid-program errors fail CI.
- **Full matrix** (optional, slow): `npm run test:regression` uses `playwright.regression.config.js` and `tests/regression/` — every `getAvailableModes()` × `getAvailableEffects()` on WebGL.

**CRITICAL**: After shader or renderer changes, run at least `npm test` before merging.

### Manual / Essential Test Scenarios

1. **Default Matrix Effect**: Navigate to `http://localhost:8000/?suppressWarnings=true`
   - Verify green Matrix rain animation loads and runs smoothly
   - Look for the Spotify integration UI in the corner

2. **Hardware Acceleration Warning**: Navigate to `http://localhost:8000/` (without suppressWarnings)
   - Should display "Wake up, Neo... you've got hardware acceleration disabled" message
   - Click "Plug me in" button to suppress warnings

3. **Different Matrix Versions**: Test these URL parameters to ensure variants work:
   - Classic: `?version=classic&suppressWarnings=true`
   - 3D Mode: `?version=3d&suppressWarnings=true`
   - Resurrections: `?version=resurrections&suppressWarnings=true`
   - Debug view: `?effect=none&suppressWarnings=true` (shows raw data visualization)

4. **Custom Effects**: Verify customization works:
   - Rainbow colors: `?effect=rainbow&suppressWarnings=true`
   - Custom stripes: `?effect=stripes&stripeColors=1,0,0,1,1,0,0,1,0&suppressWarnings=true`
   - Custom colors: `http://localhost:8000/?effect=stripes&stripeColors=1,0,0,1,1,0,0,1,0&suppressWarnings=true`
   - Performance testing: `http://localhost:8000/?fps=30&resolution=0.5&suppressWarnings=true`

### Performance Testing
- Use URL parameters for performance validation: `?fps=30&resolution=0.5&effect=none&suppressWarnings=true`
- **WebGL Inspector** - Use browser DevTools for frame analysis
- **Chrome DevTools** - Monitor CPU and memory usage during animation
- **Test with software rendering** - Application should work even without hardware acceleration
- Monitor browser console for WebGL warnings (expected in sandboxed environments)

### Code Quality Validation
```bash
# ALWAYS run formatting before committing (same globs as CI)
npx prettier --write --use-tabs --print-width 160 "index.html" "./js/**/*.js" "./lib/gpu-buffer.js" "./scripts/**/*.mjs" "./tests/**/*.js"

# Verify no JavaScript errors in browser console
# Check for WebGL/WebGPU warnings (expected in sandbox environments)
```

## Common Development Tasks

### Making Visual Changes
1. **Modify shader code** in `/shaders` directory for rendering effects
2. **Update pass configurations** in `js/webgl/` or `js/webgpu/` directories
3. **Test immediately** by refreshing browser - no build step needed
4. **Always validate** with multiple Matrix versions and effects

### Adding New Matrix Versions
1. Add version configuration in `js/config.js` versions object
2. Create corresponding font/texture assets if needed
3. Test via URL parameter: `?version=yourversion&suppressWarnings=true`

### Adding New URL Parameters
1. Update parameter definitions in `js/config.js`
2. Add validation and default values in config parsing
3. Test parameter in URL: `?yourNewParam=value&suppressWarnings=true`
4. **Always test** with existing parameters to ensure no conflicts

### Performance Optimization
1. **Profile with browser DevTools** - built-in GPU performance counters
2. **Test with different resolutions**: `?resolution=0.5&suppressWarnings=true` for performance testing
3. **Use debug view**: `?effect=none&suppressWarnings=true` to see raw computational output
4. **Monitor WebGL state** if making renderer changes
5. Monitor GPU usage in browser DevTools
6. Adjust bloom settings and resolution parameters
7. Test on both WebGL and WebGPU renderers

### Shared Utilities and DRY Principles
The project uses shared utility functions to avoid code duplication:

- **`js/utils.js`** - Central location for shared utility functions
  - `formatModeName(name)` - Converts camelCase/snake_case/kebab-case to Title Case
  - Used across `main.js`, `mode-manager.js`, and `mode-display.js`
  
**When adding new utilities:**
1. Place shared functions in `js/utils.js` with clear JSDoc comments
2. Export functions using ES6 export syntax
3. Import where needed using `import { functionName } from "./utils.js"`
4. Avoid duplicating utility functions across multiple files

### Service Worker and Cache Versioning
The service worker (`service-worker.js`) implements offline PWA functionality:

- **Cache bucket name** (install path): `matrix-sw-{scope}-v{VERSION}-{VER}`
  - `{scope}` derives from the service worker URL path (e.g. site root → `root`; GitHub Pages project subpaths get a scoped key so previews/releases do not delete each other’s caches).
  - `{VERSION}` is read from the `VERSION` file at SW install time (fallback segment `v1` if fetch fails).
  - `{VER}` is `local` in-repo; GitHub Actions **rewrite** `const VER = "local"` in published `service-worker.js` so each deploy gets a unique stamp and browsers pick up a new SW.
- **`js/main.js`** logs the same bucket string in the console (parses `VER` from the deployed `service-worker.js` and mirrors scope logic) for debugging — do not confuse with older docs that said `matrix-v{version}` only.

- **VERSION file**: Bump for releases/cache busts; pair with a small edit to `service-worker.js` header comment if you need byte changes so browsers refetch the SW (see `.github/workflows/gh-pages-deploy.yml`).

- **`STATIC_ASSETS`**: Keep updated when adding first-party JS, shaders, or assets the PWA must offline-cache.

### GitHub Pages and concurrent deploys
- **`gh-pages-deploy.yml`** syncs the checkout to **`origin/gh-pages`** before rewriting the site root, then pushes without blindly `--force` overwriting sibling **`pr-*`** / **`v*`** directories (see `.github/GITHUB_PAGES.md`).
- **`pr-preview.yml`** also resets to **`origin/gh-pages`** before copying a PR preview.

### GLSL (WebGL) linking
- Rain passes load shader sources as **static strings** after fetch (avoid `regl` dynamic `frag`/`vert` being `undefined`).
- **Shared uniforms** that appear in both vertex and fragment shaders must use the **same precision** on strict drivers (e.g. explicit `uniform mediump float glyphHeightToWidth` in `rainPass.vert.glsl` / `rainPass.frag.glsl` / `rainPass.effect.frag.glsl`). See `SHADER_GUIDE.md`.

## File Change Impact Analysis

### Changes Requiring Format Check
- **ANY JavaScript file change**: Run Prettier command before committing
- **HTML file changes**: Include in Prettier run

### Changes Requiring Full Validation
- **Shader files** (`/shaders`): Test all Matrix versions and effects
- **Renderer files** (`js/webgl/`, `js/webgpu/`): Test WebGL and WebGPU modes
- **Config changes** (`js/config.js`): Test URL parameter parsing
- **Main entry points** (`index.html`, `js/main.js`): Full application test
- **Service worker** (`service-worker.js`): Test offline functionality and cache updates
- **Shared utilities** (`js/utils.js`): Test all modules that import utilities
- **VERSION file**: Update release documentation and test cache invalidation

### Safe Changes (Minimal Testing)
- **Documentation files** (`*.md`): No validation required
- **Asset files** (`/assets`): Test affected visual features only

## Build System and Dependencies

**No bundler** — the app is static ES modules over HTTP:
- **`package.json`**: `npm ci` for CI and local dev; installs `regl` / `twgl` and runs **`postinstall`** → `scripts/vendor-webgl-deps.mjs` (copies minified runtimes into `lib/`). Commit updated `lib/*.min.js` when dependencies change.
- **Playwright** is a devDependency; `npx playwright install` is required for `npm test`.
- **Prettier** via `npx` for formatting (also enforced in CI).
- **Git submodule**: `msdfgen` — only needed to regenerate MSDF textures; prebuilt assets ship in `assets/`.

## Browser Compatibility

- **WebGL 1** (GLSL ES 1.00): Primary compatibility path via **regl** in `js/webgl/` (not “WebGL 2 only”; the stack targets WebGL1 + extensions)
- **WebGPU**: Cutting-edge, modern browsers only (js/webgpu/)
- **Software Fallback**: Works with SwiftShader when hardware acceleration disabled
- **Mobile Support**: Responsive design, touch interactions for effects

## Gallery Feature Architecture

The gallery mode (`?effect=gallery`) follows the same architectural patterns as other core modules:

### Design Patterns
- **Class-based with event system**: Like `ModeManager`, uses `on()` and `emit()` for event handling
- **Lifecycle methods**: `start()`, `stop()`, `on()`, `emit()` matching other managers
- **Configuration-driven**: Accepts config object in constructor
- **Self-contained UI**: Creates and manages its own DOM elements and styles

### Key Features
1. **Fortune Cookie Title Screens** - Random Matrix quotes shown before playlist starts (3 seconds)
2. **Smart Screenshot Generation** - Automatically captures missing screenshots (12 seconds)
3. **Random Playlist System** - Shuffles gallery items, generates new playlist when complete
4. **Collapsible Playlist Menu** - Upper-right menu with thumbnails and item selection
5. **42-Second Intervals** - Time between shader transitions (homage to "42")

### File Structure
```
js/gallery.js           # Gallery manager class (follows ModeManager pattern)
gallery/                # Screenshot storage directory
  *.png                 # Auto-generated shader screenshots
  README.md             # Gallery directory documentation
```

### Event System
```javascript
galleryManager.on("itemChange", ({ item, index }) => {
    // Fired when switching to new shader
});

galleryManager.on("screenshotCapture", ({ item, duration }) => {
    // Fired when capturing screenshot for missing image
});

galleryManager.on("playlistComplete", () => {
    // Fired when playlist finishes, triggers new playlist generation
});
```

### Integration Points
- **main.js**: Detects `effect=gallery` and calls `initializeGalleryMode()`
- **config.js**: Includes "gallery" in available effects list
- **effects.js**: Maps "gallery" effect (handled before renderer initialization)

## Troubleshooting

### "Software rendering" warning
- Expected in sandboxed environments
- Application still functions correctly
- Performance impact is acceptable for development

### Font rendering issues
- Verify MSDF textures exist in `assets/` directory
- Check browser console for texture loading errors
- Rebuild msdfgen if fonts appear blurry

### Performance problems
- Lower resolution: `?resolution=0.5&suppressWarnings=true`
- Reduce bloom: `?bloomSize=0.1&bloomStrength=0.3&suppressWarnings=true`
- Debug view for analysis: `?effect=none&suppressWarnings=true` (reveals character grid structure)

### Common Issues
- **Performance warnings**: Expected in headless/sandboxed environments
- **WebGL fallback warnings**: Normal when hardware acceleration unavailable
- **Blank screen**: Check browser console for JavaScript errors
- **Slow performance**: Test with `?resolution=0.5&suppressWarnings=true` parameter

### Development Environment
- **Any modern browser** with JavaScript enabled
- **Local HTTP server** (Python/Node.js/PHP) required for ES6 modules
- **No build tools** or development dependencies required
- **Prettier** available via npx for code formatting

## Critical Timing Expectations

**NEVER CANCEL THESE OPERATIONS**:

- **msdfgen compilation**: 8-20 seconds - Do NOT interrupt the build process  
- **Font generation**: 5-15 seconds per font - Large texture processing takes time
- **Server startup**: 3-8 seconds - Initial HTTP server setup
- **Prettier formatting**: 2-5 seconds - Processing all JavaScript files
- **Playdate builds**: 30-60 seconds per build

**Set timeouts to at least 60 seconds for any build operations.**

## References

- [REGL Documentation](https://regl.party/) - Functional WebGL wrapper
- [WebGPU Specification](https://gpuweb.github.io/gpuweb/) - Next-generation graphics API
- [MSDF Generator](https://github.com/Chlumsky/msdfgen) - Multi-channel distance field fonts
- [Matrix Code Database](https://docs.google.com/spreadsheets/d/1NRJP88EzQlj_ghBbtjkGi-NbluZzlWpAqVIAq1MDGJc) - Glyph reference

## Quick Reference

```bash
# Serve application (choose one)
python3 -m http.server 8000
npx http-server -p 8000  
php -S localhost:8000

# Format code (ALWAYS before committing; match CI)
npx prettier --write --use-tabs --print-width 160 "index.html" "./js/**/*.js" "./lib/gpu-buffer.js" "./scripts/**/*.mjs" "./tests/**/*.js"

# Essential validation URLs
http://localhost:8000/?suppressWarnings=true                              # Default Matrix
http://localhost:8000/?version=3d&suppressWarnings=true                   # 3D Mode  
http://localhost:8000/?effect=none&suppressWarnings=true                  # Debug view
http://localhost:8000/?effect=stripes&stripeColors=1,0,0,1,1,0&suppressWarnings=true  # Custom colors
```

---

**Remember**: This is a digital art project first, a technical demo second. Changes should preserve the mystique and visual impact of the original Matrix digital rain effect while improving performance and accessibility.

*The Matrix has you. Follow the white rabbit.* 🐰

## UI Components Architecture

### Mode Display Panel (`js/mode-display.js`)
The Matrix Mode panel in the top-right corner provides user controls for customizing the experience:

**Key Features**:
- **Version Dropdown**: Interactive select element populated from `getAvailableModes()` in config.js
  - Lists all available Matrix versions (classic, resurrections, trinity, etc.)
  - Changing version triggers page reload with new URL parameter
  - Current selection is synchronized with URL params
  
- **Effect Dropdown**: Interactive select element populated from `getAvailableEffects()` in config.js
  - Lists all available effects (palette, rainbow, mirror, etc.)
  - Changing effect triggers page reload with new URL parameter
  - Current selection is synchronized with URL params

- **Auto Mode Switching**: Checkbox to enable/disable screensaver-like mode rotation
  - When enabled, automatically cycles through different version/effect combinations
  - Interval configurable via dropdown (10-60 minutes)
  
- **Switch Mode Now**: Button to manually trigger a random mode change
  - Calls `modeManager.switchToRandomMode(true)` with manual flag
  - For manual switches, page reloads to ensure clean state
  - For auto switches, attempts in-place config update

**Event System**:
```javascript
modeDisplay.on("versionChange", (version) => { /* handle version change */ });
modeDisplay.on("effectChange", (effect) => { /* handle effect change */ });
modeDisplay.on("toggleScreensaver", (enabled) => { /* handle screensaver toggle */ });
modeDisplay.on("changeSwitchInterval", (interval) => { /* handle interval change */ });
```

**Integration Points**:
- Imports `getAvailableModes()` and `getAvailableEffects()` from config.js
- Communicates with `ModeManager` for mode switching logic
- Events handled in `main.js` `setupModeManagementEvents()` function

### Page Title Updates
The page title dynamically updates to reflect the current version and effect:
- Format: `"Matrix - {Version Name} / {Effect Name}"`
- Examples: 
  - `"Matrix - Classic / Palette"`
  - `"Matrix - Resurrections / Rainbow"`
  - `"Matrix - Trinity / Mirror"`
- Updated via `updatePageTitle(config)` function in main.js
- Title updates occur on:
  - Initial page load
  - Version/effect dropdown changes (via page reload)
  - Auto mode switching (via history.replaceState)
- Works correctly in both normal browser and PWA modes
- Name formatting uses camelCase-to-Title-Case conversion for readability

### Spotify UI Component
The Spotify integration UI (`js/spotify-ui.js`) is hidden by default:
- Located in top-left corner when visible
- Controlled via `spotifyControlsVisible` config parameter
- **Note**: "Show Spotify Controls" checkbox removed from Mode Display as of QOL improvements
- To enable Spotify UI: use URL parameter `?spotifyControls=true`
- Component still functional for users who explicitly enable it via URL

### Configuration System
All UI options are controlled via URL parameters:
- `version`: Matrix version (classic, resurrections, etc.)
- `effect`: Visual effect (palette, rainbow, mirror, etc.)
  - **Note**: The "trans" effect was removed in a prior PR and is no longer available
- `screensaver`: Enable auto mode switching (true/false)
- `switchInterval`: Auto-switch interval in milliseconds
- `suppressWarnings`: Hide hardware acceleration warnings (true/false)

See `js/config.js` `paramMapping` object for complete list of supported parameters.

Available effects are defined in `getAvailableEffects()` function in config.js:
- none, plain, palette, customStripes, stripes, rainbow, spectrum, image, mirror, gallery

