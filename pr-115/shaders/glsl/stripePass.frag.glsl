// ============================================================================
// Matrix Digital Rain - Stripe Effect Pass
// ============================================================================
// "I can show you the door" - Custom vertical color stripes for rainbow mode

precision mediump float;
#define PI 3.14159265359

// Input textures: rain rendering and bloom glow
uniform sampler2D tex;
uniform sampler2D bloomTex;

// Stripe pattern texture - typically vertical color bands
uniform sampler2D stripeTex;

// Dithering parameters
uniform float ditherMagnitude;
uniform float time;

// Color channels for cursor and glint highlights
uniform vec3 backgroundColor, cursorColor, glintColor;
uniform float cursorIntensity, glintIntensity;

varying vec2 vUV;

// Pseudo-random noise function for dithering
// The coordinate is folded into a small range first: gl_FragCoord is mediump (16-bit on
// some drivers), so the dot product overflows to Inf past ~1300x800, and Inf -> NaN through
// mod()/fract() turns into a solid white wedge once min(NaN, 1.0) resolves to 1.0 below.
highp float rand( const in vec2 uv, const in float t ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( mod( uv.xy, 256.0 ), vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin(sn) * c + fract( t ) );
}

// Combine base rain rendering with bloom glow
vec4 getBrightness(vec2 uv) {
	vec4 primary = texture2D(tex, uv);
	vec4 bloom = texture2D(bloomTex, uv);
	return primary + bloom;
}

void main() {
	// Sample the stripe pattern (e.g., rainbow colors)
	vec3 color = texture2D(stripeTex, vUV).rgb;

	// Get brightness values from rain effect
	vec4 brightness = getBrightness(vUV);

	// Apply dithering to reduce color banding
	// Dither: subtract a random value from the brightness
	brightness -= rand( gl_FragCoord.xy, time ) * ditherMagnitude / 3.0;
	
	// Modulate stripe colors by brightness and add highlights
	gl_FragColor = vec4(
		color * brightness.r                                             // Base with stripe pattern
			+ min(cursorColor * cursorIntensity * brightness.g, vec3(1.0))  // Cursor highlight
			+ min(glintColor * glintIntensity * brightness.b, vec3(1.0))    // Glint highlight
			+ backgroundColor,                                           // Background tint
		1.0
	);
}
