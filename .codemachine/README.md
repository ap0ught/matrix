# CodeMachine-CLI Configuration for Matrix Digital Rain

_"Welcome to the real world."_ - Morpheus

This directory contains example configurations and workflows for integrating [CodeMachine-CLI](https://github.com/moazbuilds/CodeMachine-CLI) with the Matrix Digital Rain project.

## 📁 Directory Structure

```
.codemachine/
├── README.md                          # This file
├── config.example.yml                 # Example project configuration
├── workflows/
│   └── create-variant.example.yml     # Example workflow for creating variants
└── agents/
    └── (custom agent configurations)
```

## 🚀 Quick Start

### 1. Set Up Configuration

```bash
# Copy example config to active config
cp .codemachine/config.example.yml .codemachine/config.yml

# Edit with your preferences
vim .codemachine/config.yml
```

### 2. Install CodeMachine-CLI

```bash
# Install globally
npm install -g codemachine-cli

# Verify installation
codemachine --version
```

### 3. Run Your First Workflow

```bash
# Create a new Matrix variant
codemachine workflow run create-variant \
  --variant-name "cyber-ocean" \
  --theme-description "Deep underwater cyberpunk with blue-green bioluminescence" \
  --base-version classic

# Output: Complete variant with config, tests, and documentation!
```

## 📋 Available Example Workflows

### `create-variant.example.yml`

Multi-agent workflow that creates a complete Matrix variant from a description:

- **Agents Used**: Color Designer, Config Writer, Tester, Documenter
- **Time**: ~3-5 minutes
- **Outputs**: Updated config, tests, documentation

**Example Usage**:
```bash
codemachine workflow run workflows/create-variant.example \
  --variant-name "neon-sunset" \
  --theme-description "Warm sunset colors with pink and orange tones"
```

## 🤖 Configured Agents

The example configuration includes four specialized agents:

### `shader-expert`
- **Purpose**: WebGL/WGPU shader development
- **Model**: Claude-3-Opus
- **Specialization**: GLSL/WGSL code generation, optimization

### `webgl-specialist`
- **Purpose**: Cross-browser compatibility validation
- **Model**: GPT-4-Turbo
- **Specialization**: WebGL debugging, performance analysis

### `asset-optimizer`
- **Purpose**: Font and texture pipeline automation
- **Model**: Claude-3-Sonnet
- **Specialization**: MSDF generation, asset optimization

### `matrix-lore-keeper`
- **Purpose**: Documentation with Matrix theming
- **Model**: Claude-3-Opus
- **Specialization**: Technical writing, Matrix references

## 🎯 Creating Custom Workflows

### Basic Workflow Template

```yaml
name: My Custom Workflow
description: What this workflow does
version: 1.0.0

inputs:
  - name: input_param
    type: string
    required: true

agents:
  my_agent:
    role: what_it_does
    agent: shader-expert
    temperature: 0.3

steps:
  - name: do_something
    agent: my_agent
    description: What this step does

outputs:
  result: path/to/output.js
```

### Example: Shader Generation Workflow

```yaml
name: Generate Shader
description: Create optimized shader from description

inputs:
  - name: shader_description
    type: string
    required: true
  - name: renderer
    type: string
    default: webgl
    options: [webgl, webgpu]

agents:
  shader_generator:
    agent: shader-expert
    temperature: 0.3

steps:
  - name: generate_code
    agent: shader_generator
    prompt: |
      Create a {{renderer}} shader:
      {{shader_description}}
      
      Requirements:
      - Optimized for 60 FPS
      - Mobile-friendly
      - Matrix-themed comments

outputs:
  shader_file: shaders/generated/{{shader_name}}.glsl
```

## 📚 Configuration Options

### Agent Configuration

```yaml
agents:
  custom_agent:
    model: claude-3-opus        # AI model to use
    temperature: 0.3            # Creativity level (0-1)
    max_tokens: 4000            # Response length limit
    context: |
      Instructions for the agent
      What it should know
      How it should behave
```

### Quality Standards

```yaml
quality:
  code_style: prettier
  prettier_config:
    use_tabs: true
    print_width: 160
  test_threshold: 0.95
  performance_baseline:
    fps_min: 60
    memory_limit_mb: 512
```

### Matrix-Specific Settings

```yaml
matrix_project:
  default_version: classic
  test_versions:
    - classic
    - 3d
    - resurrections
  performance_configs:
    - name: desktop-high
      resolution: 1.0
      fps: 60
    - name: mobile-optimized
      resolution: 0.5
      fps: 30
```

## 🧪 Testing Workflows

### Validate Configuration

```bash
# Check config syntax
codemachine config validate

# Test workflow without execution
codemachine workflow validate workflows/create-variant.example.yml

# Dry run (simulate execution)
codemachine workflow run create-variant --dry-run
```

### Debug Mode

```bash
# Enable verbose logging
export CODEMACHINE_DEBUG=verbose

# Trace agent communication
codemachine --trace workflow run create-variant
```

## 🎨 Best Practices

### Workflow Design

1. **Single Responsibility**: Each workflow should do one thing well
2. **Clear Inputs**: Document all required parameters
3. **Validation**: Add input validation for robustness
4. **Error Handling**: Include failure conditions
5. **Documentation**: Explain what, why, and how

### Agent Selection

- **Creative Tasks** (0.6-0.8 temperature): Color design, documentation
- **Technical Tasks** (0.2-0.4 temperature): Code generation, configuration
- **Validation** (0.1-0.3 temperature): Testing, quality checks

### Matrix Theming

Always maintain the Matrix aesthetic:
- Use Matrix quotes in documentation
- Reference characters and concepts naturally
- Add 🤖💚 emojis to success messages
- Keep the cyberpunk/digital rain vibe

## 🔗 Resources

### Documentation
- [CLI_INTEGRATION.md](../CLI_INTEGRATION.md) - Comprehensive integration guide
- [CLI_SETUP.md](../CLI_SETUP.md) - Installation and usage instructions
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contributing guidelines

### External Links
- [CodeMachine-CLI Repository](https://github.com/moazbuilds/CodeMachine-CLI)
- [Matrix Development Guide](../DEV_README.md)
- [Main README](../README.md)

## 💡 Example Use Cases

### 1. Rapid Prototyping
Generate multiple variant ideas in minutes to explore themes.

### 2. Shader Development
Create and test shaders without manual coding iterations.

### 3. Release Automation
Automate version bumping, testing, and documentation.

### 4. Quality Assurance
Run comprehensive test suites before every commit.

### 5. Documentation Sync
Keep docs automatically updated with code changes.

## 🎬 Success Stories

_"I created 5 Matrix variants in an afternoon that used to take weeks. The AI agents understand the aesthetic and generate production-quality code."_

_"Shader development is now my favorite part. I describe what I want, and CodeMachine generates optimized GLSL that just works."_

_"As a designer with limited coding experience, CodeMachine lets me contribute variants without deep WebGL knowledge."_

## 🚀 Next Steps

1. **Copy example config**: `cp config.example.yml config.yml`
2. **Customize settings**: Edit agent models and quality thresholds
3. **Try a workflow**: Run the variant creation example
4. **Create your own**: Design custom workflows for your needs
5. **Share back**: Contribute your workflows to the community!

---

_"You're here because you know something. What you know you can't explain, but you feel it. You've felt it your entire life, that there's something wrong with the world. You don't know what it is, but it's there, like a splinter in your mind, driving you mad."_ - Morpheus

**CodeMachine-CLI is here to remove that splinter from your development process.** 🤖💊

Welcome to automated Matrix development! ✨🎨
