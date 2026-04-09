/**
 * Regression tests for rainPass.frag.glsl state-texture sampling.
 *
 * The rain pass must sample raindrop/symbol/effect state at grid cell centers derived
 * from unskewed vUV (stateUV), not from getUV(vUV), so glyph indices are not blended
 * under linear filtering when slant/polar/aspect differ from the compute-pass grid.
 *
 * These tests lock in shader invariants as plain-text checks (no GPU). See also
 * tests/matrix-mathcode.spec.js for a browser smoke test.
 *
 * Introduced in PR #107 (rain pass state sampling fix).
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const shaderPath = join(__dirname, "..", "shaders", "glsl", "rainPass.frag.glsl");

describe("rainPass.frag.glsl (state sampling regression)", () => {
	const source = readFileSync(shaderPath, "utf8");

	it("uses mediump fragment precision (stable glyph index math)", () => {
		assert.match(source, /precision\s+mediump\s+float\s*;/);
		assert.doesNotMatch(
			source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ""),
			/precision\s+lowp\s+float\s*;/,
		);
	});

	it("samples state textures at stateUV from vUV cell centers, not at skewed uv", () => {
		assert.match(source, /\bstateUV\b/);
		assert.match(source, /texture2D\s*\(\s*raindropState\s*,\s*stateUV\s*\)/);
		assert.match(source, /texture2D\s*\(\s*symbolState\s*,\s*stateUV\s*\)/);
		assert.match(source, /texture2D\s*\(\s*effectState\s*,\s*stateUV\s*\)/);
		// Must not sample symbol state with the warped uv (would reintroduce the bug)
		assert.doesNotMatch(
			source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ""),
			/texture2D\s*\(\s*symbolState\s*,\s*uv\s*\)/,
		);
	});

	it("derives cell grid from vUV and numColumns/numRows with edge clamp", () => {
		assert.match(source, /floor\s*\(\s*vUV\s*\*\s*vec2\s*\(\s*numColumns\s*,\s*numRows\s*\)\s*\)/);
		assert.match(source, /min\s*\(\s*cellId\s*,\s*vec2\s*\(\s*numColumns\s*,\s*numRows\s*\)\s*-\s*1\.\s*\)/);
	});

	it("snaps symbol index to integer and clamps to atlas range", () => {
		assert.match(source, /symbolIndex\s*=\s*clamp\s*\(\s*floor\s*\(\s*symbolData\.r\s*\+\s*0\.5\s*\)/);
		assert.match(source, /glyphSequenceLength\s*-\s*1\.\s*\)/);
	});

	it("passes symbolIndex (not raw symbolData.r) into getSymbol", () => {
		assert.match(source, /getSymbol\s*\(\s*uv\s*,\s*symbolIndex\s*,/);
	});
});
