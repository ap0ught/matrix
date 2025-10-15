# Contributing to Matrix Digital Rain

_"You have to let it all go, Neo. Fear, doubt, and disbelief. Free your mind."_ - Morpheus

Thank you for your interest in contributing to the Matrix Digital Rain project! This document provides guidelines for contributing code, documentation, and CLI workflows.

## 🎯 Ways to Contribute

### 1. Code Contributions

- **Shader Development**: Create new visual effects and rendering techniques
- **Performance Optimization**: Improve frame rates and reduce resource usage
- **Browser Compatibility**: Ensure the effect works across all platforms
- **New Features**: Add new Matrix versions, effects, or customization options

### 2. Documentation

- **User Guides**: Help users understand customization options
- **Developer Documentation**: Explain architecture and implementation details
- **Tutorials**: Create step-by-step guides for common tasks
- **Code Comments**: Add Matrix-themed explanations to complex code

### 3. CLI Workflows (CodeMachine-CLI)

- **Workflow Templates**: Create reusable multi-agent workflows
- **Custom Agents**: Develop specialized AI agents for Matrix development
- **Automation Scripts**: Build tools that streamline development tasks
- **Integration Examples**: Show how to use CodeMachine-CLI with the Matrix

## 🚀 Getting Started

### Development Setup

```bash
# Clone the repository with submodules
git clone --recursive https://github.com/ap0ught/matrix.git
cd matrix

# Initialize submodules (if not using --recursive)
git submodule update --init --recursive

# Start a local development server
python3 -m http.server 8000
# or
npx http-server -p 8000

# Open in browser
# http://localhost:8000/?suppressWarnings=true
```

### Making Changes

1. **Fork the repository** on GitHub
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** with clear, focused commits
4. **Test thoroughly** across different Matrix versions and browsers
5. **Format your code**: `npx prettier --write --use-tabs --print-width 160 "js/**/*.js"`
6. **Submit a pull request** with a clear description

## 📋 Code Style Guidelines

### JavaScript

- Use **tabs for indentation** (not spaces)
- Keep lines under **160 characters** where practical
- Use **ES6 module syntax** (import/export)
- Add **Matrix-themed comments** for complex logic
- Follow **existing patterns** in the codebase

```javascript
// ✅ Good: Matrix-themed comment explaining complex logic
// Like Neo bending the spoon, we manipulate the perception of time
// by modulating the sawtooth wave frequency based on animation speed
const modulatedTime = (time * animationSpeed) % 1.0;

// ❌ Bad: Generic comment without context
// Multiply time by speed and modulo
const modulatedTime = (time * animationSpeed) % 1.0;
```

### Shaders (GLSL/WGSL)

- Use **descriptive variable names**
- Add **comments explaining visual effects**
- **Optimize for mobile** devices when possible
- Include **WebGL/WebGPU compatibility** notes

```glsl
// ✅ Good: Explains the visual effect and technique
// "There is no spoon" - the glyph doesn't move, only its illumination changes
// We use MSDF (multi-channel signed distance fields) to render crisp glyphs at any scale
float distance = median(msdfSample.r, msdfSample.g, msdfSample.b);
float alpha = smoothstep(0.5 - fwidth(distance), 0.5 + fwidth(distance), distance);
```

### Documentation

- Use **Markdown** for all documentation
- Include **Matrix movie references** where appropriate
- Add **code examples** for technical concepts
- Keep language **clear and accessible**

## 🧪 Testing Requirements

### Manual Testing

Before submitting a PR, test your changes with:

```bash
# Test default Matrix effect
http://localhost:8000/?suppressWarnings=true

# Test major variants
http://localhost:8000/?version=classic&suppressWarnings=true
http://localhost:8000/?version=3d&suppressWarnings=true
http://localhost:8000/?version=resurrections&suppressWarnings=true

# Test custom effects
http://localhost:8000/?effect=none&suppressWarnings=true
http://localhost:8000/?effect=rainbow&suppressWarnings=true

# Test performance settings
http://localhost:8000/?fps=30&resolution=0.5&suppressWarnings=true
```

### Browser Testing

Test on at least:
- **Chrome/Edge** (latest version)
- **Firefox** (latest version)
- **Safari** (latest version, if available)
- **Mobile browser** (any smartphone)

### Performance Testing

- Monitor FPS in browser DevTools
- Check GPU usage and memory consumption
- Test on lower-end devices when possible
- Verify software rendering fallback works

## 🤖 Contributing CLI Workflows

### Workflow Structure

Create workflows in `.codemachine/workflows/`:

```yaml
# .codemachine/workflows/example-workflow.yml
name: Example Matrix Workflow
description: Brief description of what this workflow does

inputs:
  - name: parameter_name
    type: string
    required: true
    description: What this parameter controls

agents:
  primary_agent:
    role: What this agent does
    model: claude-3-opus
    context: |
      Detailed instructions for the agent
      Include Matrix project-specific context

steps:
  - name: step_name
    agent: primary_agent
    prompt: |
      What the agent should do in this step
      Reference inputs with {{parameter_name}}

outputs:
  result_file: path/to/output.js
  documentation: docs/result.md
```

