# Rendering stack

This project uses two browser graphics paths:

| Path | Directory | Runtime | When it runs |
|------|-----------|---------|----------------|
| **WebGPU** | [`js/webgpu/`](js/webgpu/) | WGSL + WebGPU | `renderer=webgpu` and `navigator.gpu` is available |
| **WebGL** | [`js/webgl/`](js/webgl/) | GLSL + WebGL1 (via [regl](https://www.npmjs.com/package/regl) from npm, copied to `lib/regl.min.js`) | Default, or `renderer=webgl`, or legacy `renderer=regl` |

## Strategy

1. **WebGPU-first** for new GPU work and performance-sensitive changes where supported.
2. **WebGL** remains the compatibility path for Safari and older browsers, and for **Looking Glass / Holoplay** output (quilt pass lives only under `js/webgl/`). If `useHoloplay` is enabled, `renderer=webgpu` is ignored and the WebGL stack is used.
3. **twgl** is vendored to [`lib/twgl-full.module.js`](lib/twgl-full.module.js) for future WebGL utilities and incremental migration away from regl’s API where practical.

## Dependencies

- `regl` and `twgl` are **npm dependencies**; `npm install` / `npm ci` runs [`scripts/vendor-webgl-deps.mjs`](scripts/vendor-webgl-deps.mjs) to refresh files under `lib/`. Commit updated `lib/regl.min.js` when the lockfile changes so static hosts without `node_modules` stay consistent.

## GLSL (WebGL) notes

- Targets **WebGL 1** + **GLSL ES 1.00** (with extensions such as `OES_standard_derivatives`). Programs are built with **static** `vert`/`frag` strings after `fetch()` so regl never calls `shaderSource` with `undefined`.
- **Uniform precision**: If a `float` uniform appears in **both** vertex and fragment shaders, some drivers require the **same precision qualifier** (e.g. `uniform mediump float glyphHeightToWidth`) in both stages — not only a matching global `precision mediump float` directive.
