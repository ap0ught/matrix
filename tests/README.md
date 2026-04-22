# Tests

## Commands

| Command                       | What runs                                                                                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`npm run test:unit`**       | Node only: `tests/*.test.mjs` (shader / text invariants, no browser).                                                                                                                |
| **`npm test`**                | `test:unit` **+** Playwright default config: `tests/**/*.spec.js` **except** `tests/regression/**`. Requires **`npx playwright install`** (e.g. Chromium) once per machine/CI image. |
| **`npm run test:regression`** | Playwright **`playwright.regression.config.js`**: everything under **`tests/regression/`** (slow). Same Playwright install as above.                                                 |

## Layout

| Path                                                         | Role                                                                                                                                                                                                                                               |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`tests/*.test.mjs`**                                       | Node **`node:test`** modules.                                                                                                                                                                                                                      |
| **`tests/*.spec.js`**                                        | Playwright smoke tests (default **`npm test`**). Examples: `matrix-mathcode.spec.js`, `matrix-three-rain.spec.js`, `matrix-p5-rain.spec.js`.                                                                                                       |
| **`tests/matrix-playwright-helpers.js`**                     | Shared **`attachMatrixRenderingWatchers`**, **`assertMatrixBootsClean`**, **`rainSurfaceCanvas`** (first **visible** canvas — important when **`p5-rain`** hides the Matrix canvas).                                                               |
| **`tests/regression/matrix-full.spec.js`**                   | Full Cartesian product: **`getAvailableModes()` × `getAvailableEffects()`** with **`renderer=webgl`**. Presets that use **`renderer=three`** or **`renderer=p5`** are **skipped** (they would not exercise those renderers while forced to WebGL). |
| **`tests/regression/matrix-experimental-renderers.spec.js`** | **`three-rain`** and **`p5-rain`** URLs (preset + explicit `renderer=` variants).                                                                                                                                                                  |

## CI

`.github/workflows/master-branch-protection.yml` runs **`npm test`** (not `test:regression` by default). Run **`npm run test:regression`** locally before large renderer or shader refactors.