### Agent Guidelines

When creating custom agents:

1. **Provide clear context** about the Matrix project
2. **Include examples** of desired output
3. **Set appropriate temperature** (0.2-0.3 for code, 0.5-0.7 for creative work)
4. **Use Matrix terminology** to maintain project theme
5. **Test thoroughly** before submitting

### Testing Workflows

```bash
# Test your workflow locally
codemachine workflow run your-workflow --test-mode

# Validate workflow configuration
codemachine workflow validate .codemachine/workflows/your-workflow.yml

# Generate workflow documentation
codemachine workflow docs your-workflow
```

## 📝 Commit Message Guidelines

Use clear, descriptive commit messages:

```bash
# ✅ Good commit messages
git commit -m "Add glitch effect shader for cyberpunk variant"
git commit -m "Optimize bloom pass for mobile devices"
git commit -m "Update CLI integration documentation"
git commit -m "Fix WebGL compatibility issue in Firefox"

# ❌ Bad commit messages
git commit -m "fix bug"
git commit -m "update"
git commit -m "wip"
```

## 🔍 Pull Request Process

### PR Title Format

```
[Type] Brief description of changes

Types:
- Feature: New functionality
- Fix: Bug fixes
- Docs: Documentation updates
- Perf: Performance improvements
- Refactor: Code restructuring
- Test: Testing improvements
- CLI: CodeMachine workflow additions
```

### PR Description Template

```markdown
## Changes
Brief description of what changed and why

## Testing
How the changes were tested:
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Tested classic variant
- [ ] Tested 3D variant
- [ ] Tested on mobile
- [ ] Performance validated

## Screenshots
If visual changes, include before/after screenshots

## Related Issues
Closes #123
Related to #456

## Matrix Quote (Optional)
_"Your mind makes it real."_ - Morpheus
```

### Review Process

1. **Automated checks** must pass (if configured)
2. **Code review** by maintainers
3. **Testing** on various platforms
4. **Documentation** review if docs changed
5. **Merge** when approved

## 🎨 Creating New Matrix Versions

When adding a new Matrix variant:

1. **Choose a meaningful name** that reflects the theme
2. **Create color palette** that evokes the intended mood
3. **Add to `js/config.js`** in the `versions` object
4. **Update README.md** with example link
5. **Add Matrix movie reference** if thematically appropriate
6. **Test thoroughly** across devices

Example configuration:

```javascript
yourvariant: {
	// Brief comment explaining the theme
	font: "matrixcode",
	palette: [
		[0.1, 0.2, 0.5, 0.0],  // Dark blue
		[0.3, 0.5, 0.8, 0.5],  // Medium blue
		[0.5, 0.7, 1.0, 1.0],  // Bright blue
	],
	animationSpeed: 0.8,
	numColumns: 60,
	bloomStrength: 0.6,
},
```

## 🏆 Recognition

Contributors are recognized in:
- GitHub contributors list
- Project documentation (for significant contributions)
- Release notes (for features in releases)

## 📚 Resources

### Project Documentation
- [README.md](README.md) - User guide and customization options
- [DEV_README.md](DEV_README.md) - Developer guide and architecture
- [CLI_INTEGRATION.md](CLI_INTEGRATION.md) - CodeMachine-CLI integration guide
- [CLI_SETUP.md](CLI_SETUP.md) - CLI installation and usage

### External Resources
- [REGL Documentation](https://regl.party/)
- [WebGPU Specification](https://gpuweb.github.io/gpuweb/)
- [MSDF Generator](https://github.com/Chlumsky/msdfgen)
- [Matrix Code Database](https://docs.google.com/spreadsheets/d/1NRJP88EzQlj_ghBbtjkGi-NbluZzlWpAqVIAq1MDGJc)
- [CodeMachine-CLI](https://github.com/moazbuilds/CodeMachine-CLI)

## ❓ Questions?

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and community discussions
- **Pull Request Comments**: For specific code review questions

## 📜 Code of Conduct

### Our Pledge

In the spirit of The Matrix's themes of freedom and choice, we pledge to make participation in our project a harassment-free experience for everyone, regardless of:

- Age, body size, disability, ethnicity
- Gender identity and expression
- Level of experience
- Nationality, personal appearance, race, religion
- Sexual identity and orientation

### Our Standards

**Positive behaviors:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors:**
- Trolling, insulting/derogatory comments, personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Project maintainers are responsible for clarifying standards and will take appropriate action in response to unacceptable behavior.

## 🎬 Final Words

_"I'm trying to free your mind, Neo. But I can only show you the door. You're the one that has to walk through it."_ - Morpheus

Contributing to open source is like taking the red pill - it opens up a whole new world of possibilities. We welcome your contributions and look forward to seeing what you create!

**The Matrix has you. Make it better.** 💚🤖

---

Thank you for contributing to the Matrix Digital Rain! Your code becomes part of the digital reality experienced by thousands of users worldwide. 🌍✨
