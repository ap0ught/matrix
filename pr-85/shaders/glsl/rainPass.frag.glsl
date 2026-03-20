// ============================================================================
// Matrix Digital Rain - Main Fragment Shader
// ============================================================================
// "I know kung fu" - This shader renders the iconic green glyphs using MSDF
// (Multi-channel Signed Distance Fields) for crisp rendering at any scale.

#define PI 3.14159265359
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives: enable
#endif
precision lowp float;

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
vec2 getSymbol(vec2 uv, float index) {
	// Resolve UV to cropped position of glyph in MSDF texture
	// First, map to individual glyph cell in the grid
	uv = fract(uv * vec2(numColumns, numRows));
	uv -= 0.5;
	
	// Apply any rotation or skew transformations
	uv = glyphTransform * uv;
	
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

	// Transform UV coordinates based on display mode (slant, polar, etc.)
	vec2 uv = getUV(vUV);

	// Unpack the values from the data textures
	// In volumetric mode, data comes from vertex shader; otherwise sample textures
	vec4 raindropData = volumetric ? vRaindrop : texture2D(raindropState, uv);
	vec4   symbolData = volumetric ?   vSymbol : texture2D(  symbolState, uv);
	vec4   effectData = volumetric ?   vEffect : texture2D(  effectState, uv);

	// Calculate brightness for base, cursor, and glint channels
	vec3 brightness = getBrightness(
		raindropData,
		effectData,
		vDepth,
		uv
	);
	
	// Render the glyph using MSDF for crisp edges at any scale
	vec2 symbol = getSymbol(uv, symbolData.r);

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
