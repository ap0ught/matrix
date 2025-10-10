# PR Preview Deployment

This repository has automated PR preview deployments set up via GitHub Actions.

## How It Works

When a Pull Request is created or updated:

1. The PR Preview workflow automatically deploys the PR branch to GitHub Pages
2. Each PR gets its own subdirectory: `https://ap0ught.github.io/matrix/pr-{number}/`
3. A comment is posted on the PR with links to test the preview
4. The preview is automatically updated when new commits are pushed

## Manual Deployment

You can also manually trigger a preview deployment:

1. Go to the Actions tab
2. Select "PR Preview Deployment"
3. Click "Run workflow"
4. Select the branch you want to deploy

## Preview URLs

After deployment, you can access your PR preview at:

- **Main preview:** `https://ap0ught.github.io/matrix/pr-{number}/`
- **With options:** `https://ap0ught.github.io/matrix/pr-{number}/?suppressWarnings=true`

### Test Links

The automated PR comment includes convenient test links for different Matrix versions:

- Default Matrix effect
- Mirror mode with mouse interaction
- 3D volumetric mode
- Resurrections version

## Cleanup

PR previews remain on GitHub Pages until manually removed. To clean up old previews:

1. Check out the `gh-pages` branch
2. Remove the `pr-{number}` directory
3. Commit and push

## Requirements

- GitHub Pages must be enabled for the repository
- The workflow requires these permissions:
  - `contents: write` - to push to gh-pages branch
  - `pages: write` - to deploy to GitHub Pages
  - `pull-requests: write` - to comment on PRs

## Technical Details

- **Workflow file:** `.github/workflows/pr-preview.yml`
- **Deployment branch:** `gh-pages`
- **Directory structure:** Each PR gets its own subdirectory
- **Files deployed:** `index.html`, `js/`, `lib/`, `assets/`, `shaders/`, `service-worker.js`, `manifest.webmanifest`, `icon-*.png`

### Path Handling

The application uses relative paths for all resources to support deployment in subdirectories:
- Icon and manifest references in `index.html` use relative paths (e.g., `icon-192.png` instead of `/icon-192.png`)
- Service worker registration uses a relative path
- The service worker automatically detects its base path using `self.location.pathname`
- All cached assets are resolved relative to the service worker's location

## Limitations

- This is a static site deployment - no server-side processing
- Previews don't require any build step (keeping with the project's philosophy)
- Each preview is a complete copy of the web application

## Local Testing Alternative

If you prefer to test locally instead of using the preview:

```bash
# Clone and checkout the PR branch
git fetch origin pull/{PR_NUMBER}/head:pr-{PR_NUMBER}
git checkout pr-{PR_NUMBER}

# Start a local server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000/?suppressWarnings=true
```
