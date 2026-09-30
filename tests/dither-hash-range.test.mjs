/**
 * Regression tests for the dither noise hash in the WebGL post passes.
 *
 * palettePass/stripePass dither with `rand(gl_FragCoord.xy, time)`. `gl_FragCoord` is
 * mediump, which is 16-bit on some drivers, so the dot product against the usual noise
 * constants overflows to Inf once the framebuffer grows (~1300x800 and up: 12.9898*w +
 * 78.233*h passes 65504). Inf turns into NaN through mod()/fract(), and the cursor/glint
 * `min(NaN, 1.0)` resolves to 1.0 on AMD — a solid white wedge over that screen corner.
 *
 * The hash must therefore fold its coordinate into a small range first, keeping the
 * worst-case dot product inside 16-bit range. Locked in as a plain-text/numeric check
 * (no GPU); see tests/matrix-smoke.spec.js for the browser smoke tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const shaderPaths = [join(__dirname, "..", "shaders", "glsl", "palettePass.frag.glsl"), join(__dirname, "..", "shaders", "glsl", "stripePass.frag.glsl")];

/** Largest finite value a 16-bit float can hold; mediump overflows to Inf above it. */
const MEDIUMP_MAX = 65504;

const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");

for (const shaderPath of shaderPaths) {
	const name = shaderPath.split("/").pop();

	describe(`${name} (dither hash range)`, () => {
		const source = stripComments(readFileSync(shaderPath, "utf8"));
		const randBody = source.match(/float\s+rand\s*\([^)]*\)\s*\{[^}]*\}/)?.[0] ?? "";

		it("dithers with the noise hash and per-pixel gl_FragCoord", () => {
			assert.match(source, /highp\s+float\s+rand\s*\(/);
			assert.match(source, /rand\s*\(\s*gl_FragCoord\.xy\s*,\s*time\s*\)/);
		});

		it("folds the hash coordinate before the dot product", () => {
			assert.match(randBody, /mod\s*\(\s*uv\.xy\s*,\s*[\d.]+\s*\)/);
		});

		it("keeps the worst-case dot product inside mediump range", () => {
			const [, a, b] = randBody.match(/float\s+a\s*=\s*([\d.]+)\s*,\s*b\s*=\s*([\d.]+)/) ?? [];
			const [, fold] = randBody.match(/mod\s*\(\s*uv\.xy\s*,\s*([\d.]+)\s*\)/) ?? [];
			assert.ok(a && b && fold, `could not read noise constants out of ${name}`);

			const worstCaseDot = Number(fold) * (Number(a) + Number(b));
			assert.ok(worstCaseDot < MEDIUMP_MAX, `${name}: max dot product ${worstCaseDot.toFixed(0)} reaches mediump range ${MEDIUMP_MAX}`);
		});
	});
}
