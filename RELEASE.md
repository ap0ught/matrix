# Release Process

This document describes how to create releases for the Matrix Digital Rain project.

## Overview

The Matrix Digital Rain project uses two methods for creating releases:

1. **GitHub Actions Workflow** - Automated releases via GitHub Actions
2. **Local Script** - Manual releases using the `create-release.sh` script

## Prerequisites

- Git repository with appropriate permissions
- For GitHub releases: Write access to the repository
- For local releases: Bash shell and `zip` command

## Release Methods

### Method 1: GitHub Actions (Recommended for Official Releases)

GitHub Actions provides an automated way to create releases with proper tagging and GitHub integration.

#### Option A: Manual Trigger via GitHub UI

1. Go to the repository on GitHub
2. Click on "Actions" tab
3. Select "Create Release" workflow
4. Click "Run workflow" button
5. Enter the version number (e.g., `1.0.0`)
6. Optionally mark as pre-release
7. Click "Run workflow"

The workflow will:

- Update the VERSION file
- Create and push a git tag
- Generate a changelog from git history
- Package the web application
- Create a GitHub release with the package

#### Option B: Push a Git Tag

```bash
# Update VERSION file
echo "1.0.0" > VERSION
git add VERSION
git commit -m "Release version 1.0.0"

# Create and push tag
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

The release workflow will automatically trigger and create the release.

### Method 2: Local Release Script

The local script creates a release package without GitHub integration. This is useful for:

- Testing the release process
- Creating distribution packages for other platforms
- Internal releases

#### Usage

```bash
# Make the script executable (first time only)
chmod +x create-release.sh

# Run the script
./create-release.sh
```

The script will:

1. Read the current version from VERSION file
2. Prompt for a new version (or use current)
3. Package the web application files
4. Create a `.zip` archive
5. Generate SHA-256 checksum

#### Output

The script creates:

- `matrix-{version}.zip` - Release package
- `matrix-{version}.zip.sha256` - Checksum file

#### Testing the Release Package

```bash
# Extract the release
unzip matrix-1.0.0.zip -d matrix-test

# Start a server
cd matrix-test
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```

## Release Package Contents

Each release includes:

```
matrix-{version}.zip
├── index.html           # Main HTML entry point
├── README.md            # User documentation
├── LICENSE              # Project license
├── VERSION              # Version number
├── js/                  # JavaScript modules
│   ├── main.js
│   ├── config.js
│   ├── regl/           # WebGL renderer
│   └── webgpu/         # WebGPU renderer
├── lib/                 # Third-party libraries
│   ├── regl.min.js
│   └── gl-matrix.js
├── assets/              # Fonts and textures
│   └── *_msdf.png
└── shaders/             # GLSL and WGSL shaders
    ├── glsl/
    └── wgsl/
```

## Version Numbering

The project uses [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API changes or major feature overhauls
- **MINOR**: New features in a backward-compatible manner
- **PATCH**: Backward-compatible bug fixes

Examples:

- `1.0.0` - First stable release
- `1.1.0` - New Matrix version added
- `1.1.1` - Bug fix for shader rendering

## Workflow Details

### GitHub Actions Workflow

The release workflow (`.github/workflows/release.yml`) performs:

1. **Version Determination**
   - Manual: Uses input version
   - Tag push: Extracts from tag name

2. **Changelog Generation**
   - Lists commits since previous tag
   - Includes installation instructions

3. **Package Creation**
   - Copies web application files
   - Creates `.zip` archive
   - Generates SHA-256 checksum

4. **Release Publication**
   - Creates GitHub release
   - Uploads package and checksum
   - Adds changelog as release notes

### Local Script

The `create-release.sh` script:

1. Reads current VERSION file
2. Prompts for new version
3. Updates VERSION file
4. Packages application files
5. Creates archive and checksum
6. Displays installation instructions

## Troubleshooting

### Workflow Fails on Tag Push

**Problem**: Workflow fails when pushing a tag

**Solution**: Ensure the VERSION file matches the tag version, or let the workflow update it

### Local Script Missing Commands

**Problem**: `zip` or `sha256sum` not found

**Solutions**:

- Install zip: `sudo apt-get install zip` (Ubuntu/Debian)
- macOS uses `shasum -a 256` automatically
- Windows: Use Git Bash or WSL

### Release Package Too Large

**Problem**: Archive is unexpectedly large

**Solution**: Check for unwanted files:

```bash
# Ensure .gitignore excludes build artifacts
git status --ignored
```

## Best Practices

1. **Test before releasing**
   - Run the local script first
   - Test the extracted package
   - Verify all features work

2. **Write clear release notes**
   - Describe major changes
   - List new features
   - Document breaking changes

3. **Use semantic versioning**
   - Follow MAJOR.MINOR.PATCH format
   - Be consistent with version increments

4. **Verify checksums**
   - Always include SHA-256 checksums
   - Document checksum verification in release notes

## GitHub Release Badge

The README includes a release badge that automatically displays the latest version:

```markdown
[![Latest release](https://img.shields.io/github/v/release/ap0ught/matrix)](https://github.com/ap0ught/matrix/releases/latest)
```

This badge updates automatically when new releases are created.

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [Git Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
