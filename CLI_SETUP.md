# ⚙️ Matrix CLI Setup & Quick Start Guide

_"I know kung fu."_ - Neo  
_"Show me."_ - Morpheus

This guide will help you set up and use CLI tools to supercharge your Matrix development workflow.

## 🎯 Quick Start (5 Minutes)

### Prerequisites

- Node.js 18+ (for CodeMachine-CLI)
- Python 3.8+ (for local HTTP server)
- Git (for version control)
- A modern terminal (bash, zsh, or similar)

### Installation

```bash
# 1. Clone the repository (if you haven't already)
git clone --recursive https://github.com/ap0ught/matrix.git
cd matrix

# 2. Install CodeMachine-CLI globally (when available)
npm install -g codemachine-cli

# 3. Initialize CodeMachine in the project
codemachine init

# 4. Install Matrix-specific workflows
codemachine workflows install matrix-digital-rain

# 5. Verify installation
codemachine --version
codemachine workflows list
```

### Your First CLI Command

```bash
# Generate a new Matrix color variant in seconds
codemachine generate variant \
  --name "ocean-blue" \
  --description "Deep ocean blue Matrix rain with slower, meditative animation" \
  --auto-test

# Output:
# ✅ Variant 'ocean-blue' created successfully
# 📁 Configuration: js/config.js (updated)
# 🎨 Color palette: [0.0, 0.3, 0.6], [0.1, 0.5, 0.9], [0.2, 0.7, 1.0]
# 🔗 Test URL: http://localhost:8000/?version=ocean-blue&suppressWarnings=true
```

## 🛠️ Core CLI Commands

### Shader Development

```bash
# Create a new shader from description
codemachine shader create \
  --name "ripple-effect" \
  --description "Add circular ripple effects when mouse clicks" \
  --renderer webgl \
  --test

# Test existing shader across all Matrix versions
codemachine shader test \
  --file shaders/custom-bloom.glsl \
  --versions all \
  --output-report

# Optimize shader performance
codemachine shader optimize \
  --file shaders/rain-pass.glsl \
  --target mobile \
  --preserve-quality
```

### Font & Asset Management

```bash
# Generate MSDF texture from SVG
codemachine font generate \
  --source "svg sources/new-glyphs.svg" \
  --output assets/new-glyphs-msdf.png \
  --size 512 \
  --auto-configure

# Optimize all assets for web delivery
codemachine assets optimize \
  --input assets/ \
  --output assets-optimized/ \
  --formats png,webp

# Validate asset integrity
codemachine assets validate \
  --check-references \
  --check-sizes \
  --report
```

### Testing & Validation

```bash
# Run comprehensive test suite
codemachine test all \
  --visual-regression \
  --performance \
  --cross-browser

# Visual regression testing only
codemachine test visual \
  --baseline screenshots/baseline/ \
  --output screenshots/current/ \
  --threshold 0.01

# Performance benchmarking
codemachine test performance \
  --scenarios default,3d,resurrections \
  --metrics fps,memory,gpu \
  --compare-baseline
```

### Release Management

```bash
# Create a new release (interactive)
codemachine release create

# Create specific version type
codemachine release create \
  --type patch \
  --changelog-auto \
  --test-before-release

# Preview release without creating
codemachine release preview \
  --type minor \
  --show-changes
```

### Documentation

```bash
# Update all documentation
codemachine docs update \
  --analyze-code \
  --update-readme \
  --generate-api

# Add code comments to file
codemachine docs comment \
  --file js/config.js \
  --style matrix-theme

# Generate changelog from commits
codemachine docs changelog \
  --since v1.0.0 \
  --format markdown
```

## 🎨 Custom Workflows

### Creating a New Matrix Version

Complete workflow to create a new themed Matrix version:

```bash
# Step 1: Generate variant configuration
codemachine workflow run create-matrix-version \
  --name "cyberpunk2077" \
  --theme "Cyberpunk with neon yellow and pink" \
  --base classic

# This orchestrates multiple agents to:
# 1. Generate color palette from theme description
# 2. Create configuration in js/config.js
# 3. Generate example URLs
# 4. Update documentation
# 5. Create test cases
# 6. Validate visual output

# Step 2: Test the new version
codemachine test variant \
  --version cyberpunk2077 \
  --visual-compare classic

# Step 3: Generate showcase
codemachine showcase create \
  --version cyberpunk2077 \
  --output showcase/cyberpunk2077.html
```

### Shader Development Workflow

