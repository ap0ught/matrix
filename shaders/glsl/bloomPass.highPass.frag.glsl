// ============================================================================
// Matrix Digital Rain - Bloom High-Pass Filter
// ============================================================================
// "Let the light guide you" - Isolates bright areas that will create the glow

precision mediump float;

uniform sampler2D tex;
uniform float highPassThreshold;

varying vec2 vUV;

void main() {
	vec4 color = texture2D(tex, vUV);
	
	// Filter out dark areas, keeping only bright parts above threshold
	// This creates the characteristic Matrix glow on the brightest glyphs
	if (color.r < highPassThreshold) color.r = 0.0;
	if (color.g < highPassThreshold) color.g = 0.0;
	if (color.b < highPassThreshold) color.b = 0.0;
	
	gl_FragColor = color;
}
