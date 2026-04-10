# 🎨 Matrix Shader Development Guide

_"What you must learn is that these rules are no different than the rules of a computer system. Some of them can be bent. Others can be broken."_ - Morpheus

Welcome to the Matrix shader development guide. This document will help you understand, modify, and create shaders for the Matrix Digital Rain effect.

## 📘 Overview

The Matrix Digital Rain effect uses GPU shaders to achieve its iconic look. Shaders are small programs that run on the GPU, processing graphics data at incredible speeds. This project supports two shader languages:

- **GLSL (OpenGL Shading Language)** - Used with **WebGL 1** (GLSL ES 1.00) via **regl** in the browser
- **WGSL (WebGPU Shading Language)** - Used with WebGPU for next-generation performance

## 🗂️ Shader Directory Structure

```
shaders/
├── glsl/                           # WebGL 2.0 shaders
│   ├── rainPass.frag.glsl         # Main rain rendering fragment shader
│   ├── rainPass.vert.glsl         # Main rain rendering vertex shader
│   ├── rainPass.intro.frag.glsl   # Intro animation fragment shader
│   ├── rainPass.symbol.frag.glsl  # Symbol rendering fragment shader
│   ├── rainPass.raindrop.frag.glsl # Raindrop state computation
│   ├── rainPass.effect.frag.glsl  # Special effects fragment shader
│   ├── bloomPass.highPass.frag.glsl  # Bloom high-pass filter
│   ├── bloomPass.blur.frag.glsl   # Bloom blur effect
│   ├── bloomPass.combine.frag.glsl # Bloom combination
│   ├── palettePass.frag.glsl      # Color palette application
│   ├── stripePass.frag.glsl       # Stripe effect rendering
│   ├── mirrorPass.frag.glsl       # Mirror/camera effect
│   ├── imagePass.frag.glsl        # Custom image overlay
│   └── quiltPass.frag.glsl        # Looking Glass holographic display
│
└── wgsl/                           # WebGPU shaders
    ├── rainPass.wgsl              # Main rain rendering (compute + render)
    ├── bloomBlur.wgsl             # Bloom blur effect
    ├── bloomCombine.wgsl          # Bloom combination
    ├── palettePass.wgsl           # Color palette application
    ├── stripePass.wgsl            # Stripe effect rendering
    ├── mirrorPass.wgsl            # Mirror/camera effect
    ├── imagePass.wgsl             # Custom image overlay
    └── endPass.wgsl               # Final output pass
```

## 🎯 Understanding the Rendering Pipeline

### WebGL GLSL ES 1.00 precision (shared uniforms)

The WebGL path uses **GLSL ES 1.00** (with extensions). Some stacks (e.g. Chrome/ANGLE) **fail program link** with:

`Precisions of uniform '…' differ between VERTEX and FRAGMENT shaders`

when the same `float` uniform is declared in both stages without an explicit shared precision. **Fix**: use the same qualifier in both files, e.g. `uniform mediump float glyphHeightToWidth` in `rainPass.vert.glsl`, `rainPass.frag.glsl`, and `rainPass.effect.frag.glsl` (effect pass pairs with the fullscreen quad vertex in `js/webgl/utils.js`, which uses `precision mediump float`).

### The Rain Pass

The **rain pass** is the heart of the Matrix effect. It renders the falling digital rain characters using MSDF (Multi-channel Signed Distance Field) textures.

**Key Responsibilities:**
1. **State Management** - Tracks raindrop position, speed, and lifetime
2. **Glyph Rendering** - Renders Matrix characters using MSDF textures
3. **Animation** - Controls the falling animation and character cycling
4. **Effects** - Applies special effects (glint, brightness variations, etc.)

**Important Uniforms:**
- `raindropState` - Texture containing raindrop state data
- `symbolState` - Texture containing current symbol for each position
- `effectState` - Texture containing effect parameters
- `glyphMSDF` - MSDF texture atlas for Matrix characters
- `numColumns`, `numRows` - Grid dimensions
- `glyphSequenceLength` - Number of glyphs in the animation sequence

### The Bloom Pass

The **bloom pass** creates the iconic glow effect that makes the Matrix rain luminous.

**Three-Stage Process:**
1. **High Pass Filter** - Extracts bright areas above a threshold
2. **Blur** - Applies Gaussian blur to create glow
3. **Combine** - Blends the blurred result with the original image

### The Palette Pass

The **palette pass** applies color transformations to create different Matrix versions (classic green, resurrections, custom colors, etc.).

## 🔧 Creating Your First Shader Modification

### Example: Changing the Glow Color