```bash
# Complete shader development pipeline
codemachine workflow run shader-dev \
  --spec "Add glitch effect that occasionally corrupts glyphs" \
  --renderer webgl \
  --test-devices desktop,mobile \
  --output shaders/glitch-effect.glsl

# The workflow includes:
# 1. AI generates shader code
# 2. Validates WebGL compatibility
# 3. Tests performance on target devices
# 4. Creates visual comparison screenshots
# 5. Generates usage documentation
# 6. Updates shader registry
```

### Asset Pipeline Automation

```bash
# Process new font from SVG to production-ready
codemachine workflow run font-pipeline \
  --input "svg sources/matrix-neo.svg" \
  --output-name neo-msdf \
  --grid-size 8x8 \
  --sequence-length 64

# Automated pipeline:
# 1. Validates SVG structure
# 2. Builds msdfgen if needed
# 3. Generates MSDF texture
# 4. Optimizes texture size
# 5. Updates config.js
# 6. Creates documentation
# 7. Generates test page
```

## 📋 Configuration

### Project Configuration

Create `.codemachine/config.yml` in the repository root:

```yaml
# Matrix Digital Rain - CodeMachine Configuration
project:
  name: matrix-digital-rain
  type: webgl-visualization
  
agents:
  shader-expert:
    model: claude-3-opus
    temperature: 0.3
    context: |
      - Expert in GLSL and WGSL shader development
      - Understands Matrix digital rain aesthetics
      - Optimizes for performance and visual quality
  
  webgl-specialist:
    model: gpt-4-turbo
    temperature: 0.2
    context: |
      - Validates WebGL/WebGPU compatibility
      - Checks cross-browser support
      - Ensures mobile device performance
  
  matrix-lore-keeper:
    model: claude-3-sonnet
    temperature: 0.7
    context: |
      - Maintains Matrix movie themes and terminology
      - Ensures documentation stays on-brand
      - Adds appropriate Matrix references

workflows:
  default_test_suite:
    - visual_regression
    - performance_benchmark
    - cross_browser_validation
  
  shader_development:
    - specification_analysis
    - code_generation
    - webgl_validation
    - visual_testing
    - documentation

outputs:
  test_reports: tests/reports/
  generated_code: generated/
  screenshots: screenshots/
  documentation: docs/generated/

quality:
  code_style: prettier
  test_threshold: 0.95
  performance_baseline: 60fps
```

### Workflow Templates

Create custom workflows in `.codemachine/workflows/`:

```yaml
# .codemachine/workflows/custom-variant.yml
name: Create Matrix Variant
description: Generate a new Matrix version from high-level description

inputs:
  - name: variant_name
    type: string
    required: true
  - name: theme_description
    type: string
    required: true
  - name: base_version
    type: string
    default: classic

agents:
  color_designer:
    role: Generate color palette from theme
    model: claude-3-opus
  
  config_writer:
    role: Write configuration code
    model: gpt-4-turbo
  
  tester:
    role: Validate the variant works
    model: claude-3-sonnet

steps:
  - name: analyze_theme
    agent: color_designer
    prompt: |
      Create a color palette for Matrix variant: {{theme_description}}
      Consider: mood, atmosphere, film references, technical constraints
      Output: RGB color values and animation parameters
  
  - name: write_config
    agent: config_writer
    input: analyze_theme.output
    prompt: |
      Add variant to js/config.js in versions object
      Base on: {{base_version}}
      Use colors from previous step
      Follow existing code style
  
  - name: test_variant
    agent: tester
    input: write_config.output
    prompt: |
      Test the variant by:
      1. Starting local server
      2. Opening with ?version={{variant_name}}
      3. Checking visual output
      4. Validating performance
  
  - name: document
    agent: config_writer
    input: [analyze_theme.output, write_config.output]
    prompt: |
      Update README.md with new variant:
      - Add to variants list
      - Create example URL
      - Describe the theme

outputs:
  config_file: js/config.js
  documentation: README.md
  test_url: http://localhost:8000/?version={{variant_name}}&suppressWarnings=true
```

## 🎓 Advanced Usage

### Custom Agent Creation

Create specialized agents for Matrix-specific tasks:

