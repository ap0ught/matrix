# Looking Glass (Holoplay) integration

This document explains how **Looking Glass** holographic output works in Matrix Digital Rain, what is **first-party** versus **vendored**, and how to develop or review it safely.

## What “Holoplay” means here

**Looking Glass** sells light-field displays that show a 3D “quilt” image: a grid of views the hardware refracts into a single hologram-like picture. On the desktop, **HoloPlay Service** runs locally and exposes a **WebSocket** API. The vendored library talks to that service using **CBOR** messages (device calibration, optional quilt upload/show commands).

This app does **not** embed Looking Glass hardware drivers in the browser. It only:

1. **Reads calibration** (tile counts, aspect, pitch, FOV, etc.) when a display is present and the service responds.
2. **Adjusts the WebGL rain camera** to a multi-view frustum when Holoplay is enabled.
3. **Runs a final quilt composite** shader so the framebuffer layout matches what the display expects.

## How to turn it on

- **URL:** `version=holoplay` selects the preset in [`js/config.js`](js/config.js) (`holoplay` block), which sets `useHoloplay: true`, `renderer: "webgl"`, volumetric rain, and related tuning.
- **WebGPU:** Holoplay is **WebGL-only**. [`js/main.js`](js/main.js) calls `enforceHoloplayRenderer`: if Holoplay is on and the user asked for WebGPU, the app **falls back to WebGL** and logs a warning.

## Code map (first-party)

| Area | Role |
| --- | --- |
| [`js/main.js`](js/main.js) | Forces WebGL when `config.useHoloplay` is true. |
| [`js/webgl/lkgHelper.js`](js/webgl/lkgHelper.js) | Dynamic `import()` of the vendored client; maps service `devices[0]` into rain/quilt uniforms; **recorded device** fallback for dev without hardware. |
| [`js/webgl/rainPass.js`](js/webgl/rainPass.js) | When `lkg.enabled`, builds a perspective matrix from `lkg.fov` and offsets for quilt views. |
| [`js/webgl/quiltPass.js`](js/webgl/quiltPass.js) | Full-screen pass using [`shaders/glsl/quiltPass.frag.glsl`](shaders/glsl/quiltPass.frag.glsl); no-op passthrough when `lkg.enabled` is false. |
| [`js/webgl/main.js`](js/webgl/main.js) | `await getLKG(config.useHoloplay, true)` then inserts `makeQuiltPass` at the end of the pipeline. |

## Vendored third-party: `lib/holoplaycore.module.js`

- **Upstream:** Looking Glass Factory publishes **[`holoplay-core` on npm](https://www.npmjs.com/package/holoplay-core)**. The canonical ES module build is `dist/holoplaycore.module.js` in that package.
- **In-tree copy:** [`lib/holoplaycore.module.js`](lib/holoplaycore.module.js) is a **checked-in** copy (no npm dependency entry for it today). The embedded header reports **`@version 0.0.8`**. The npm package has seen **newer releases** (for example **0.0.11**, published **2024-07-01**, at the time this doc was written). Treat our file as **potentially behind** upstream unless someone has refreshed it from a pinned tarball.
- **License (summary):** The file bundles **MIT** CBOR encode/decode (copyright Patrick Gansterer; see top of file) and Looking Glass Factory code whose header points to **“SEE LICENSE IN LICENSE.md”** in the upstream package — use **[LICENSE.txt in the npm package](https://www.npmjs.com/package/holoplay-core)** / vendor source tree for the full vendor terms.
- **Runtime requirement:** A working **HoloPlay Service** connection is expected for live calibration. If the WebSocket fails, `lkgHelper` can still use the **recorded** calibration object when the second argument to `getLKG` is `true` (as `main.js` does), so the pipeline stays testable without a physical device.

## Supply chain and maintenance

- **Policy:** Third-party rules live in **[DEPENDENCY_POLICY.md](DEPENDENCY_POLICY.md)**; the security/supply-chain table is **[SECURITY.md](SECURITY.md)**.
- **Risk profile:** This is a **small, vendor-specific** SDK with **low churn** compared to general WebGL utilities. It is **not** the same situation as unmaintained generic render libraries: LGF still ships npm releases for `holoplay-core`, but our **vendored snapshot may lag** and should be **replaced deliberately** from a pinned `npm pack holoplay-core@…` (or an equivalent reproducible script) when you intentionally upgrade—never by hand-editing the minified bundle.
- **Looking Glass platform evolution:** LGF’s broader “Core” vs **Bridge** product story may change over time. If official docs recommend a different integration path for new hardware generations, treat **this WebSocket + holoplay-core path** as something to **re-validate** against current LGF documentation before assuming parity on new devices.

## Further reading

- npm: [holoplay-core](https://www.npmjs.com/package/holoplay-core)  
- Historical HoloPlay Core docs (linked from npm): [HoloPlay Core documentation](http://docs.lookingglassfactory.com/HoloPlayCore/)  
- [Looking Glass Factory](https://lookingglassfactory.com/)  

README demo link for the holographic preset: [version=holoplay](https://ap0ught.github.io/matrix?version=holoplay).
