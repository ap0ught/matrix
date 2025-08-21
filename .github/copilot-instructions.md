# Matrix Digital Rain - GitHub Copilot Development Instructions

**ALWAYS follow these instructions first** and only fallback to additional search and context gathering if the information here is incomplete or found to be in error.

## Working Effectively

Bootstrap and serve the Matrix application:
- Serve with Python: `python3 -m http.server 8000` (instant startup)
- Serve with Node.js: `npx http-server -p 8000` (3-5 seconds for npm package install)
- Serve with PHP: `php -S localhost:8000` (instant startup)
- **All three options work identically** - choose based on availability

Format code with Prettier:
- `npx prettier --write --use-tabs --print-width 160 "index.html" "./js/**/**.js" "./lib/gpu-buffer.js"`
- **TIMING**: Takes ~2 seconds to complete, including npm package install
- **NEVER CANCEL**: Always let Prettier finish completely

## Validation

**CRITICAL**: Always manually validate the Matrix application after making changes:

### Essential Test Scenarios
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
   - Pride colors: `?effect=pride&suppressWarnings=true`
   - Custom stripes: `?effect=stripes&stripeColors=1,0,0,1,1,0,0,1,0&suppressWarnings=true`

### Performance Testing
- Use URL parameters for performance validation: `?fps=30&resolution=0.5&effect=none`
- Monitor browser console for WebGL warnings (expected in sandboxed environments)

## Build System and Dependencies

**NO TRADITIONAL BUILD REQUIRED** - This is a static web application:
- No package.json, no npm install, no webpack, no bundling
- Uses ES6 modules loaded directly by browser
- Prettier for code formatting only (not part of build pipeline)
- All dependencies are self-contained in `/lib` directory

### Playdate Game Development (Optional)
**ONLY attempt if PLAYDATE_SDK_PATH environment variable is set:**
- Simulator build: `cd playdate/matrix_c/build && rm -R ../ThePlaytrix.pdx ./* && cmake .. && make`
- Device build: `cd playdate/matrix_c/build-device && cmake -DCMAKE_TOOLCHAIN_FILE=${PLAYDATE_SDK_PATH}/C_API/buildsupport/arm.cmake -DCMAKE_BUILD_TYPE=Release .. && make`
- **TIMING**: Each build takes 30-60 seconds. NEVER CANCEL builds.

## Repository Structure and Navigation

### Core Web Application Files
- `index.html` - Main HTML entry point with inline CSS
- `js/main.js` - Application bootstrap and config loading
- `js/config.js` - URL parameter parsing and configuration management
- `js/regl/` - WebGL implementation using REGL library
- `js/webgpu/` - WebGPU implementation (next-generation graphics)
- `shaders/` - GLSL and WGSL shader source files

### Key Renderer Files
- `js/regl/main.js` - REGL WebGL renderer entry point
- `js/webgpu/main.js` - WebGPU renderer entry point  
- `js/regl/rainPass.js` - Core Matrix rain computation (REGL)
- `js/webgpu/rainPass.js` - Core Matrix rain computation (WebGPU)

### Asset Files
- `assets/` - Matrix fonts (TrueType) and MSDF texture atlases
- `lib/` - Third-party JavaScript libraries (REGL, gl-matrix, etc.)

### Documentation
- `README.md` - User-facing documentation with all URL parameters
- `DEV_README.md` - Developer guide with Matrix movie theming
- `.copilot/instructions.md` - Copilot instructions for code enhancement

## Common Development Tasks

### Making Visual Changes
1. **Modify shader code** in `/shaders` directory for rendering effects
2. **Update pass configurations** in `js/regl/` or `js/webgpu/` directories
3. **Test immediately** by refreshing browser - no build step needed
4. **Always validate** with multiple Matrix versions and effects

### Adding New URL Parameters
1. Update parameter definitions in `js/config.js`
2. Add validation and default values in config parsing
3. Test parameter in URL: `?yourNewParam=value&suppressWarnings=true`
4. **Always test** with existing parameters to ensure no conflicts

### Performance Optimization
1. **Profile with browser DevTools** - built-in GPU performance counters
2. **Test with different resolutions**: `?resolution=0.5` for performance testing
3. **Use debug view**: `?effect=none` to see raw computational output
4. **Monitor WebGL state** if making renderer changes

## File Change Impact Analysis

### Changes Requiring Format Check
- **ANY JavaScript file change**: Run Prettier command before committing
- **HTML file changes**: Include in Prettier run

### Changes Requiring Full Validation
- **Shader files** (`/shaders`): Test all Matrix versions and effects
- **Renderer files** (`js/regl/`, `js/webgpu/`): Test WebGL and WebGPU modes
- **Config changes** (`js/config.js`): Test URL parameter parsing
- **Main entry points** (`index.html`, `js/main.js`): Full application test

### Safe Changes (Minimal Testing)
- **Documentation files** (`*.md`): No validation required
- **Asset files** (`/assets`): Test affected visual features only

## Troubleshooting

### Common Issues
- **Performance warnings**: Expected in headless/sandboxed environments
- **WebGL fallback warnings**: Normal when hardware acceleration unavailable
- **Blank screen**: Check browser console for JavaScript errors
- **Slow performance**: Test with `?resolution=0.5` parameter

### Development Environment
- **Any modern browser** with JavaScript enabled
- **Local HTTP server** (Python/Node.js/PHP) required for ES6 modules
- **No build tools** or development dependencies required
- **Prettier** available via npx for code formatting

## Matrix Movie References (Required)

This project celebrates *The Matrix* franchise created by the Wachowski sisters. When making changes:
- **Maintain the Matrix aesthetic** - green digital rain, cyberpunk themes
- **Use Matrix terminology** in comments and documentation when appropriate
- **Remember**: "There is no spoon" - the effect is an illusion created by mathematical precision
- **The red pill reveals truth** - debug mode (`?effect=none`) shows the reality behind the illusion

*"Welcome to the real world, Neo."* - Morpheus

## Quick Reference Commands

```bash
# Serve application (choose one)
python3 -m http.server 8000
npx http-server -p 8000  
php -S localhost:8000

# Format code (ALWAYS before committing)
npx prettier --write --use-tabs --print-width 160 "index.html" "./js/**/**.js" "./lib/gpu-buffer.js"

# Essential validation URLs
http://localhost:8000/?suppressWarnings=true                              # Default Matrix
http://localhost:8000/?version=3d&suppressWarnings=true                   # 3D Mode  
http://localhost:8000/?effect=none&suppressWarnings=true                  # Debug view
http://localhost:8000/?effect=stripes&stripeColors=1,0,0,1,1,0&suppressWarnings=true  # Custom colors
```

---

*The Matrix has you. Follow the white rabbit.* 🐰