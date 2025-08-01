# Developer README

This document contains technical information for developers working on the Matrix digital rain project.

## Project Overview

This is a web-based implementation of the iconic digital rain effect from **The Matrix** film series, built with WebGL/WebGPU and JavaScript. Inspired by the groundbreaking 1999 sci-fi film directed by the Wachowski Siblings, this project recreates the mesmerizing green code that has become synonymous with the franchise's cyberpunk aesthetic. The implementation focuses on accuracy to the films while providing extensive customization options for different Matrix "versions" and visual variants.

## Architecture

### Core Technologies
- **WebGL**: Primary rendering backend using REGL wrapper
- **WebGPU**: Experimental/beta rendering backend 
- **Multi-channel Distance Fields (MSDF)**: For crisp glyph rendering at any scale
- **JavaScript ES6 modules**: Modular code structure

### Directory Structure

```
├── index.html              # Main HTML entry point
├── js/                     # Core JavaScript modules
│   ├── main.js            # Application entry point and WebGL/WebGPU selection
│   ├── config.js          # Configuration system and version definitions
│   ├── camera.js          # Camera/mirror effect utilities
│   ├── colorToRGB.js      # Color conversion utilities
│   ├── regl/              # WebGL implementation (REGL-based)
│   └── webgpu/            # WebGPU implementation
├── lib/                   # Third-party libraries
│   ├── regl.js           # WebGL functional wrapper
│   ├── gl-matrix.js      # Matrix math utilities
│   ├── gpu-buffer.js     # GPU buffer management utilities
│   └── holoplaycore.module.js # Holographic display support
├── shaders/              # Shader source code
│   ├── glsl/            # WebGL shaders (GLSL)
│   └── wgsl/            # WebGPU shaders (WGSL)
├── assets/              # Static assets
│   ├── *_msdf.png       # Multi-channel distance field glyph textures
│   ├── *.ttf            # TrueType fonts
│   └── *.png            # Various textures and images
└── playdate/            # Playdate console version
```

## Development Setup

