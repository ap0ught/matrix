// ============================================================================
// Matrix Digital Rain - Color Palette Pass
// ============================================================================
// "You take the red pill, you take the blue pill" - Maps brightness to colors

precision mediump float;
#define PI 3.14159265359

// Input textures: rain rendering and bloom glow
uniform sampler2D tex;
uniform sampler2D bloomTex;

// Color lookup table - maps brightness values to final colors
uniform sampler2D paletteTex;

// Dithering reduces color banding in gradients
uniform float ditherMagnitude;
uniform float time;

// Color channels for different glyph types
uniform vec3 backgroundColor, cursorColor, glintColor;
uniform float cursorIntensity, glintIntensity;

varying vec2 vUV;

// Pseudo-random noise function for dithering
highp float rand( const in vec2 uv, const in float t ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c + t);
}

// Combine base rain rendering with bloom glow
vec4 getBrightness(vec2 uv) {
	vec4 primary = texture2D(tex, uv);
	vec4 bloom = texture2D(bloomTex, uv);
	return primary + bloom;
}

void main() {
	// Get combined brightness from rain and bloom
	vec4 brightness = getBrightness(vUV);

	// Apply dithering to reduce color banding
	// Dither: subtract a random value from the brightness
	brightness -= rand( gl_FragCoord.xy, time ) * ditherMagnitude / 3.0;

	// Map brightness to color using the palette lookup texture
	// Different channels represent: R=base glyphs, G=cursor, B=glint
	// Map the brightness to a position in the palette texture
	gl_FragColor = vec4(
		texture2D( paletteTex, vec2(brightness.r, 0.0)).rgb       // Base color from palette
			+ min(cursorColor * cursorIntensity * brightness.g, vec3(1.0))  // Cursor highlight
			+ min(glintColor * glintIntensity * brightness.b, vec3(1.0))    // Glint highlight
			+ backgroundColor,                                      // Background tint
		1.0
	);
}
