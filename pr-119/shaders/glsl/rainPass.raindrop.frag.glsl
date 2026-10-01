// ============================================================================
// Matrix Digital Rain - Raindrop State Computation Shader
// ============================================================================
// "Welcome to the real world" - The heart of the Matrix rain effect

precision highp float;

// This shader is the star of the show.
// It writes falling rain to the channels of a data texture:
// 		R: raindrop brightness (main glow)
// 		G: whether the cell is a "cursor" (bright leading character)
// 		B: whether the cell is "activated" — to animate the intro
// 		A: unused (intro progress overflow)

// Listen.
// I understand if this shader looks confusing. Please don't be discouraged!
// It's just a handful of sine and fract functions. Try commenting parts out to learn
// how the different steps combine to produce the result. And feel free to reach out. -RM

#define PI 3.14159265359
#define SQRT_2 1.4142135623730951
#define SQRT_5 2.23606797749979

// Previous frame state and intro animation progress
uniform sampler2D previousRaindropState, introState;

// Grid dimensions
uniform float numColumns, numRows;

// Timing parameters
uniform float time, tick;
uniform float animationSpeed, fallSpeed;

// Animation control flags
uniform bool loops, skipIntro;

// Raindrop appearance parameters
uniform float brightnessDecay;  // How fast glyphs fade
uniform float raindropLength;   // Length of each raindrop streak

// ============================================================================
// Helper functions for generating randomness, borrowed from elsewhere
// ============================================================================

highp float randomFloat( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}

vec2 randomVec2( const in vec2 uv ) {
	return fract(vec2(sin(uv.x * 591.32 + uv.y * 154.077), cos(uv.x * 391.32 + uv.y * 49.077)));
}

// Add organic variation to the rain timing using irrational numbers
float wobble(float x) {
	return x + 0.3 * sin(SQRT_2 * x) + 0.2 * sin(SQRT_5 * x);
}

// ============================================================================
// This is the code rain's key underlying concept.
// ============================================================================
// It's why glyphs that share a column are lit simultaneously, and are brighter toward the bottom.
// It's also why those bright areas are truncated into raindrops.
float getRainBrightness(float simTime, vec2 glyphPos) {
	// Each column starts at a different time and falls at a different speed
	float columnTimeOffset = randomFloat(vec2(glyphPos.x, 0.)) * 1000.;
	float columnSpeedOffset = randomFloat(vec2(glyphPos.x + 0.1, 0.)) * 0.5 + 0.5;
	if (loops) {
		// In looping mode, all columns fall at the same speed
		columnSpeedOffset = 0.5;
	}
	
	// Calculate the current time for this column
	float columnTime = columnTimeOffset + simTime * fallSpeed * columnSpeedOffset;
	
	// Calculate position in the raindrop wave
	// glyphPos.y creates vertical gradient, columnTime makes it fall
	float rainTime = (glyphPos.y * 0.01 + columnTime) / raindropLength;
	if (!loops) {
		// Add organic wobble to make rain feel less mechanical
		rainTime = wobble(rainTime);
	}
	
	// fract() creates repeating raindrops, 1.0 - inverts so bright at bottom
	return 1.0 - fract(rainTime);
}

// ============================================================================
// Main computation - calculates raindrop brightness and cursor position
// ============================================================================

vec4 computeResult(float simTime, bool isFirstFrame, vec2 glyphPos, vec4 previous, vec4 intro) {
	// Get brightness for this cell and the one below it
	float brightness = getRainBrightness(simTime, glyphPos);
	float brightnessBelow = getRainBrightness(simTime, glyphPos + vec2(0., -1.));

	// Calculate intro animation progress for this cell
	float introProgress = intro.r - (1. - glyphPos.y / numRows);
	float introProgressBelow = intro.r - (1. - (glyphPos.y - 1.) / numRows);

	// Check if this cell has been activated by the intro cascade
	bool activated = bool(previous.b) || skipIntro || introProgress > 0.;
	bool activatedBelow = skipIntro || introProgressBelow > 0.;

	// Cursor marks the leading edge of the raindrop (brightest point)
	// It's either where brightness peaks or where activation wave reaches
	bool cursor = brightness > brightnessBelow || (activated && !activatedBelow);

	// Blend the glyph's brightness with its previous brightness, so it winks on and off organically
	// This creates the characteristic smooth fade-in/fade-out effect
	if (!isFirstFrame) {
		float previousBrightness = previous.r;
		brightness = mix(previousBrightness, brightness, brightnessDecay);
	}

	vec4 result = vec4(brightness, cursor, activated, introProgress);
	return result;
}

void main()	{
	float simTime = time * animationSpeed;
	bool isFirstFrame = tick <= 1.;
	vec2 glyphPos = gl_FragCoord.xy;
	vec2 screenPos = glyphPos / vec2(numColumns, numRows);
	vec4 previous = texture2D( previousRaindropState, screenPos );
	vec4 intro = texture2D( introState, vec2(screenPos.x, 0.) );
	gl_FragColor = computeResult(simTime, isFirstFrame, glyphPos, previous, intro);
}
