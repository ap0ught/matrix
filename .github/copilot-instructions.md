# Matrix Digital Rain - GitHub Copilot Instructions

**CRITICAL**: Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Project Overview

Matrix Digital Rain is a web-based implementation of the iconic falling green code from The Matrix films. It's built with WebGL/WebGPU for high-performance graphics rendering and uses ES6 modules with no build system - it runs as static files served by any HTTP server.

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
# Format all JavaScript files (takes ~3 seconds)
npx prettier --write --use-tabs --print-width 160 "js/**/*.js"

# Complete format command including HTML and libraries
npx prettier --write --use-tabs --print-width 160 "index.html" "./js/**/*.js" "./lib/gpu-buffer.js"
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
- `js/main.js` - Application bootstrap and config loading
- `js/config.js` - URL parameter parsing and configuration management
- `js/music-integration.js` - Spotify music synchronization
- `js/regl/` - WebGL implementation using REGL library
- `js/webgpu/` - WebGPU implementation (next-generation graphics)
- `shaders/` - GLSL and WGSL shader source files

### Key Renderer Files
- `js/regl/main.js` - REGL WebGL renderer entry point
- `js/webgpu/main.js` - WebGPU renderer entry point  
- `js/regl/rainPass.js` & `js/webgpu/rainPass.js` - Core Matrix rain computation
- `js/regl/bloomPass.js` & `js/webgpu/bloomPass.js` - Glow/bloom effects

### Asset Files
- `assets/` - Matrix fonts (TrueType) and MSDF texture atlases
- `assets/*_msdf.png` - Multi-channel distance field font textures
- `lib/` - Third-party JavaScript libraries (REGL, gl-matrix, etc.)

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

**CRITICAL**: After making any changes, you MUST manually validate the application functionality.

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
   - Rainbow colors: `?effect=rainbow&suppressWarnings=true`
   - Custom stripes: `?effect=stripes&stripeColors=1,0,0,1,1,0,0,1,0&suppressWarnings=true`
   - Custom colors: `http://localhost:8000/?effect=stripes&stripeColors=1,0,0,1,1,0,0,1,0`
   - Performance testing: `?fps=30&resolution=0.5`

### Performance Testing
- Use URL parameters for performance validation: `?fps=30&resolution=0.5&effect=none`
- **WebGL Inspector** - Use browser DevTools for frame analysis
- **Chrome DevTools** - Monitor CPU and memory usage during animation
- **Test with software rendering** - Application should work even without hardware acceleration
- Monitor browser console for WebGL warnings (expected in sandboxed environments)

### Code Quality Validation
```bash
# ALWAYS run formatting before committing
npx prettier --write --use-tabs --print-width 160 "js/**/*.js"

# Verify no JavaScript errors in browser console
# Check for WebGL/WebGPU warnings (expected in sandbox environments)
```

## Common Development Tasks

### Making Visual Changes
1. **Modify shader code** in `/shaders` directory for rendering effects
2. **Update pass configurations** in `js/regl/` or `js/webgpu/` directories
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
2. **Test with different resolutions**: `?resolution=0.5` for performance testing
3. **Use debug view**: `?effect=none` to see raw computational output
4. **Monitor WebGL state** if making renderer changes
5. Monitor GPU usage in browser DevTools
6. Adjust bloom settings and resolution parameters
7. Test on both WebGL and WebGPU renderers

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

## Build System and Dependencies

**NO TRADITIONAL BUILD REQUIRED** - This is a static web application:
- No package.json, no npm install, no webpack, no bundling
- Uses ES6 modules loaded directly by browser
- Prettier for code formatting only (not part of build pipeline)
- All dependencies are self-contained in `/lib` directory
- **No Build System**: Static files, no webpack/rollup/vite needed
- **ES6 Modules**: Modern import/export syntax throughout
- **No package.json**: Uses npx for tools like prettier and http-server
- **Git Submodules**: msdfgen for font processing (requires manual initialization)

## Browser Compatibility

- **WebGL 2.0**: Widely supported, battle-tested (js/regl/)
- **WebGPU**: Cutting-edge, modern browsers only (js/webgpu/)
- **Software Fallback**: Works with SwiftShader when hardware acceleration disabled
- **Mobile Support**: Responsive design, touch interactions for effects

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
- Lower resolution: `?resolution=0.5`
- Reduce bloom: `?bloomSize=0.1&bloomStrength=0.3`
- Debug view for analysis: `?effect=none` (reveals character grid structure)

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

# Format code (ALWAYS before committing)
npx prettier --write --use-tabs --print-width 160 "index.html" "./js/**/**.js" "./lib/gpu-buffer.js"

# Essential validation URLs
http://localhost:8000/?suppressWarnings=true                              # Default Matrix
http://localhost:8000/?version=3d&suppressWarnings=true                   # 3D Mode  
http://localhost:8000/?effect=none&suppressWarnings=true                  # Debug view
http://localhost:8000/?effect=stripes&stripeColors=1,0,0,1,1,0&suppressWarnings=true  # Custom colors
```

---

**Remember**: This is a digital art project first, a technical demo second. Changes should preserve the mystique and visual impact of the original Matrix digital rain effect while improving performance and accessibility.

*The Matrix has you. Follow the white rabbit.* 🐰