### Prerequisites
- Modern web browser with WebGL support
- HTTP server for local development (browsers block file:// access to modules)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/username/matrix-digital-rain.git
   cd <project-directory>
   ```

2. **Start a local HTTP server**
   ```bash
   # Python 3
   python3 -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (if http-server is installed)
   npx http-server -p 8000
   
   # PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   Navigate to `http://localhost:8000`

### GitHub Codespaces Development

GitHub Codespaces provides a cloud-based development environment that's perfect for this project:

1. **Open in Codespaces**
   - Navigate to the repository on GitHub
   - Click the green "Code" button
   - Select "Codespaces" tab
   - Click "Create codespace on main" (or your branch)

2. **Start the development server**
   Once your Codespace loads, open a terminal and run:
   ```bash
   python3 -m http.server 8000
   ```

3. **Access the application**
   - Codespaces will automatically detect the running server on port 8000
   - A popup will appear asking if you want to open the application
   - Click "Open in Browser" to view the Matrix digital rain effect
   - Alternatively, go to the "Ports" tab and click the globe icon next to port 8000

4. **Development workflow**
   - Edit files directly in the Codespaces VS Code interface
   - Changes are automatically reflected when you refresh the browser
   - The integrated terminal provides access to all development tools
   - Git operations work seamlessly with GitHub integration

5. **Port forwarding**
   - Codespaces automatically forwards port 8000 as public by default
   - You can share the forwarded URL with others for collaboration
   - Access the Ports panel (View → Ports) to manage port visibility

### Codespaces advantages for this project:
- **No local setup required**: Everything works immediately
- **Consistent environment**: Same setup across all contributors  
- **Easy sharing**: Share running instances via forwarded URLs
- **GitHub integration**: Seamless git operations and PR workflows
- **Browser-based**: Perfect for a web-based graphics project

### No Build System Required
This project runs directly in the browser with no compilation step. All modules are loaded as ES6 modules.

## Code Style

The project uses Prettier for code formatting:

```bash
prettier --write --use-tabs --print-width 160 "index.html" "./js/**/**.js" "./lib/gpu-buffer.js"
```

## Technical Details

### Rendering Pipeline

1. **Configuration Loading**: URL parameters parsed into configuration object
2. **Renderer Selection**: WebGPU vs WebGL based on browser support and config
3. **Asset Loading**: MSDF textures and fonts loaded asynchronously
4. **GPU Compute**: Raindrop particles computed in GPU textures
5. **Glyph Rendering**: MSDF glyphs rendered with distance field techniques
6. **Post-processing**: Bloom, color grading, and effect passes

### Key Algorithms

#### Raindrop Animation
- Uses sawtooth wave functions to create non-colliding raindrops in columns
- Multiple raindrops per column with varying speeds
- GPU-computed particle positions stored in textures

#### MSDF Glyph Rendering
- Multi-channel distance fields preserve vector quality at any scale
- Enables sharp glyph edges without pre-rasterized textures
- Generated using Victor Chlumsky's msdfgen tool

#### 3D Mode
- Volumetric rendering with depth-based glyph positioning
- Forward-moving particles approaching the camera
- Perspective projection with configurable depth parameters

## Customization System

The project supports extensive customization via URL parameters. Key configuration areas:

- **Visual Versions**: Classic, 3D, Resurrections, custom variants
- **Fonts**: Multiple glyph sets (Matrix, Gothic, Coptic, etc.)
- **Colors**: RGB/HSL color customization for all elements
- **Animation**: Speed, direction, and behavior parameters
- **Effects**: Post-processing options (mirror, pride, stripes, etc.)
- **Display**: Resolution, bloom, performance settings

## Performance Considerations

### GPU Memory
- Particle data stored in GPU textures to minimize CPU-GPU data transfer
- MSDF textures loaded once and reused
- Efficient GPU compute shaders for particle updates

### Browser Compatibility
- Graceful fallback from WebGPU to WebGL
- SwiftShader detection for software rendering warnings
- Mobile optimization considerations

## Testing

### Manual Testing
1. Test different URL parameter combinations
2. Verify performance across devices and browsers
3. Check WebGL and WebGPU rendering paths
4. Validate mobile responsiveness

### Performance Testing
- Monitor frame rates on various devices
- Test GPU memory usage
- Verify fallback rendering paths

## Future Development

See `TODO.txt` for detailed development roadmap including:

- Live configuration UI with Tweakpane
- Audio system integration
- WebGPU optimizations
- Enhanced 3D effects
- Performance improvements

## Contributing

### Code Contributions
1. Follow existing code style (use Prettier)
2. Test on multiple browsers and devices
3. Ensure WebGL and WebGPU compatibility where applicable
4. Document any new URL parameters or configuration options

### Asset Contributions
- MSDF glyph textures: Use msdfgen with consistent parameters
- Fonts: Ensure proper licensing for distribution
- Textures: Optimize for web delivery

## Debugging

### Browser Developer Tools

**Console Debugging:**
- Open DevTools (F12) and check the Console tab for JavaScript errors
- Look for module loading errors, WebGL context issues, or asset loading failures
- Monitor for warnings about hardware acceleration or browser compatibility

**Performance Analysis:**
- Use the Performance tab to profile frame rates and identify bottlenecks
- Monitor GPU memory usage in the Memory tab
- Check the Network tab for slow-loading assets (MSDF textures, shaders)
- Use Timeline to analyze rendering pipeline performance

**Graphics Debugging:**
- Install WebGL Inspector or WebGPU Inspector browser extensions
- Use the Sources tab to set breakpoints in shader compilation code
- Monitor WebGL/WebGPU state changes and draw calls

### URL Parameters for Debugging

**Visual Debugging:**
- `?effect=none` - Shows raw rain without color effects (pure white on black)
- `?effect=plain` - Basic palette effect without post-processing
- `?effect=palette` - Standard palette rendering
- `?once=true` - Renders only one frame, useful for inspecting static output
- `?skipIntro=true` - Skip intro animation for faster debugging

**Performance Testing:**
- `?fps=30` - Set target frame rate (1-60) to test performance
- `?resolution=0.5` - Scale rendering resolution (lower = better performance)
- `?numColumns=40` - Reduce column count for performance testing
- `?animationSpeed=0.1` - Slow down animations for frame-by-frame analysis
- `?loops=false` - Disable animation loops

**Renderer Selection:**
- `?renderer=regl` - Force WebGL renderer (default)
- `?renderer=webgpu` - Force WebGPU renderer (if supported)
- `?suppressWarnings=true` - Hide hardware acceleration warnings

**Test Fixes:**
- `?testFix=fwidth_10_1_2022_A` - Enable specific compatibility fixes
- `?testFix=fwidth_10_1_2022_B` - Alternative compatibility mode

**Layout and Visual Testing:**
- `?volumetric=true` - Enable 3D volumetric mode
- `?camera=true` - Enable camera input for testing
- `?glyphFlip=true` - Horizontally flip glyphs
- `?slant=45` - Adjust rain angle (degrees)
- `?palette=255,0,0,0,255,255,0,1` - Custom color palette (RGB values 0-255, alpha 0-1)

### Common Debugging Scenarios

**Performance Issues:**
1. Check hardware acceleration: Navigate to `chrome://gpu/` in Chrome
2. Test with reduced parameters: `?resolution=0.5&numColumns=40&fps=30`
3. Profile in DevTools Performance tab during animation
4. Monitor memory usage for leaks

**Rendering Issues:**
1. Start with `?effect=none` to isolate the base rain rendering
2. Check browser console for WebGL context errors
3. Test different renderers: `?renderer=regl` vs `?renderer=webgpu`
4. Verify MSDF texture loading in Network tab

**Animation Problems:**
1. Use `?animationSpeed=0.1` to slow down animations
2. Enable `?once=true` for static analysis
3. Check timing with `?fps=1` for frame-by-frame debugging

**Browser Compatibility:**
1. Test with different browsers and versions
2. Check WebGL/WebGPU support at `about://gpu/` or similar
3. Use compatibility test fixes when needed
4. Monitor console for extension-related warnings

### Debug Tools and Extensions

**Browser Extensions:**
- **WebGL Inspector** - Captures WebGL calls and state
- **WebGPU Inspector** - Debug WebGPU pipelines and shaders
- **GPU Benchmark** - Test graphics performance
- **Developer Tools** - Built-in performance profilers

**Manual Testing Techniques:**
- Test across different screen resolutions and pixel ratios
- Verify behavior on mobile devices and touch interfaces
- Check memory usage during extended sessions
- Test with different Matrix versions: `?version=classic`, `?version=resurrections`

## Version History

The project supports multiple Matrix "versions" representing different eras and interpretations:
- Classic: Based on sequels' opening titles
- Resurrections: Updated 2021 film glyphs
- Operator: First film operator screen style  
- Paradise/Nightmare: Speculative earlier Matrix versions
- Custom variants: Palimpsest, Twilight, etc.

Each version has distinct visual characteristics, glyph sets, and animation behaviors defined in `js/config.js`.
