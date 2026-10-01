// ============================================================================
// Matrix Digital Rain - Custom Image Overlay Pass
// ============================================================================
// "Free your mind" - Reveals a custom background image through the Matrix code

precision mediump float;

// Input textures: rain, bloom, and custom background image
uniform sampler2D tex;
uniform sampler2D bloomTex;
uniform sampler2D backgroundTex;

varying vec2 vUV;

// Combine base rain rendering with bloom glow
vec4 getBrightness(vec2 uv) {
	vec4 primary = texture2D(tex, uv);
	vec4 bloom = texture2D(bloomTex, uv);
	return primary + bloom;
}

void main() {
	// Sample the custom background image
	vec3 bgColor = texture2D(backgroundTex, vUV).rgb;

	// Get brightness from Matrix rain effect
	// Combine the texture and bloom, then blow it out to reveal more of the image
	vec4 brightness = getBrightness(vUV);
	
	// Modulate background by rain brightness
	// Cursor (brightness.g) is weighted 2x for stronger reveal effect
	gl_FragColor = vec4(bgColor * (brightness.r + brightness.g * 2.0), 1.0);
}
