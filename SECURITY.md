# Security Policy

## Supported Versions

| Version | Supported |
| ------- | ------------------ |
| latest | :white_check_mark: |

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

This project uses the following dependencies:

| Dependency | Purpose | Location | GitHub | Activity |
|---|---|---|---|---|
| **REGL** | WebGL wrapper for rendering | Bundled locally in `/lib/` | [regl-project/regl](https://github.com/regl-project/regl) | Mature, widely used WebGL wrapper. Core feature development has largely stabilized, but it remains production-ready and receives occasional maintenance updates. |
| **gl-matrix** | High-performance matrix and vector math | Bundled locally in `/lib/` | [toji/gl-matrix](https://github.com/toji/gl-matrix) | Actively maintained and widely adopted for WebGL/WebGPU math. Receives regular releases. The bundled version tracks a stable 3.x release of the library. |
| **@playwright/test** | End-to-end browser testing (dev only) | npm `devDependency` — **not included in production builds** | [microsoft/playwright](https://github.com/microsoft/playwright) | Very actively maintained by Microsoft with frequent releases and an extensive user base. This project pins a recent stable major version in its devDependencies. |

Dependencies are automatically monitored by [Dependabot](.github/dependabot.yml) for security updates.