Let's modify the bloom effect to add a custom color tint:

```glsl
// In bloomPass.combine.frag.glsl
precision highp float;

uniform sampler2D originalTexture;
uniform sampler2D bloomTexture;
uniform float bloomStrength;
uniform vec3 customTint; // Add this uniform

varying vec2 vUV;

void main() {
    vec4 original = texture2D(originalTexture, vUV);
    vec4 bloom = texture2D(bloomTexture, vUV);
    
    // Apply custom tint to bloom
    bloom.rgb *= customTint;
    
    gl_FragColor = original + bloom * bloomStrength;
}
```

Then update the corresponding JavaScript file (`js/webgl/bloomPass.js`):

```javascript
uniforms: {
    originalTexture: regl.prop('original'),
    bloomTexture: regl.prop('bloom'),
    bloomStrength: regl.prop('bloomStrength'),
    customTint: [1.0, 0.8, 0.9], // Pink-ish tint
}
```

### Example: Adding a Wave Effect

To add a subtle wave distortion to the rain:

```glsl
// In rainPass.frag.glsl
uniform float time;
uniform float waveAmplitude;
uniform float waveFrequency;

vec2 getUV(vec2 uv) {
    // Original UV calculation
    vec2 baseUV = uv;
    
    // Add wave distortion
    float wave = sin(uv.y * waveFrequency + time) * waveAmplitude;
    baseUV.x += wave;
    
    return baseUV;
}
```

## 📚 Shader Concepts and Techniques

### Multi-Channel Signed Distance Fields (MSDF)

MSDF is the secret to crisp, scalable glyph rendering. Instead of storing pixel data, MSDF stores the distance from each pixel to the nearest glyph edge across three color channels.

```glsl
float median3(vec3 i) {
    return max(min(i.r, i.g), min(max(i.r, i.g), i.b));
}

// Sample the MSDF texture
vec3 msdf = texture2D(glyphMSDF, glyphUV).rgb;
float distance = median3(msdf);

// Convert distance to alpha with anti-aliasing
float alpha = smoothstep(0.5 - fwidth(distance), 0.5 + fwidth(distance), distance);
```

**Why it works:**
- `median3()` provides robustness against artifacts
- `fwidth()` calculates the rate of change for anti-aliasing
- `smoothstep()` creates smooth edges without pixelation

### Texture-Based State Management

Matrix rain uses textures to store computation state between frames:

```glsl
// Read previous state
vec4 previousState = texture2D(stateTexture, uv);

// Update state
float newPosition = previousState.x + speed * deltaTime;
float newBrightness = previousState.y * decay;

// Write new state
gl_FragColor = vec4(newPosition, newBrightness, previousState.zw);
```

This technique allows thousands of raindrops to be simulated in parallel on the GPU.

### Volumetric Rendering

In 3D mode, the rain is rendered as volumetric quads in 3D space:

```glsl
varying float vDepth; // Depth in 3D space

void main() {
    vec4 color = calculateColor();
    
    // Apply depth-based fog
    float fogFactor = exp(-vDepth * fogDensity);
    color.rgb = mix(fogColor, color.rgb, fogFactor);
    
    // Depth-based brightness
    color.rgb *= mix(0.3, 1.0, 1.0 - vDepth);
    
    gl_FragColor = color;
}
```

## 🎨 WebGL vs WebGPU Shaders

### GLSL (WebGL)

**Pros:**
- Widely supported across browsers and devices
- Mature ecosystem with extensive documentation
- Easier debugging tools

**Cons:**
- Limited compute shader support
- Less efficient memory access patterns
- Legacy API design

**Example Fragment Shader:**
```glsl
precision highp float;

uniform sampler2D inputTexture;
uniform float brightness;
varying vec2 vUV;

void main() {
    vec4 color = texture2D(inputTexture, vUV);
    color.rgb *= brightness;
    gl_FragColor = color;
}
```

### WGSL (WebGPU)

**Pros:**
- Modern compute shader support
- Better performance for parallel operations
- More explicit control over GPU resources

**Cons:**
- Limited browser support (Chrome/Edge, experimental in Firefox)
- Newer API with less documentation
- More verbose syntax

**Example Compute Shader:**
```wgsl
@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> params: Params;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let coords = vec2<i32>(id.xy);
    let color = textureLoad(inputTexture, coords, 0);
    let brightened = color * params.brightness;
    textureStore(outputTexture, coords, brightened);
}
```

## 🛠️ Development Workflow

### 1. Local Testing

```bash
# Start local server
python3 -m http.server 8000

# Open in browser with debug view
http://localhost:8000/?effect=none&suppressWarnings=true
```

