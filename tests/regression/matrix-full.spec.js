/**
 * Full regression: every version (mode) × every post-process effect on WebGL.
 *
 * Run: `npm run test:regression`
 * Requires: `npx playwright install` (Chromium). Not included in `npm test`.
 *
 * Sources of truth for the Cartesian product:
 * - `getAvailableModes()` / `getAvailableEffects()` in `js/config.js`
 *
 * Versions that set `renderer` to **three** or **p5** are excluded here (this file always forces
 * `renderer=webgl`). They are covered by `matrix-experimental-renderers.spec.js`.
 */
import { test } from "@playwright/test";
import { getAvailableEffects, getAvailableModes } from "../../js/config.js";
import {
  assertGalleryBootsClean,
  assertMatrixBootsClean,
} from "../matrix-playwright-helpers.js";

/** Presets that require `three-rain` or `p5-rain` — not the forced-WebGL matrix. */
const EXPERIMENTAL_RENDERER_VERSIONS = new Set([
  "mathcode_alphabet_three",
  "mathcode_p5",
]);

const MODES = getAvailableModes().filter(
  (v) => !EXPERIMENTAL_RENDERER_VERSIONS.has(v),
);
const EFFECTS = getAvailableEffects();

/**
 * @param {string} version
 * @param {string} effect
 */
function buildQuery(version, effect) {
  const params = new URLSearchParams({
    suppressWarnings: "true",
    skipIntro: "true",
    renderer: "webgl",
    version,
    effect,
  });
  if (effect === "image") {
    params.set("url", "assets/sand.png");
  }
  return params.toString();
}

test.describe("Full regression: version × effect (WebGL)", () => {
  test.describe.configure({ timeout: 120_000 });

  for (const version of MODES) {
    for (const effect of EFFECTS) {
      test(`${version} + ${effect}`, async ({ page }) => {
        const query = buildQuery(version, effect);
        if (effect === "gallery") {
          await assertGalleryBootsClean(page, query);
        } else {
          await assertMatrixBootsClean(page, query);
        }
      });
    }
  }
});
