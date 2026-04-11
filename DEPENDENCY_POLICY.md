# Dependency and third-party code policy

This repository ships as **static files** (no app bundler). Anything we add must stay **maintainable** and **auditable**.

## Rules

1. **npm `dependencies` / `devDependencies`**
  - Prefer packages with **recent releases**, **responsive maintainers**, and **public security disclosure** practice.
  - **Do not add** libraries whose upstream is **archived**, **explicitly unmaintained**, or has had **no meaningful release or security fix** for an extended period without a written exception and an owner.
  - **Do not vendor** unmaintained npm tarballs into `lib/` except as a **time-boxed** migration bridge (see exceptions below).
2. **Vendored scripts under `lib/`**
  - Every file must have a **documented upstream** (URL + license) in `SECURITY.md` or next to the file.
  - Prefer **reproducible copies** from `npm pack` / `scripts/*.mjs` over hand-edited minified blobs.
3. **Browser APIs**
  - First-party code may use WebGL / WebGPU directly. That code is **ours to maintain**; it is not an npm dependency.

## Looking Glass (`holoplay-core`)

- **File:** [`lib/holoplaycore.module.js`](lib/holoplaycore.module.js) — vendored ES module from Looking Glass Factory’s **`holoplay-core`** npm package (WebSocket client to HoloPlay Service; includes MIT-licensed CBOR helpers in the same file).
- **Used only when** `config.useHoloplay` is true (e.g. `version=holoplay`). See **[HOLOPLAY.md](HOLOPLAY.md)** for architecture, dev without hardware, and upgrade notes.
- **Maintenance:** Prefer **reproducible refresh** from a pinned `holoplay-core` version (`npm pack` / small vendor script) over ad hoc edits. Our tree may lag npm; align versions when touching LKG integration.

## Current exceptions (must shrink over time)


| Item                       | Status                                                                                                                       | Required action                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `**regl`** (WebGL wrapper) | Upstream maintenance is effectively stalled. Still required for `js/webgl/` until the port in `**migration_repl.md**` lands. | **Remove** regl and replace with **first-party WebGL** (or a dependency that passes this policy). |


## Experimental: `three` (Three.js)

- **npm `three`** + vendored **`lib/three.module.js`** power **`js/three-rain/`** only when **`renderer=three`** or the **`mathcode_alphabet_three`** version preset. This path is **not** a replacement for the MSDF rain pipeline; see **[RENDERING_PIPELINE.md](RENDERING_PIPELINE.md)**.

## Experimental: `p5` (p5.js)

- **npm `p5`** + vendored **`lib/p5.min.js`** (browser UMD) power **`js/p5-rain/`** when **`renderer=p5`** or **`version=mathcode_p5`**. **LGPL-2.1** — review `node_modules/p5/license.txt` before redistributing modified bundles. Not MSDF / bloom parity; see **[RENDERING_PIPELINE.md](RENDERING_PIPELINE.md)**.

## Removed (policy-compliant cleanup)

- `**twgl`**: Was listed as a dependency and copied to `lib/twgl-full.module.js` but **was not imported** by any application module. It has been **removed** entirely to avoid shipping unused third-party code.

## Reviews

When upgrading or adding dependencies, update `**SECURITY.md`** supply-chain table and run `**npm test**` (and `**npm run test:regression**` for renderer/shader changes).