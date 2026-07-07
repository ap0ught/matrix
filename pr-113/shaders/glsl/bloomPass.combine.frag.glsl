// ============================================================================
// Matrix Digital Rain - Bloom Combine Pass
// ============================================================================
// "The answer is out there, Neo" - Combines multiple blur levels for rich glow

precision mediump float;

// Blur pyramid - each level is increasingly blurred for multi-scale glow
uniform sampler2D pyr_0;  // Finest detail
uniform sampler2D pyr_1;
uniform sampler2D pyr_2;
uniform sampler2D pyr_3;
uniform sampler2D pyr_4;  // Most blurred
uniform float bloomStrength;

varying vec2 vUV;

void main() {
	vec4 total = vec4(0.);
	
	// Combine all blur levels with decreasing weights
	// This creates a smooth, natural-looking glow with both tight and wide halos
	total += texture2D(pyr_0, vUV) * 0.96549;
	total += texture2D(pyr_1, vUV) * 0.92832;
	total += texture2D(pyr_2, vUV) * 0.88790;
	total += texture2D(pyr_3, vUV) * 0.84343;
	total += texture2D(pyr_4, vUV) * 0.79370;
	
	// Apply overall bloom strength for user control
	gl_FragColor = total * bloomStrength;
}