The debug view (`effect=none`) shows raw shader output without post-processing, useful for diagnosing issues.

### 2. Shader Hot Reloading

Shaders are loaded as text files, so you can modify them and refresh the browser to see changes immediately. No build step required!

### 3. Performance Profiling

Use browser DevTools to profile shader performance:

```javascript
// In Chrome DevTools → Performance
// Record while Matrix is running
// Look for "GPU" sections to identify bottlenecks
```

### 4. Common Issues and Solutions

**Problem: Shader compilation errors**
```
Solution: Check the browser console for GLSL/WGSL errors.
Common issues: typos, incorrect uniform types, missing precision qualifiers
```

**Problem: Visual artifacts or flickering**
```
Solution: Check for:
- Uninitialized variables
- Division by zero
- Texture coordinate clamping issues
- Precision problems (use highp for critical calculations)
```

**Problem: Poor performance**
```
Solution: Optimize:
- Reduce texture lookups (cache values)
- Use cheaper math operations (mad instead of separate mul/add)
- Minimize branching (if statements)
- Consider lower precision (mediump) where appropriate
```

## 📊 Shader Performance Best Practices

### 1. Minimize Texture Lookups

**Bad:**
```glsl
vec4 color = texture2D(tex, uv);
float r = texture2D(tex, uv).r; // Redundant lookup!
float g = texture2D(tex, uv).g; // Another redundant lookup!
```

**Good:**
```glsl
vec4 color = texture2D(tex, uv);
float r = color.r;
float g = color.g;
```

### 2. Use Built-in Functions

**Bad:**
```glsl
float lerp(float a, float b, float t) {
    return a + (b - a) * t; // Manual interpolation
}
```

**Good:**
```glsl
float value = mix(a, b, t); // Built-in, hardware-accelerated
```

### 3. Avoid Branching in Inner Loops

**Bad:**
```glsl
for (int i = 0; i < 10; i++) {
    if (someCondition) {
        // Branching in loop causes GPU stalls
        doSomething();
    }
}
```

**Good:**
```glsl
for (int i = 0; i < 10; i++) {
    float mask = someCondition ? 1.0 : 0.0;
    doSomething() * mask; // Branchless
}
```

### 4. Choose Appropriate Precision

```glsl
precision highp float;   // Use for critical calculations
precision mediump float; // Default, good balance
precision lowp float;    // Use for colors, normalized values

// Example:
lowp vec4 color;      // Colors only need 8-bit precision
mediump vec2 uv;      // UVs need medium precision
highp float depth;    // Depth requires high precision
```

## 🎓 Advanced Techniques

### Custom MSDF Rendering

Want to modify how glyphs are rendered? Here's the core MSDF rendering code:

```glsl
// Get MSDF sample
vec3 msdf = texture2D(glyphMSDF, glyphUV).rgb;
float signedDistance = median3(msdf);

// Basic rendering
float alpha = smoothstep(0.5 - fwidth(signedDistance), 0.5 + fwidth(signedDistance), signedDistance);

// Advanced: Add outline
float outlineThickness = 0.1;
float outline = smoothstep(0.5 - outlineThickness, 0.5, signedDistance);
float fill = smoothstep(0.5, 0.5 + outlineThickness, signedDistance);
vec3 finalColor = mix(outlineColor, fillColor, fill);
float finalAlpha = outline;

gl_FragColor = vec4(finalColor, finalAlpha);
```

### Procedural Effects

Create effects without additional textures:

```glsl
// Noise function for randomness
float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

// Procedural glitch effect
vec2 glitchUV(vec2 uv, float time) {
    float glitchIntensity = rand(vec2(time, floor(uv.y * 10.0)));
    uv.x += (glitchIntensity - 0.5) * 0.1;
    return uv;
}
```

### Color Grading

Apply cinematic color correction:

```glsl
// Film-like color grading
vec3 colorGrade(vec3 color) {
    // Toe (shadows)
    vec3 toe = color * 0.9;
    
    // Shoulder (highlights)
    vec3 shoulder = vec3(1.0) - exp(-color * 1.5);
    
    // Blend based on luminance
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(toe, shoulder, smoothstep(0.3, 0.7, luma));
}
```

## 🔬 Debugging Shaders

### Visualizing Values

Can't use a debugger? Visualize values as colors:

