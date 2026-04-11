# Rendering stack

This project uses several browser graphics paths:


| Path                        | Directory                          | Runtime                                                                                                                                                                 | When it runs                                                     |
| --------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **WebGPU**                  | `[js/webgpu/](js/webgpu/)`         | WGSL + WebGPU                                                                                                                                                           | `renderer=webgpu` and `navigator.gpu` is available               |
| **WebGL**                   | `[js/webgl/](js/webgl/)`           | GLSL + WebGL1 (currently via [regl](https://www.npmjs.com/package/regl), copied to `lib/regl.min.js` — **temporary**, see [DEPENDENCY_POLICY.md](DEPENDENCY_POLICY.md)) | Default, or `renderer=webgl`, or legacy `renderer=regl`          |
| **Three.js** (experimental) | `[js/three-rain/](js/three-rain/)` | [three](https://www.npmjs.com/package/three) → `lib/three.module.js`; instanced quads + raster atlas                                                                    | `renderer=three` or preset `**version=mathcode_alphabet_three`** |
| **p5.js** (experimental)    | `[js/p5-rain/](js/p5-rain/)`      | [p5](https://www.npmjs.com/package/p5) → `lib/p5.min.js` (UMD); 2D canvas `text()` columns, mathcode glyph list                                                         | `renderer=p5` or preset **`version=mathcode_p5`**                |


## Strategy

1. **WebGPU-first** for new GPU work and performance-sensitive changes where supported.
2. **WebGL** remains the compatibility path for Safari and older browsers, and for **Looking Glass / Holoplay** output (quilt pass lives only under `js/webgl/`). If `useHoloplay` is enabled, `renderer=webgpu` is ignored and the WebGL stack is used. See **[HOLOPLAY.md](HOLOPLAY.md)** for the Holoplay service client, vendored `holoplay-core` module, and preset behavior.
3. **regl must be removed** from the dependency tree (first-party WebGL or a policy-approved library). Follow [migration_repl.md](migration_repl.md).

**Pipeline details** (passes, MSDF, how Three compares): **[RENDERING_PIPELINE.md](RENDERING_PIPELINE.md)**.

## Dependencies

- `**regl**` — `postinstall` runs [`scripts/vendor-webgl-deps.mjs`](scripts/vendor-webgl-deps.mjs) → `lib/regl.min.js`. Commit when the lockfile changes for static hosting without `node_modules`.
- **`three`** / **`p5`** — optional experimental renderers; [`scripts/vendor-three.mjs`](scripts/vendor-three.mjs) and [`scripts/vendor-p5.mjs`](scripts/vendor-p5.mjs) copy their browser builds into `lib/`. Commit updated `lib/three.module.js` / `lib/p5.min.js` when those dependencies change.

## GLSL (WebGL) notes

- Targets **WebGL 1** + **GLSL ES 1.00** (with extensions such as `OES_standard_derivatives`). Programs are built with **static** `vert`/`frag` strings after `fetch()` so regl never calls `shaderSource` with `undefined`.
- **Uniform precision**: If a `float` uniform appears in **both** vertex and fragment shaders, some drivers require the **same precision qualifier** (e.g. `uniform mediump float glyphHeightToWidth`) in both stages — not only a matching global `precision mediump float` directive.

