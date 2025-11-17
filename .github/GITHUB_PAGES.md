# GitHub Pages Deployment

This document explains how the Matrix Digital Rain project is deployed to GitHub Pages with versioned releases.

## Overview

The project uses GitHub Pages (`gh-pages` branch) to host:

1. **Main site** at the root (`/`) - Always contains the latest code from the master branch
2. **Versioned releases** in version directories (`/vX.Y.Z/`) - Snapshots of specific releases
3. **PR previews** in preview directories (`/pr-XX/`) - Testing environments for pull requests

## Structure

```
gh-pages/
├── index.html              # Main site from latest master
├── js/                     # Latest JavaScript modules
├── lib/                    # Latest libraries
├── assets/                 # Latest assets
├── shaders/                # Latest shaders
├── service-worker.js       # Latest service worker
├── manifest.webmanifest    # Latest PWA manifest
├── icon-*.png              # Latest icons
├── README.md               # gh-pages branch documentation
├── v1.0.0/                 # Release v1.0.0 snapshot
│   ├── index.html
│   ├── js/
│   ├── lib/
│   └── ...
├── v1.1.0/                 # Release v1.1.0 snapshot
│   ├── index.html
│   ├── js/
│   └── ...
├── versions/               # Version archive index page
│   └── index.html
├── pr-42/                  # PR #42 preview
│   ├── index.html
│   └── ...
├── pr-43/                  # PR #43 preview
│   └── ...
└── previews/               # PR previews index page
    └── index.html
```

## Deployment Workflows

### 1. Main Site Deployment (`.github/workflows/gh-pages-deploy.yml`)

**Triggers:**
- Push to `master` branch
- Manual workflow dispatch

**What it does:**
- Deploys the latest master branch to the root of gh-pages
- Preserves version directories (`v*/`) and PR preview directories (`pr-*/`)
- Updates only the main site files at the root level

**Live URL:** https://ap0ught.github.io/matrix/

### 2. Release Deployment (`.github/workflows/release.yml`)

**Triggers:**
- Tag push matching `v*.*.*` pattern
- Manual workflow dispatch with version input

**What it does:**
- Creates a GitHub release with downloadable package
- Deploys the release to a version-specific directory on gh-pages (`/vX.Y.Z/`)
- Updates the version archive index page
- Includes links to the live demo in release notes

**Version URLs:** https://ap0ught.github.io/matrix/vX.Y.Z/

### 3. PR Preview Deployment (`.github/workflows/pr-preview.yml`)

**Triggers:**
- Pull request opened, synchronized, or reopened
- Manual workflow dispatch

**What it does:**
- Deploys PR branch to a preview directory (`/pr-XX/`)
- Does not modify the main site or version directories
- Updates the PR previews index page
- Posts a comment on the PR with preview links

**Preview URLs:** https://ap0ught.github.io/matrix/pr-XX/

## URLs

| Type | URL Pattern | Example |
|------|------------|---------|
| Main Site | `https://ap0ught.github.io/matrix/` | https://ap0ught.github.io/matrix/ |
| Specific Version | `https://ap0ught.github.io/matrix/vX.Y.Z/` | https://ap0ught.github.io/matrix/v1.0.0/ |
| Version Archive | `https://ap0ught.github.io/matrix/versions/` | https://ap0ught.github.io/matrix/versions/ |
| PR Preview | `https://ap0ught.github.io/matrix/pr-XX/` | https://ap0ught.github.io/matrix/pr-42/ |
| PR Previews Index | `https://ap0ught.github.io/matrix/previews/` | https://ap0ught.github.io/matrix/previews/ |

## Creating a Release

### Option 1: Via GitHub UI

1. Go to Actions → Create Release workflow
2. Click "Run workflow"
3. Enter version number (e.g., `1.0.0`)
4. Optionally mark as pre-release
5. Click "Run workflow"

The workflow will:
- Update the VERSION file
- Create a git tag
- Generate a changelog
- Create a GitHub release
- Deploy to gh-pages at `/vX.Y.Z/`

