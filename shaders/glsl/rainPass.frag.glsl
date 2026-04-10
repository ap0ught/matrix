// ============================================================================
// Matrix Digital Rain - Main Fragment Shader
// ============================================================================
// "I know kung fu" - This shader renders the iconic green glyphs using MSDF
// (Multi-channel Signed Distance Fields) for crisp rendering at any scale.

#define PI 3.14159265359
// Required at context level (see js/webgl/main.js). Do not wrap in #ifdef GL_OES_standard_derivatives:
// some implementations do not predefine that macro, so the extension would never enable and fwidth()
// would fail to compile — INVALID_OPERATION: useProgram: program not valid with no clear GLSL log.
#extension GL_OES_standard_derivatives : enable
// Fragment precision: we store per-cell glyph indices as floats in half-float FBOs, then
// read them back and use them as atlas indices. `lowp` floats are not guaranteed to
// distinguish every integer in 0..glyphSequenceLength-1 on all GPUs, which can make
// many cells map to the same glyph. `mediump` matches the usual precision for varyings
// and texture samples and keeps indices stable.
precision mediump float;

// Cell state textures - contain brightness, symbol, and effect data
uniform sampler2D raindropState, symbolState, effectState;

// Grid dimensions - number of columns and rows in the effect
uniform float numColumns, numRows;

// MSDF textures - distance field representations of glyphs for crisp rendering
uniform sampler2D glyphMSDF, glintMSDF, baseTexture, glintTexture;

// MSDF parameters - control distance field calculation
uniform float msdfPxRange;
uniform vec2 glyphMSDFSize, glintMSDFSize;
uniform bool hasBaseTexture, hasGlintTexture;

// Glyph appearance parameters
uniform float glyphHeightToWidth, glyphSequenceLength, glyphEdgeCrop;
uniform float baseContrast, baseBrightness, glintContrast, glintBrightness;
uniform float brightnessOverride, brightnessThreshold;
uniform vec2 glyphTextureGridSize;

// Slant parameters - creates the characteristic Matrix slant
uniform vec2 slantVec;
uniform float slantScale;

// Display mode flags
uniform bool isPolar;
uniform bool showDebugView;
uniform bool volumetric;
uniform bool isolateCursor, isolateGlint;

// Glyph transformation matrix
uniform mat2 glyphTransform;

// Whether to apply per-glyph random flip from symbol state B channel
uniform bool glyphRandomFlip;

// Inputs from vertex shader
varying vec2 vUV;
varying vec4 vRaindrop, vSymbol, vEffect;
varying float vDepth;

// Calculate the median of three values
// Used for MSDF sampling to get the true distance from the glyph edge
float median3(vec3 i) {
	return max(min(i.r, i.g), min(max(i.r, i.g), i.b));
}

// Integer modulo operation - rounds to nearest integer before applying modulo
float modI(float a, float b) {
	float m = a - floor((a + 0.5) / b) * b;
	return floor(m + 0.5);
}

// Transform UV coordinates based on display mode
// "What is real?" - We bend the coordinate space to create different visual effects
vec2 getUV(vec2 uv) {

	if (volumetric) {
		// In 3D mode, UVs are already correctly positioned
		return uv;
	}

	if (isPolar) {
		// Polar coordinate transformation for radial Matrix effect
		// Curved space that makes letters appear to radiate from up above
		uv -= 0.5;
		uv *= 0.5;
		uv.y -= 0.5;
		float radius = length(uv);
		float angle = atan(uv.y, uv.x) / (2. * PI) + 0.5;
		uv = vec2(fract(angle * 4. - 0.5), 1.5 * (1. - sqrt(radius)));
	} else {
		// Standard slanted view - the classic Matrix look
		// Applies the slant and scales space so the viewport is fully covered
		uv = vec2(
			(uv.x - 0.5) * slantVec.x + (uv.y - 0.5) * slantVec.y,
			(uv.y - 0.5) * slantVec.x - (uv.x - 0.5) * slantVec.y
		) * slantScale + 0.5;
	}

	// Adjust for glyph aspect ratio
	uv.y /= glyphHeightToWidth;

	return uv;
}

