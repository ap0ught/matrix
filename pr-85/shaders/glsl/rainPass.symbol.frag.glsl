// ============================================================================
// Matrix Digital Rain - Symbol Selection Shader
// ============================================================================
// "Do you think that's air you're breathing?" - Cycles through Matrix glyphs

precision highp float;

// This shader governs the glyphs appearing in the rain.
// It writes each glyph's state to the channels of a data texture:
// 		R: symbol index (which glyph to display)
// 		G: age (time until next glyph change)
// 		B: unused
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
	
	// Reset glyph on first frame or when raindrop resets
	bool resetGlyph = isFirstFrame;
	if (loops) {
		resetGlyph = resetGlyph || raindrop.r <= 0.;
	}
	if (resetGlyph) {
		// Start with random age and symbol
		previousAge = randomFloat(screenPos + 0.5);
		previousSymbol = floor(glyphSequenceLength * randomFloat(screenPos));
	}
	
	// Calculate how fast glyphs cycle
	float cycleSpeed = animationSpeed * cycleSpeed;
	float age = previousAge;
	float symbol = previousSymbol;
	
	// Only update on certain frames for performance (frame skip)
	if (mod(tick, cycleFrameSkip) == 0.) {
		age += cycleSpeed * cycleFrameSkip;
		// When age exceeds 1.0, pick a new random glyph
		if (age >= 1.) {
			symbol = floor(glyphSequenceLength * randomFloat(screenPos + simTime));
			age = fract(age);
		}
	}

	vec4 result = vec4(symbol, age, 0., 0.);
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