### Option 2: Via Git Tag

```bash
# Update VERSION file
echo "1.0.0" > VERSION
git add VERSION
git commit -m "Release version 1.0.0"

# Create and push tag
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

The release workflow will automatically trigger and deploy to both GitHub Releases and GitHub Pages.

## Version Lifecycle

1. **Development**: Changes are made on feature branches
2. **PR Preview**: PR is created and preview is deployed to `/pr-XX/`
3. **Main Site Update**: PR is merged to master, main site is updated automatically
4. **Release**: Tag is created, release is deployed to `/vX.Y.Z/`

This ensures:
- Users can always access the latest code at the root URL
- Specific versions remain available for testing and documentation
- Each release has a permanent, versioned URL

## Accessing Different Versions

### Latest Version (Main Site)
- Always available at: https://ap0ught.github.io/matrix/
- Updated automatically when master branch changes
- Reflects the current state of the repository

### Specific Versions
- Accessible via: https://ap0ught.github.io/matrix/vX.Y.Z/
- Permanent snapshots - never change after creation
- Useful for:
  - Documentation references
  - Testing specific releases
  - Comparing versions
  - Stable links in articles/blogs

### Browse All Versions
- Version archive: https://ap0ught.github.io/matrix/versions/
- Lists all released versions with links
- Sorted newest to latest
- Includes links to release notes

## Technical Details

### Service Worker Caching

Each deployment includes its own `service-worker.js` with version-specific caching:
- Main site uses VERSION file for cache versioning
- Version directories have locked-in cache versions
- PR previews have their own cache scopes

This ensures each deployment works independently without cache conflicts.

### PWA Manifest

Each deployment has its own `manifest.webmanifest`:
- Main site manifest points to the root URL
- Version directories point to their specific URLs
- This allows installing different versions as separate PWAs

### Permissions

The workflows require these permissions:
- `contents: write` - To push to gh-pages branch and create releases
- `pages: write` - To deploy to GitHub Pages
- `id-token: write` - For GitHub Pages authentication
- `pull-requests: write` - To comment on PRs with preview links

## Maintenance

### Cleaning Old PR Previews

PR preview directories accumulate over time. To clean them:

```bash
git checkout gh-pages
git rm -rf pr-*
git commit -m "Clean old PR previews"
git push origin gh-pages
```

Or selectively remove old previews:

```bash
git checkout gh-pages
git rm -rf pr-42 pr-43  # Remove specific previews
git commit -m "Remove old PR previews"
git push origin gh-pages
```

### Removing Old Versions

If a version needs to be removed (e.g., security issue):

```bash
git checkout gh-pages
git rm -rf v1.0.0
git commit -m "Remove v1.0.0 (security issue)"
git push origin gh-pages
```

Note: This doesn't remove the GitHub Release, only the gh-pages deployment.

## Troubleshooting

### Main site not updating

1. Check the gh-pages-deploy workflow ran successfully
2. Verify master branch changes are committed
3. Check GitHub Pages settings point to gh-pages branch

### Version not deployed

1. Check the release workflow ran successfully
2. Verify the tag matches the `v*.*.*` pattern
3. Check workflow permissions are correct

### PR preview not working

1. Check the pr-preview workflow ran successfully
2. Verify PR is targeting the master branch
3. Look for the bot comment with preview links

### 404 errors on GitHub Pages

1. Check the path exists in gh-pages branch
2. Verify GitHub Pages is enabled in repository settings
3. Allow a few minutes for GitHub Pages to update after push

## Best Practices

1. **Always use semantic versioning** for releases (MAJOR.MINOR.PATCH)
2. **Test releases locally** before pushing tags
3. **Use PR previews** to validate changes before merging
4. **Document breaking changes** in release notes
5. **Keep VERSION file updated** to match latest tag
6. **Clean old PR previews** periodically to save space

## See Also

- [Release Process Documentation](../RELEASE.md)
- [PR Preview Documentation](./PR_PREVIEW.md)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