// Calculate glyph brightness for base, cursor, and glint channels
// Returns vec3: (base brightness, cursor brightness, glint brightness)
vec3 getBrightness(vec4 raindrop, vec4 effect, float quadDepth, vec2 uv) {

	// Extract brightness from raindrop data
	// raindrop.r = main brightness, raindrop.a = fade factor for intro animation
	float base = raindrop.r + max(0., 1.0 - raindrop.a * 5.0);
	
	// Check if this glyph is the cursor (the bright leading character)
	bool isCursor = bool(raindrop.g) && isolateCursor;
	float glint = base;
	
	// Apply custom effects that multiply or add to brightness
	float multipliedEffects = effect.r;
	float addedEffects = effect.g;

	// Sample texture overlays if they exist (for custom patterns)
	vec2 textureUV = fract(uv * vec2(numColumns, numRows));
	base = base * baseContrast + baseBrightness;
	if (hasBaseTexture) {
		base *= texture2D(baseTexture, textureUV).r;
	}
	glint = glint * glintContrast + glintBrightness;
	if (hasGlintTexture) {
		glint *= texture2D(glintTexture, textureUV).r;
	}

	// Modes that don't fade glyphs set their actual brightness here
	// This creates effects where all characters have uniform brightness
	if (brightnessOverride > 0. && base > brightnessThreshold && !isCursor) {
		base = brightnessOverride;
	}

	// Apply effect modulation
	base = base * multipliedEffects + addedEffects;
	glint = glint * multipliedEffects + addedEffects;

	// In volumetric mode, distant glyphs are dimmer (depth fog effect)
	if (volumetric && !showDebugView) {
		base = base * min(1.0, quadDepth);
		glint = glint * min(1.0, quadDepth);
	}

	// Return separate channels: base, cursor, and glint
	// Cursor and base are mutually exclusive (isCursor switches between them)
	return vec3(
		(isCursor ? vec2(0.0, 1.0) : vec2(1.0, 0.0)) * base,
		glint
	) * raindrop.b;
}

// Convert a glyph index to UV coordinates in the MSDF texture atlas
// The atlas is a grid of glyphs, and we need to find which cell contains our glyph
vec2 getSymbolUV(float index) {
	float symbolX = modI(index, glyphTextureGridSize.x);
	float symbolY = (index - symbolX) / glyphTextureGridSize.x;
	// Flip Y coordinate because texture origin is top-left
	symbolY = glyphTextureGridSize.y - symbolY - 1.;
	return vec2(symbolX, symbolY);
}

// Render a glyph using MSDF (Multi-channel Signed Distance Fields)
// "There is no spoon" - the glyph doesn't move, only its illumination changes
// Returns vec2: (base symbol alpha, glint symbol alpha)
//
// Flip flag encoding (stored in symbol state B channel):
//   0.0  = no flip,  0.25 = H-flip only,  0.5 = V-flip only,  0.75 = H+V flip
// Thresholds use midpoints between each value to handle low-precision texture storage.
#define FLIP_H_MIN 0.125   // midpoint between 0.0 and 0.25
#define FLIP_HV_MIN 0.375  // midpoint between 0.25 and 0.5 (also: V-flip threshold)
#define FLIP_HH_MIN 0.625  // midpoint between 0.5 and 0.75

vec2 getSymbol(vec2 uv, float index, float flipFlags) {
	// Resolve UV to cropped position of glyph in MSDF texture
	// First, map to individual glyph cell in the grid
	uv = fract(uv * vec2(numColumns, numRows));
	uv -= 0.5;

	// Apply global rotation/flip transformation
	uv = glyphTransform * uv;

	// Apply per-glyph random flip when enabled:
	// flipFlags encodes: 0.0=none, 0.25=H-flip, 0.5=V-flip, 0.75=H+V flip
	if (glyphRandomFlip) {
		float hFlip = (flipFlags >= FLIP_H_MIN && flipFlags < FLIP_HV_MIN) || flipFlags >= FLIP_HH_MIN ? -1. : 1.;
		float vFlip = flipFlags >= FLIP_HV_MIN ? -1. : 1.;
		uv *= vec2(hFlip, vFlip);
	}

	// Crop edges if needed (for tighter glyph spacing)
	uv *= clamp(1. - glyphEdgeCrop, 0., 1.);
	uv += 0.5;
	
	// Map to the correct glyph in the texture atlas
	uv = (uv + getSymbolUV(index)) / glyphTextureGridSize;

	// MSDF: calculate brightness of fragment based on distance to shape
	// This technique allows crisp rendering at any scale without aliasing
	vec2 symbol;
	{
		// Calculate how many screen pixels correspond to one texture pixel
		vec2 unitRange = vec2(msdfPxRange) / glyphMSDFSize;
		vec2 screenTexSize = vec2(1.0) / fwidth(uv);
		float screenPxRange = max(0.5 * dot(unitRange, screenTexSize), 1.0);

		// Sample the distance field and convert to screen-space distance
		float signedDistance = median3(texture2D(glyphMSDF, uv).rgb);
		float screenPxDistance = screenPxRange * (signedDistance - 0.5);
		
		// Convert distance to alpha with smooth antialiasing
		symbol.r = clamp(screenPxDistance + 0.5, 0.0, 1.0);
	}

	// Optionally render a separate glint layer (brighter highlights on glyphs)
	if (isolateGlint) {
		vec2 unitRange = vec2(msdfPxRange) / glintMSDFSize;
		vec2 screenTexSize = vec2(1.0) / fwidth(uv);
		float screenPxRange = max(0.5 * dot(unitRange, screenTexSize), 1.0);

		float signedDistance = median3(texture2D(glintMSDF, uv).rgb);
		float screenPxDistance = screenPxRange * (signedDistance - 0.5);
		symbol.g = clamp(screenPxDistance + 0.5, 0.0, 1.0);
	}

	return symbol;
}