```yaml
# .codemachine/agents/matrix-shader-expert.yml
name: Matrix Shader Expert
model: claude-3-opus
temperature: 0.3

system_prompt: |
  You are an expert in creating WebGL shaders specifically for the Matrix
  digital rain effect. You understand:
  
  - GLSL shader language for WebGL 2.0
  - WGSL shader language for WebGPU
  - Multi-channel distance field (MSDF) rendering
  - Bloom and post-processing effects
  - GPU performance optimization
  - Matrix aesthetic and visual style
  
  When creating shaders:
  1. Maintain the iconic Matrix look and feel
  2. Optimize for mobile and desktop performance
  3. Follow the existing shader patterns in /shaders directory
  4. Add helpful comments in Matrix-themed language
  5. Ensure cross-platform compatibility
  
  Use Matrix movie references naturally in comments, like:
  - "There is no spoon" for explaining shader tricks
  - "Follow the white rabbit" for optimization paths
  - "Free your mind" for unconventional solutions

capabilities:
  - shader_generation
  - shader_optimization
  - webgl_debugging
  - visual_quality_analysis
  - performance_profiling

examples:
  - input: "Create bloom shader with adjustable strength"
    output: |
      // shader/bloom.glsl
      // "The answer is out there, Neo, and it's looking for you"
      // This bloom shader enhances the Matrix glow effect
      
      uniform float bloomStrength;
      uniform sampler2D inputTexture;
      // ... shader code ...
```

### Batch Operations

Process multiple files or variants at once:

```bash
# Generate multiple variants from a spec file
codemachine batch generate \
  --spec variants-spec.yml \
  --output-dir generated/variants/

# Test all variants in parallel
codemachine batch test \
  --pattern "generated/variants/*.json" \
  --parallel 4 \
  --output-report

# Optimize all shaders
codemachine batch optimize \
  --input "shaders/*.glsl" \
  --target mobile \
  --output shaders-optimized/
```

### CI/CD Integration

Integrate with GitHub Actions:

```yaml
# .github/workflows/codemachine-tests.yml
name: CodeMachine Validation

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install CodeMachine-CLI
        run: npm install -g codemachine-cli
      
      - name: Run test suite
        run: |
          codemachine test all \
            --visual-regression \
            --performance \
            --output test-results/
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

## 🐛 Troubleshooting

### Common Issues

**Issue**: CodeMachine command not found
```bash
# Solution: Install globally and check PATH
npm install -g codemachine-cli
which codemachine  # Should show install location
export PATH="$PATH:$(npm bin -g)"  # Add to PATH if needed
```

**Issue**: Agent timeout during shader generation
```bash
# Solution: Increase timeout in config
codemachine config set agent.timeout 300
# Or use --timeout flag
codemachine shader create --timeout 300 ...
```

**Issue**: Visual tests failing due to minor differences
```bash
# Solution: Adjust threshold
codemachine test visual --threshold 0.05  # More lenient
# Or update baseline
codemachine test visual --update-baseline
```

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Set debug level
export CODEMACHINE_DEBUG=verbose

# Run command with debug output
codemachine --debug shader create ...

# View agent communication
codemachine --trace shader create ...
```

## 📖 Learning Resources

### Tutorials

1. **Getting Started**: Basic CLI usage (10 minutes)
2. **Shader Development**: AI-assisted shader creation (20 minutes)
3. **Custom Workflows**: Building your own workflows (30 minutes)
4. **Advanced Agents**: Creating specialized agents (45 minutes)

### Example Projects

Check out `examples/codemachine/` directory for:
- Sample workflow configurations
- Custom agent definitions
- Batch processing scripts
- CI/CD integration examples

### Community Resources

- [CodeMachine-CLI Documentation](https://github.com/moazbuilds/CodeMachine-CLI)
- [Matrix Development Discord](https://discord.gg/matrix-dev) (hypothetical)
- [Video Tutorials (placeholder)](https://youtube.com/matrix-cli-tutorials) — example only, not a real resource

## 🎉 Success Stories

_"I used to spend hours tweaking shader parameters. With CodeMachine, I describe what I want and get working code in minutes. It's like having The Oracle guide my development."_ - Neo (probably)

_"The multi-agent testing workflow caught performance issues I would have missed. My Matrix variants now run smoothly on everything from phones to 4K displays."_ - Trinity (maybe)

_"I'm not a shader expert, but CodeMachine helped me create custom effects that look professional. It explains the code as it generates, so I'm learning while I build."_ - Morpheus (citation needed)

## 🚀 Next Steps

1. **Try the Quick Start**: Get your first AI-generated variant running
2. **Explore Workflows**: Test the pre-built Matrix workflows
3. **Customize**: Create your own agents and workflows
4. **Share**: Contribute your workflows back to the community

---

_"You've felt it your entire life... that there's something wrong with manual development. You don't know what it is, but it's there, like a splinter in your mind."_

**CodeMachine-CLI is here to pull that splinter out.** 🤖💊

The machines are friendly. Welcome to automated Matrix development! ✨
