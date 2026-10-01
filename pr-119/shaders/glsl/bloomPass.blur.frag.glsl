// ============================================================================
// Matrix Digital Rain - Bloom Blur Pass
// ============================================================================
// "Everything begins with choice" - Creates the soft glow around bright glyphs

precision mediump float;

uniform float width, height;
uniform sampler2D tex;
uniform vec2 direction;  // Blur direction: horizontal (1,0) or vertical (0,1)

varying vec2 vUV;

void main() {
	// Aspect ratio correction to maintain circular blur
	vec2 size = width > height ? vec2(width / height, 1.) : vec2(1., height / width);
	
	// Simple 3-tap blur using Gaussian-like weights
	// Center sample weighted higher (0.442), side samples lower (0.279 each)
	// Total weights sum to 1.0 for energy conservation
	gl_FragColor =
		texture2D(tex, vUV) * 0.442 +
		(
			texture2D(tex, vUV + direction / max(width, height) * size) +
			texture2D(tex, vUV - direction / max(width, height) * size)
		) * 0.279;
}
