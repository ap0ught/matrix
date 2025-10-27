// ============================================================================
// Matrix Digital Rain - Special Effects Shader
// ============================================================================
// "Dodge this" - Thunder flashes and ripple waves for non-canon variants

precision highp float;

// These effects are used to spice up the non-canon versions of the code rain.
// The shader writes them to the channels of a data texture:
// 		R: multiplied effects— magnify the cell's brightness
// 		G: added effects— offset the cell's brightness
// 		B: unused
// 		A: unused

#define SQRT_2 1.4142135623730951
#define SQRT_5 2.23606797749979

// Previous frame state for continuous effects
uniform sampler2D previousEffectState;

// Grid dimensions
uniform float numColumns, numRows;

// Timing parameters
uniform float time, tick;
uniform float animationSpeed;

// Effect control flags and parameters
uniform bool hasThunder, loops;
uniform float glyphHeightToWidth;
uniform int rippleType;  // -1=none, 0=square, 1=circular
uniform float rippleScale, rippleSpeed, rippleThickness;

// ============================================================================
// Helper functions for generating randomness, borrowed from elsewhere
// ============================================================================

vec2 randomVec2( const in vec2 uv ) {
	return fract(vec2(sin(uv.x * 591.32 + uv.y * 154.077), cos(uv.x * 391.32 + uv.y * 49.077)));
}

// Add organic variation using irrational numbers
float wobble(float x) {
	return x + 0.3 * sin(SQRT_2 * x) + 0.2 * sin(SQRT_5 * x);
}

// Calculate lightning/thunder flash effect
// Creates sudden brightness spikes that illuminate the entire screen
float getThunder(float simTime, vec2 screenPos) {
	if (!hasThunder) {
		return 0.;
	}

	// Generate irregular thunder timing
	float thunderTime = simTime * 0.5;
	float thunder = 1. - fract(wobble(thunderTime));
	if (loops) {
		// Simpler pattern for looping mode
		thunder = 1. - fract(thunderTime + 0.3);
	}

	// Sharpen the thunder pulse using logarithmic curve
	thunder = log(thunder * 1.5) * 4.;
	// Stronger at the top of the screen (as if lightning comes from above)
	thunder = clamp(thunder, 0., 1.) * 10. * pow(screenPos.y, 2.);
	return thunder;
}

// Calculate expanding ripple effect
// Creates circular or square waves that propagate across the screen
float getRipple(float simTime, vec2 screenPos) {
	if (rippleType == -1) {
		return 0.;
	}

	// Calculate ripple animation time with slight wobble
	float rippleTime = (simTime * 0.5 + sin(simTime) * 0.2) * rippleSpeed + 1.;
	if (loops) {
		// Smoother ripple timing for looping mode
		rippleTime = (simTime * 0.5) * rippleSpeed + 1.;
	}

	// Random offset for ripple origin point
	vec2 offset = randomVec2(vec2(floor(rippleTime), 0.)) - 0.5;
	if (loops) {
		// Centered ripples in looping mode
		offset = vec2(0.);
	}
	
	// Calculate distance from ripple center
	vec2 ripplePos = screenPos * 2. - 1. + offset;
	float rippleDistance;
	if (rippleType == 0) {
		// Square/diamond ripple - uses Chebyshev distance
		vec2 boxDistance = abs(ripplePos) * vec2(1., glyphHeightToWidth);
		rippleDistance = max(boxDistance.x, boxDistance.y);
	} else if (rippleType == 1) {
		// Circular ripple - uses Euclidean distance
		rippleDistance = length(ripplePos);
	}

	// Calculate if this pixel is within the ripple ring
	float rippleValue = fract(rippleTime) * rippleScale - rippleDistance;

	// Draw a thin ring where the ripple wave passes
	if (rippleValue > 0. && rippleValue < rippleThickness) {
		return 0.75;
	}

	return 0.;
}

// ============================================================================
// Main computation - combines thunder and ripple effects
// ============================================================================

vec4 computeResult(float simTime, bool isFirstFrame, vec2 glyphPos, vec2 screenPos, vec4 previous) {

	// Thunder multiplies brightness (flash effect)
	float multipliedEffects = 1. + getThunder(simTime, screenPos);
	
	// Ripples add constant brightness (ring effect)
	float addedEffects = getRipple(simTime, screenPos);

	vec4 result = vec4(multipliedEffects, addedEffects, 0., 0.);
	return result;
}

void main()	{
	float simTime = time * animationSpeed;
	bool isFirstFrame = tick <= 1.;
	vec2 glyphPos = gl_FragCoord.xy;
	vec2 screenPos = glyphPos / vec2(numColumns, numRows);
	vec4 previous = texture2D( previousEffectState, screenPos );
	gl_FragColor = computeResult(simTime, isFirstFrame, glyphPos, screenPos, previous);
}
