# How rendering works today (and how the Three.js demo relates)

This document explains **what the main Matrix rain does on the GPU**, how **`regl` / WebGL** and **WebGPU** paths differ, and how the experimental **`renderer=three`** mode compares to rewriting the same effect in **Three.js**.

For stack overview and links to policy, see **[RENDERING.md](RENDERING.md)**. Looking Glass is **[HOLOPLAY.md](HOLOPLAY.md)**.

---

## 1. Boot flow (`js/main.js`)

1. URL/query params are parsed by **`makeConfig()`** in **`js/config.js`** (versions, `renderer`, effects, etc.).
2. If `effect=gallery`, the app runs the gallery UI instead of rain.
3. Otherwise **`renderer`** picks the module:
   - **`webgpu`** — dynamic `import("./webgpu/main.js")` when `navigator.gpu` is available **and** the user asked for WebGPU.
   - **`webgl`** (default, or legacy `renderer=regl`) — `import("./webgl/main.js")`.
   - **`three`** — `import("./three-rain/main.js")` (**experimental** demo; see §5).
4. Holoplay forces **WebGL**; **`renderer=three`** is rejected when **`useHoloplay`** is true (same entry as WebGPU override).

Each renderer’s **`default`** export is an **`async (canvas, config) => { ... }`** that owns the animation loop and resize handling.

---

## 2. What “the rain” is in WebGL (`js/webgl/`)

Conceptually the WebGL path is **not** a scene graph. It is a **pipeline of render passes** built with **regl** (temporary wrapper; see **[migration_repl.md](migration_repl.md)**):

1. **`rainPass.js`** — Core simulation: MSDF glyph atlas (`assets/*_msdf.png`), multiple framebuffer objects (often half-float), fragment shaders that advance “columns” of rain, optional volumetric / camera / ripple uniforms, then composite into a **primary** texture.
2. **`bloomPass.js`** — Pyramid blur / combine on that texture (glow).
3. **Effect pass** — From **`js/effects.js`**: palette, stripes, image, mirror, etc. (each is another fullscreen or textured pass).
4. **`quiltPass.js`** — Only when Looking Glass calibration is active; otherwise passthrough.
5. **Fullscreen blit** — Final texture to the canvas.

Data flow: **`config`** (fonts, palette, speeds, `numColumns`, …) → uniform values and texture bindings → **draw calls** each frame. **Glyphs** are not `THREE.Mesh` instances; they are **procedural quads** driven by shader math and **MSDF** sampling so edges stay sharp.

**`lib/regl.min.js`** and **`lib/gl-matrix.js`** are loaded as classic scripts from **`webgl/main.js`** (`loadJS`), then **`createREGL({ canvas, extensions, ... })`** wraps the WebGL context.

---

## 3. WebGPU path (`js/webgpu/`)

Same **idea** (rain → bloom → effect → present), but **WGSL** shaders and **WebGPU** pipelines (`js/webgpu/*.js`). No regl; no Three.js. Feature set is kept in parity where possible; **Holoplay** stays on WebGL only.

---

## 4. How Three.js would “do the same thing” (full parity)

**Three.js** is a **scene graph** and **material** stack on top of WebGL (or WebGPU via **`WebGPURenderer`** in newer releases). To match this project’s rain **fully**, you would still need to:

- Replicate **MSDF** text rendering (custom **`ShaderMaterial` / `NodeMaterial`**, or a text solution such as Troika / MSDF atlases).
- Replicate **multi-pass FBO** bloom and each **effect** as render targets or post-processing passes (`EffectComposer`, `Pass`, or manual `WebGLRenderTarget`s).
- Drive **tens of thousands** of glyphs efficiently — typically **instanced quads** or **custom buffer geometry**, not one `Mesh` per glyph.

So Three is **not a drop-in replacement for regl** here: it replaces **low-level draw scheduling**, not the **shaders, passes, and data model** you already have. It can **organize** the same passes (meshes fullscreen quads, RTs for bloom), but the **scope** is “re-home the existing GPU design into Three’s abstractions,” not “delete shaders and use `THREE.Points`.”

---

## 5. Experimental: `renderer=three` + `version=mathcode_alphabet_three`

**Purpose:** A small, readable **Three.js** path that shows **mathcode** glyphs on **even** columns and **Latin alphabet** glyphs on **odd** columns — same two character sets as **`fonts.mathcode`** / **`fonts.alphabet`** in **`js/config.js`**, but:

- **Raster atlas** built at runtime (Canvas → **`CanvasTexture`**), **not** MSDF.
- **No** bloom, palette effect passes, volumetric rain, Holoplay, or WebGPU.

**Entry:** **`js/three-rain/main.js`** — **`InstancedMesh`** + **`ShaderMaterial`**, **`OrthographicCamera`**, **`WebGLRenderer`**.

**Vendored runtime:** **`lib/three.module.js`** is copied from the **`three`** npm package by **`scripts/vendor-three.mjs`** on **`npm install`** (same static-hosting pattern as **`lib/regl.min.js`**).

**Try it:**  
`?version=mathcode_alphabet_three` (preset sets **`renderer: "three"`**) or combine explicitly:  
`?renderer=three&version=mathcode` (Three renderer with another version’s timing — font field ignored for glyph set in the Three demo; column split still uses math vs alphabet).

---

## 6. Summary

| Aspect | WebGL (`js/webgl/`) | WebGPU (`js/webgpu/`) | Three demo (`js/three-rain/`) |
| ------ | --------------------- | ---------------------- | ----------------------------- |
| API | WebGL1 + regl (temporary) | WebGPU + WGSL | WebGL2 (when available) + Three |
| Glyphs | MSDF atlases | MSDF / WGSL sampling | CPU raster atlas |
| Post | Bloom + effects + optional quilt | Bloom + effects | None |
| Holoplay | Supported | Not used | Not supported |

Use the Three mode as a **learning / comparison** slice and for dependency experiments; use **WebGL/WebGPU** for the full Matrix experience.