void main() {

	// --- Two coordinate spaces: "screen grid" (vUV) vs "rendered" (uv) ---
	//
	// vUV: 0..1 across the fullscreen quad, one row/column per glyph cell (no slant).
	// uv:  after getUV() — slant, polar warp, and glyph aspect ratio. Used for *drawing*
	//      the MSDF (local position inside the cell) and for palette/base textures that
	//      should follow the same warp as the rain.
	//
	// Raindrop/symbol/effect state is written in compute passes using normalized grid
	// coordinates (see rainPass.*.frag.glsl: screenPos = gl_FragCoord / grid size). Those
	// texels are aligned with vUV, not with the skewed uv.
	//
	// If we sampled symbolState using `uv`, linear filtering would blend *different*
	// cells' symbol indices when slant or polar is active (and in edge cases with aspect
	// ratio), producing a few averaged indices — so only a handful of glyphs appear
	// (e.g. mathcode with many atlas slots). Always sample state textures at the cell
	// center derived from vUV (see tests/rain-pass-state-sampling.test.mjs).

	vec2 uv = getUV(vUV);

	vec2 cellId = floor(vUV * vec2(numColumns, numRows));
	// Clamp so vUV == 1.0 does not land on a non-existent row/column (texel edge).
	cellId = min(cellId, vec2(numColumns, numRows) - 1.);
	vec2 stateUV = (cellId + 0.5) / vec2(numColumns, numRows);

	// Unpack the values from the data textures
	// In volumetric mode, data comes from vertex shader; otherwise sample textures
	vec4 raindropData = volumetric ? vRaindrop : texture2D(raindropState, stateUV);
	vec4   symbolData = volumetric ?   vSymbol : texture2D(  symbolState, stateUV);
	vec4   effectData = volumetric ?   vEffect : texture2D(  effectState, stateUV);

	// Snap to nearest integer glyph index: half-float storage + linear interpolation can
	// leave values like 8.47 between frames; clamp to valid atlas range so getSymbolUV
	// never receives an out-of-range index.
	float symbolIndex = clamp(floor(symbolData.r + 0.5), 0., glyphSequenceLength - 1.);

	// Calculate brightness for base, cursor, and glint channels
	vec3 brightness = getBrightness(
		raindropData,
		effectData,
		vDepth,
		uv
	);
	
	// Render the glyph using MSDF for crisp edges at any scale
	vec2 symbol = getSymbol(uv, symbolIndex, symbolData.b);

	// Debug view shows the raw computational state (useful for development)
	if (showDebugView) {
		gl_FragColor = vec4(
			vec3(
				raindropData.g,  // Cursor position (red)
				vec2(
					1. - ((1.0 - raindropData.r) * 3.),   // Brightness gradient (green)
					1. - ((1.0 - raindropData.r) * 8.)    // Sharper brightness (blue)
				) * (1. - raindropData.g)
			) * symbol.r,
			1.
		);
	} else {
		// Normal rendering: combine brightness and symbol alpha
		// Output channels: R=base, G=cursor, B=glint, A=unused
		gl_FragColor = vec4(brightness.rg * symbol.r, brightness.b * symbol.g, 0.);
	}
}
