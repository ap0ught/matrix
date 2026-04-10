# Migration guide: removing **regl** from the WebGL stack

> **Note on the filename:** This file is named `migration_repl.md` as requested. The subject is **[regl](https://github.com/regl-project/regl)** — the WebGL helper library used under `js/webgl/`, not a language “REPL”.

This document describes **exactly what must change**, **which Matrix modes and effects are impacted**, and a **practical order of work** to replace regl with **first-party WebGL** (raw `WebGLRenderingContext`) or another dependency that satisfies [DEPENDENCY_POLICY.md](DEPENDENCY_POLICY.md). The unused **twgl** package has been removed from the repo.

---

## 1. Why this migration exists

regl is **effectively unmaintained** (last meaningful releases years ago). Staying on it risks:

- No fixes for new browser regressions or WebGL quirks.
- Security / supply-chain policy blocks in some orgs.
- Harder onboarding: fewer examples match current APIs.

The cost is **you own the full WebGL layer** that regl currently abstracts.

---

## 2. What regl does today (surface you must reimplement)

In `js/webgl/main.js` and passes, regl provides:

| Concern              | regl usage today                                               | After removal                                                                                                   |
| -------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Context + extensions | `createREGL({ canvas, extensions, optionalExtensions })`       | `canvas.getContext("webgl")` or `"webgl2"` + manual `getExtension` / feature detection                          |
| Programs             | `regl({ vert, frag, uniforms, attributes, framebuffer, ... })` | `createProgram`, `attachShader`, `linkProgram`, `useProgram`, `getUniformLocation`, `vertexAttribPointer`, etc. |
| Textures             | `regl.texture(...)`, subimage updates                          | `createTexture`, `texImage2D` / `texSubImage2D`, format/type rules                                              |
| Framebuffers         | `regl.framebuffer({ color: [...] })`                           | `createFramebuffer`, `framebufferTexture2D`, completeness checks                                                |
| Draw loop            | `regl.frame(callback)`, `regl.now()`                           | `requestAnimationFrame`, `performance.now()`                                                                    |
| State                | Blending, depth, viewport inside `regl({ ... })`               | Explicit `gl.enable` / `blendFunc` / `viewport` / VAOs if you adopt them                                        |
| Context loss         | regl helps with some lifecycle patterns                        | Listen for `webglcontextlost` / `webglcontextrestored` and rebuild resources                                    |

**Important:** Shaders stay **GLSL ES 1.00** if you keep **WebGL 1**. Moving to **WebGL 2** implies **GLSL ES 3.00** (`#version 300 es`) — a **separate, larger** shader port (every `.glsl` under `shaders/glsl/` used by WebGL).

---

## 3. Replacement strategies (pick one before coding)

### Option A — **WebGL 1 + raw GL** (smallest shader diff)

- Keep existing `shaders/glsl/*.glsl` as GLSL ES 1.00.
- Replace regl calls with hand-written passes (or a **new** maintained helper library that passes the dependency policy — do not reintroduce unmaintained vendors “just for buffers”).
- **Pros:** Less shader churn. **Cons:** Most typing; framebuffer/half-float edge cases are yours.

### Option B — **WebGL 2 + GLSL 300 es** (modern, more work)

- `getContext("webgl2")`, rewrite shaders to `#version 300 es`, replace `texture2D` → `texture`, varyings → `in`/`out`, etc.
- **Pros:** Better features (multiple render targets, cleaner integer paths). **Cons:** Largest change set; retest every mode/effect.

### Option C — **Another maintained wrapper** (luma.gl, PicoGL, etc.)

- Still a **full API migration** from regl’s declarative style to that library’s model.
- **Pros:** Community maintenance. **Cons:** New dependency, learning curve, same pass-by-pass port.

**Recommendation for this repo:** **Option A** first (drop regl, keep WebGL1 + current GLSL), then optionally a follow-up project to WebGL2.

---

## 4. What is **not** affected by removing regl

| Area                                                       | Reason                                                                                                                           |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **`js/webgpu/`**                                           | Separate renderer; no regl.                                                                                                      |
| **`js/main.js`** URL routing, mode manager, gallery **UI** | Still runs; only the **rain WebGL module** import path changes if you rename entry files.                                        |
| **`js/config.js`** `versions` / effects list               | Data only; unchanged unless you add renderer flags.                                                                              |
| **PWA shell**                                              | `index.html`, `service-worker.js`, `manifest` — unchanged except **stop shipping `lib/regl.min.js`** and update `STATIC_ASSETS`. |
| **`npm` postinstall**                                      | Edit `scripts/vendor-webgl-deps.mjs` and `package.json` to drop regl.                                                            |

---

## 5. What **is** affected — “modes” (Matrix **versions**)

Any URL or default that ends up on **`renderer=webgl`** (default) or **`renderer=regl`** (legacy alias → webgl in `parseRenderer`) runs **`js/webgl/main.js`**. So **every Matrix version** in `js/config.js` `versions` (including aliases) is affected **when that session uses WebGL**.

### 5.1 Primary `versions` keys (literal entries)

These are the object keys defined in `export const versions { ... }`:

- `classic`
- `megacity`
- `neomatrixology`
- `operator`
- `nightmare`
- `paradise`
- `resurrections`
- `trinity`
- `morpheus`
- `bugs`
- `palimpsest`
- `twilight`
- `holoplay`
- **`3d`** (URL: `version=3d` — key is the string `3d` in code)
- `mathcode`
- `alphabet`

### 5.2 Alias keys (same config, different URL)

Assigned after the object literal:

| URL / key   | Resolves to     |
| ----------- | --------------- |
| `throwback` | `operator`      |
| `updated`   | `resurrections` |
| `1999`      | `operator`      |
| `2003`      | `classic`       |
| `2021`      | `resurrections` |

**None** of these change behavior for migration planning — they all still execute the **WebGL pipeline** when WebGL is selected.

### 5.3 Special cases inside versions

- **`holoplay`**: Forces **WebGL** (Looking Glass quilt path in `makeQuiltPass` + `lkgHelper`). Highest integration risk; test hardware or LKG stubs last. Product and vendor context: **[HOLOPLAY.md](HOLOPLAY.md)**.
- **`trinity` / `morpheus` / `bugs` / `holoplay` / `3d`**: **`volumetric: true`** — extra load on rain vertex shader and camera uniforms; regression-test carefully.
- **`nightmare` / `paradise` / `operator`**: Ripples / polar / box effects — stresses `rainPass.effect.frag.glsl` and uniforms.

`EXCLUDED_VERSIONS` only contains `excludeME` (not a user-facing mode).

---

## 6. What is affected — **effects** (post-process passes)

From `getAvailableEffects()` and `js/effects.js` **WebGL** mapping (`createEffectsMapping("webgl", ...)`):

| Effect                                            | WebGL pass module                                               | regl today                                      |
| ------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| `none`                                            | No extra pass (debug-style rain output)                         | rain + bloom + quilt only                       |
| `plain`, `palette`                                | `palettePass.js`                                                | yes                                             |
| `customStripes`, `stripes`, `rainbow`, `spectrum` | `stripePass.js`                                                 | yes                                             |
| `image`                                           | `imagePass.js`                                                  | yes                                             |
| `mirror`                                          | `mirrorPass.js` (+ camera texture)                              | yes                                             |
| `gallery`                                         | **Not** in WebGL pipeline — `main.js` short-circuits to gallery | **unaffected** by regl removal in the rain path |

**Pipeline order** (from `js/webgl/main.js`):  
`makeRain` → `makeBloomPass` → **effect pass** (`palette` / `stripe` / `image` / `mirror`) → `makeQuiltPass` → fullscreen blit to canvas.

Every stage that calls `regl({...})` must be rewritten.

---

## 7. Files that **must** be touched (regl-specific)

| File                                                             | Role                                                                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `js/webgl/main.js`                                               | `loadJS("lib/regl.min.js")`, `createREGL`, `regl.frame`, `regl.texture`, pipeline glue                                          |
| `js/webgl/utils.js`                                              | `makePassTexture`, `makePassFBO`, `makeDoubleBuffer`, `loadImage`, `loadText`, `makeFullScreenQuad`, helpers used by all passes |
| `js/webgl/rainPass.js`                                           | Largest: many `regl({})` programs, FBOs, draw order                                                                             |
| `js/webgl/bloomPass.js`                                          | Multi-stage FBO + regl draws                                                                                                    |
| `js/webgl/palettePass.js`                                        | Fullscreen quad pass                                                                                                            |
| `js/webgl/stripePass.js`                                         | Fullscreen quad pass                                                                                                            |
| `js/webgl/imagePass.js`                                          | Fullscreen quad + texture                                                                                                       |
| `js/webgl/mirrorPass.js`                                         | Fullscreen + camera sampling                                                                                                    |
| `js/webgl/quiltPass.js`                                          | Holoplay quilt composite                                                                                                        |
| `package.json`                                                   | Remove `regl` dependency                                                                                                        |
| `scripts/vendor-webgl-deps.mjs`                                  | Stop copying regl to `lib/`                                                                                                     |
| `service-worker.js`                                              | Remove `lib/regl.min.js` from `STATIC_ASSETS` when file deleted                                                                 |
| `tests/regression/matrix-full.spec.js`                           | Still valid; must pass after migration                                                                                          |
| `README.md` / `RENDERING.md` / `.github/copilot-instructions.md` | Update wording from “regl” to new stack                                                                                         |

**Optional:** `js/webgl/lkgHelper.js` — may stay JS-only; verify it does not assume regl types.

---

## 8. Step-by-step migration plan (recommended order)

### Phase 0 — Baseline

1. Run `npm test` and `npm run test:regression` on `master`; save logs as baseline.
2. Freeze shader behavior: no GLSL edits in phase 1 if using **WebGL 1** strategy.

### Phase 1 — **Infrastructure without deleting features**

1. Add `js/webgl/glContext.js` (name arbitrary): creates `WebGLRenderingContext`, requests extensions matching current list in `main.js`:
   - `OES_texture_half_float`, `OES_texture_half_float_linear`, `OES_standard_derivatives`, `EXT_color_buffer_half_float`, optional `WEBGL_color_buffer_float`.
2. Implement minimal helpers: `createProgram(gl, vertSrc, fragSrc)`, `createTexture`, `createFramebufferColor`, `setViewportToCanvas`.
3. Port **`makeFullScreenQuad`** in `utils.js` to raw GL first (one program, one VBO) — used everywhere.

### Phase 2 — **Post passes** (lowest dependency)

Order: **palettePass** → **stripePass** → **imagePass** → **mirrorPass** → **bloomPass** (bloom depends on ping-pong textures like rain; may swap order with rain if easier to keep regl until bloom done — but end state is **zero regl**).

Each pass: preserve **inputs/outputs** (texture handles) so `main.js` pipeline shape stays `{ outputs: { primary }, ready, setSize, execute }`.

### Phase 3 — **rainPass.js**

1. Replace FBO/texture creation (`makePassFBO`, `makeDoubleBuffer`) with GL equivalents; verify half-float attachment completeness (`checkFramebufferStatus`).
2. Replace each `regl({})` with a `WebGLProgram` + draw call; keep **static shader strings** (already required after prior fixes).
3. Reinstall **`installWebGLShaderDebugHooks`** (or equivalent) on the **same** `gl` you own.

### Phase 4 — **quiltPass + Holoplay**

1. Port `quiltPass.js` last; validate against `useHoloplay` / `config` from `holoplay` version. Read **[HOLOPLAY.md](HOLOPLAY.md)** for how `lkgHelper` and the vendored `holoplay-core` client fit in (regl migration does **not** replace that file unless you deliberately change LKG integration).
2. If no hardware: use mock framebuffer sizes and assert shader compile only (`lkgHelper` recorded device path).

### Phase 5 — **main.js loop**

1. Replace `regl.frame` with `requestAnimationFrame` loop calling the same `tick` logic (`shouldRender`, `setSize`, `execute`, blit).
2. Remove `loadJS("lib/regl.min.js")`.

### Phase 6 — **Repo hygiene**

1. Delete `lib/regl.min.js`; remove from `STATIC_ASSETS`.
2. `package.json` / lockfile / `vendor-webgl-deps.mjs`.
3. Update all docs that say “regl”.

---

## 9. Extension and precision checklist (do not skip)

- **Half-float rain + compute FBOs:** Without `EXT_color_buffer_half_float`, many GPUs fail silently or produce black frames — match current extension list.
- **MSDF `fwidth`:** Requires `OES_standard_derivatives` on WebGL1 (already documented in shaders).
- **Uniform precision:** Shared `float` uniforms between vert/frag must use **matching explicit precision** (see `rainPass.*.glsl` and `SHADER_GUIDE.md`).
- **SwiftShader / software GL:** Keep Playwright expectations — some tests may skip WebGPU; WebGL should still link.

---

## 10. Verification matrix (modes × effects)

After migration, at minimum:

- **`npm test`** (smoke + unit).
- **`npm run test:regression`** — iterates **`getAvailableModes()` × `getAvailableEffects()`** with `renderer=webgl` (see `tests/regression/matrix-full.spec.js`).

That run covers **every version key returned by `getAvailableModes()`** (all keys on `versions` except `excludeME`) × **every effect** including `gallery` (gallery path uses different bootstrap but still must not regress).

Manually spot-check:

- `version=holoplay&renderer=webgl` (or default) with LKG if available.
- `effect=mirror&camera=true` (camera texture upload path).
- `effect=image` with remote `url=` (CORS) and local `assets/sand.png`.

---

## 11. Rollback plan

- Keep migration on a long-lived branch until `test:regression` is green in CI.
- Tag pre-migration commit (e.g. `before-regl-removal`) for bisect.

---

## 12. Summary table — “what breaks if we half-finish?”

| If incomplete… | Symptom                                                     |
| -------------- | ----------------------------------------------------------- |
| rainPass only  | Black / static screen; no rain                              |
| bloomPass      | Rain visible but no glow / wrong exposure                   |
| effect pass    | Rain + bloom OK but wrong colors / stripes / image / mirror |
| quiltPass      | Holoplay mode broken; standard modes may still work         |
| extensions     | Intermittent black FBOs, link errors, or NaN tiles          |
| blit to canvas | GPU works but canvas stays cleared                          |

---

_End of migration guide. Filename `migration_repl.md` is intentional; content applies to **regl** removal._
