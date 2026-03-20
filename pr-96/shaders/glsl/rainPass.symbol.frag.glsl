// ============================================================================
// Matrix Digital Rain - Symbol Selection Shader
// ============================================================================
// "Do you think that's air you're breathing?" - Cycles through Matrix glyphs

precision highp float;

// This shader governs the glyphs appearing in the rain.
// It writes each glyph's state to the channels of a data texture:
// 		R: symbol index (which glyph to display)
// 		G: age (time until next glyph change)
// 		B: flip flags — 0.0=none, 0.25=H-flip, 0.5=V-flip, 0.75=H+V flip (only when glyphRandomFlip)
// 		A: unused

#define PI 3.14159265359

// Previous frame state and current raindrop brightness
uniform sampler2D previousSymbolState, raindropState;

// Grid dimensions
uniform float numColumns, numRows;

// Timing parameters
uniform float time, tick, cycleFrameSkip;
uniform float animationSpeed, cycleSpeed;

// Rendering mode flags
uniform bool loops, showDebugView;

// Number of available glyphs in the font
uniform float glyphSequenceLength;

// Whether to randomly flip individual glyphs horizontally and/or vertically
uniform bool glyphRandomFlip;

// ============================================================================
// Helper functions for generating randomness, borrowed from elsewhere
// ============================================================================

highp float randomFloat( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}

// ============================================================================
// Main computation - cycles glyphs over time
// ============================================================================

vec4 computeResult(float simTime, bool isFirstFrame, vec2 glyphPos, vec2 screenPos, vec4 previous, vec4 raindrop) {

	float previousSymbol = previous.r;
	float previousAge = previous.g;
	float previousFlip = previous.b;

	// Reset glyph on first frame or when raindrop resets
	bool resetGlyph = isFirstFrame;
	if (loops) {
		resetGlyph = resetGlyph || raindrop.r <= 0.;
	}
	if (resetGlyph) {
		// Start with random age and symbol
		previousAge = randomFloat(screenPos + 0.5);
		previousSymbol = floor(glyphSequenceLength * randomFloat(screenPos));
		// Assign a random flip flag: 0=none, 1=H, 2=V, 3=H+V (encoded as 0.0/0.25/0.5/0.75)
		previousFlip = glyphRandomFlip ? floor(4. * randomFloat(screenPos + 0.1)) * 0.25 : 0.;
	}

	// Calculate how fast glyphs cycle
	float glyphCycleSpeed = animationSpeed * cycleSpeed;
	float age = previousAge;
	float symbol = previousSymbol;
	float flip = previousFlip;

	// Only update on certain frames for performance (frame skip)
	if (mod(tick, cycleFrameSkip) == 0.) {
		age += glyphCycleSpeed * cycleFrameSkip;
		// When age exceeds 1.0, pick a new random glyph (and a new random flip)
		if (age >= 1.) {
			symbol = floor(glyphSequenceLength * randomFloat(screenPos + simTime));
			age = fract(age);
			flip = glyphRandomFlip ? floor(4. * randomFloat(screenPos + simTime + 0.1)) * 0.25 : 0.;
		}
	}

	vec4 result = vec4(symbol, age, flip, 0.);
	return result;
}

void main()	{
	float simTime = time * animationSpeed;
	bool isFirstFrame = tick <= 1.;
	vec2 glyphPos = gl_FragCoord.xy;
	vec2 screenPos = glyphPos / vec2(numColumns, numRows);
	vec4 previous = texture2D( previousSymbolState, screenPos );
	vec4 raindrop = texture2D( raindropState, screenPos );
	gl_FragColor = computeResult(simTime, isFirstFrame, glyphPos, screenPos, previous, raindrop);
}
