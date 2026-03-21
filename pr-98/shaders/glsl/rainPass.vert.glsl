// ============================================================================
// Matrix Digital Rain - Vertex Shader
// ============================================================================
// "Follow the white rabbit" - This shader positions each glyph quad in the
// Matrix rain effect. It handles both 2D screen-space and 3D volumetric modes.

#define PI 3.14159265359
precision lowp float;

// Vertex attributes - define the quad corners for each glyph
attribute vec2 aPosition, aCorner;

// State textures - contain the current state of each cell in the grid
uniform sampler2D raindropState, symbolState, effectState;

// Layout parameters - control glyph spacing and density
uniform float density;
uniform vec2 quadSize;
uniform float glyphHeightToWidth, glyphVerticalSpacing;

// 3D transformation matrices for volumetric mode
uniform mat4 camera, transform;

// Screen dimensions for 2D mode positioning
uniform vec2 screenSize;

// Animation parameters - control movement through time
uniform float time, animationSpeed, forwardSpeed;

// Mode flag - switches between 2D flat and 3D volumetric rendering
uniform bool volumetric;

// Varying outputs passed to fragment shader
varying vec2 vUV;
varying vec4 vRaindrop, vSymbol, vEffect;
varying float vDepth;

// Pseudo-random number generator using a hash function
// "There is no spoon" - deterministic chaos creates the illusion of randomness
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}

void main() {

	// Calculate UV coordinates for this quad vertex
	vUV = (aPosition + aCorner) * quadSize;
	
	// Sample cell state data - each cell contains raindrop, symbol, and effect information
	vRaindrop = texture2D(raindropState, aPosition * quadSize);
	vSymbol   = texture2D(  symbolState, aPosition * quadSize);
	vEffect   = texture2D(  effectState, aPosition * quadSize);

	// Calculate the world space position
	// In volumetric mode, glyphs move through 3D space like rainfall
	float quadDepth = 0.0;
	if (volumetric) {
		// Each column has a unique starting depth position
		float startDepth = rand(vec2(aPosition.x, 0.));
		// Animate depth over time to create the falling effect
		quadDepth = fract(startDepth + time * animationSpeed * forwardSpeed);
		vDepth = quadDepth;
	}
	
	// Position the quad in grid space, accounting for vertical spacing and density
	vec2 position = (aPosition * vec2(1., glyphVerticalSpacing) + aCorner * vec2(density, 1.)) * quadSize;
	
	// Add vertical offset in volumetric mode for staggered appearance
	if (volumetric) {
		position.y += rand(vec2(aPosition.x, 1.)) * quadSize.y;
	}
	
	// Convert to normalized device coordinates (-1 to 1)
	vec4 pos = vec4((position - 0.5) * 2.0, quadDepth, 1.0);

	// Convert the world space position to screen space
	if (volumetric) {
		// In 3D mode: apply aspect ratio correction and transform matrices
		pos.x /= glyphHeightToWidth;
		pos = camera * transform * pos;
	} else {
		// In 2D mode: simple screen-space scaling
		pos.xy *= screenSize;
	}

	gl_Position = pos;
}
