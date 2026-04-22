# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in the Matrix Digital Rain project, please report it responsibly.

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, please report security vulnerabilities by:

1. Opening a [GitHub Security Advisory](https://github.com/ap0ught/matrix/security/advisories/new) (preferred)
2. Or emailing the repository maintainer directly

Please include the following information in your report:

- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- Any proof-of-concept code (if applicable)
- Suggested fix (if you have one)

## Security Considerations

### Client-Side Application

Matrix Digital Rain is a purely client-side web application with no server-side components. This means:

- No user data is transmitted to any server (except optional Spotify API integration)
- No authentication is required to use the application
- All processing happens in the browser

### Spotify Integration

The optional Spotify integration uses the OAuth 2.0 Authorization Code flow:

- Access tokens are stored in `localStorage` for persistence between sessions
- The OAuth `state` parameter uses a cryptographically random value (via `crypto.getRandomValues`) to prevent CSRF attacks
- No client secrets are stored in the codebase - the Spotify client ID is provided by the user

### Content Security

- The application uses WebGL/WebGPU for rendering, which is sandboxed by the browser
- No user-provided content is rendered as HTML without sanitization
- URL parameters are validated and parsed through a typed configuration system

## Dependencies

See **[DEPENDENCY_POLICY.md](DEPENDENCY_POLICY.md)** for what may be added or vendored. Supply-chain table:

| Dependency           | Purpose                                   | Location                                                                                                        | GitHub                                                          | Activity / notes                                                                                                                                                                          |
| -------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **regl** (npm)       | WebGL command wrapper used by `js/webgl/` | Pinned in `package.json`; `postinstall` copies `dist/regl.min.js` to `lib/` via `scripts/vendor-webgl-deps.mjs` | [regl-project/regl](https://github.com/regl-project/regl)       | **Exception:** upstream is effectively unmaintained. **Removal is required** per [migration_repl.md](migration_repl.md); tracked explicitly so it is not mistaken for a long-term choice. |
| **three** (npm)    | Experimental `js/three-rain/` demo (mathcode + alphabet columns) | Pinned in `package.json`; `postinstall` copies `build/three.module.js` to `lib/` via `scripts/vendor-three.mjs` | [mrdoob/three.js](https://github.com/mrdoob/three.js) | Actively maintained. Used only when `renderer=three` or `version=mathcode_alphabet_three`. Not feature-parity with main rain — see [RENDERING_PIPELINE.md](RENDERING_PIPELINE.md). |
| **p5** (npm)       | Experimental `js/p5-rain/` mathcode demo (2D `text()` rain)       | Pinned in `package.json`; `postinstall` copies `lib/p5.min.js` via `scripts/vendor-p5.mjs`                       | [processing/p5.js](https://github.com/processing/p5.js) | Actively maintained by the Processing Foundation. **LGPL-2.1** (see package `license.txt`). Used only when `renderer=p5` or `version=mathcode_p5`. See [RENDERING_PIPELINE.md](RENDERING_PIPELINE.md). |
| **holoplay-core** (vendored) | WebSocket client to HoloPlay Service for Looking Glass calibration / quilt flow | Checked in as [`lib/holoplaycore.module.js`](lib/holoplaycore.module.js) (not an npm `dependency` today); loaded from [`js/webgl/lkgHelper.js`](js/webgl/lkgHelper.js) | [holoplay-core (npm)](https://www.npmjs.com/package/holoplay-core) | Vendor SDK: LGF-owned; npm still receives occasional releases. In-tree copy may lag npm (header shows **0.0.8**; verify against latest on npm when upgrading). License: see upstream **LICENSE.txt**; file also contains **MIT** CBOR. Details: [HOLOPLAY.md](HOLOPLAY.md). |
| **gl-matrix**        | High-performance matrix and vector math   | Bundled locally in `/lib/`                                                                                      | [toji/gl-matrix](https://github.com/toji/gl-matrix)             | Actively maintained and widely adopted for WebGL/WebGPU math. Receives regular releases. The bundled version tracks a stable 3.x release of the library.                                  |
| **@playwright/test** | End-to-end browser testing (dev only)     | npm `devDependency` — **not included in production builds**                                                     | [microsoft/playwright](https://github.com/microsoft/playwright) | Very actively maintained by Microsoft with frequent releases and an extensive user base. This project pins a recent stable major version in its devDependencies.                          |

Dependencies are automatically monitored by [Dependabot](.github/dependabot.yml) for security updates.