```glsl
// Debug: Visualize UV coordinates
gl_FragColor = vec4(vUV.x, vUV.y, 0.0, 1.0);

// Debug: Visualize a scalar value
float debugValue = someCalculation();
gl_FragColor = vec4(vec3(debugValue), 1.0);

// Debug: Visualize a vector
vec3 debugVector = someVectorCalculation();
gl_FragColor = vec4(debugVector * 0.5 + 0.5, 1.0); // Remap -1..1 to 0..1
```

### Common Debugging Patterns

```glsl
// Check if texture coordinates are in bounds
if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red = out of bounds
    return;
}

// Verify texture sampling
vec4 sample = texture2D(myTexture, uv);
if (sample.a < 0.01) {
    gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0); // Blue = transparent
    return;
}

// Check for NaN/Inf
if (isnan(value) || isinf(value)) {
    gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); // Yellow = invalid
    return;
}
```

## 🎬 Creating New Matrix Variants

To create a new visual variant, you'll typically modify:

1. **Color Palette** (`palettePass.*.glsl/wgsl`)
2. **Animation Speed** (uniforms in JavaScript)
3. **Effect Parameters** (`rainPass.effect.frag.glsl`)
4. **Post-Processing** (`bloomPass.*.glsl/wgsl`)

Example workflow:

```javascript
// In js/config.js, add a new version
versions: {
    'cyberpunk': {
        colors: [[0.0, 1.0, 1.0], [1.0, 0.0, 1.0]], // Cyan to magenta
        animationSpeed: 1.5,
        bloomStrength: 1.8,
        glintStrength: 2.0,
    }
}
```

Then test with: `http://localhost:8000/?version=cyberpunk`

## 📖 Learning Resources

### GLSL Resources
- [The Book of Shaders](https://thebookofshaders.com/) - Interactive GLSL tutorial
- [Shadertoy](https://www.shadertoy.com/) - Shader examples and experiments
- [GLSL Reference](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language) - Official specification

### WGSL Resources
- [WebGPU Specification](https://gpuweb.github.io/gpuweb/) - Official WebGPU docs
- [WGSL Specification](https://www.w3.org/TR/WGSL/) - Official WGSL specification
- [WebGPU Fundamentals](https://webgpufundamentals.org/) - Practical tutorials

### Matrix-Specific Resources
- [DEV_README.md](DEV_README.md) - Project architecture and concepts
- [README.md](README.md) - Usage and customization options
- Shader source code in `shaders/` directory

## 💡 Tips and Tricks

### The Matrix Philosophy

Remember the Matrix movies when working with shaders:

- **"There is no spoon"** - Don't think of shaders as limiting. With math, anything is possible.
- **"What is real?"** - Shaders create illusions. Master the illusion, master reality.
- **"I can only show you the door"** - This guide shows techniques. You must explore to truly understand.

### Performance Mantra

> "The fastest shader is the one that doesn't run."

Optimize by:
1. Computing once, using many times
2. Moving calculations to the vertex shader when possible
3. Using LOD (Level of Detail) techniques
4. Culling invisible geometry early

### Code Quality

Write readable shaders:
- Use descriptive variable names
- Add comments explaining complex math
- Break long calculations into intermediate steps
- Keep functions focused and small

## 🤝 Contributing Shader Improvements

When submitting shader changes:

1. **Test thoroughly** across different Matrix versions
2. **Document your changes** in code comments
3. **Consider performance** - profile before and after
4. **Maintain compatibility** - don't break existing variants
5. **Follow the style** - match existing shader formatting

### Shader Code Style

```glsl
// Good style example
precision highp float;

// Group uniforms logically
uniform sampler2D inputTexture;
uniform float brightness;
uniform vec2 resolution;

// Document varyings
varying vec2 vUV; // Texture coordinates [0,1]

// Clear function names and comments
vec3 applyColorGrading(vec3 color) {
    // Apply film-like color curve
    return vec3(1.0) - exp(-color * 1.5);
}

void main() {
    // Read input
    vec4 color = texture2D(inputTexture, vUV);
    
    // Apply effects
    color.rgb = applyColorGrading(color.rgb);
    color.rgb *= brightness;
    
    // Output
    gl_FragColor = color;
}
```

---

## 🚀 Next Steps

1. **Explore** - Look through the existing shaders in `shaders/glsl/` and `shaders/wgsl/`
2. **Experiment** - Try modifying colors, effects, and animation parameters
3. **Create** - Build your own Matrix variant with custom shaders
4. **Share** - Contribute your improvements back to the project

_"I'm trying to free your mind, Neo. But I can only show you the door. You're the one that has to walk through it."_ - Morpheus

**Now go bend the rules of digital reality!** 🎨✨

---

_For more information about Matrix development, see [DEV_README.md](DEV_README.md)_
