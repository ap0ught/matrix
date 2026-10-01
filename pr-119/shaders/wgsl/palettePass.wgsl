// ============================================================================
// Matrix Digital Rain - Color Palette Compute Shader (WebGPU)
// ============================================================================
// "You take the red pill, you take the blue pill" - Maps brightness to colors

struct Config {
	ditherMagnitude : f32,      // Dither strength to reduce banding
	backgroundColor : vec3<f32>, // Background tint color
	cursorColor : vec3<f32>,     // Leading character color
	glintColor : vec3<f32>,      // Highlight glow color
	cursorIntensity : f32,       // Cursor brightness multiplier
	glintIntensity : f32,        // Glint brightness multiplier
};

// Color lookup table - array of 512 color values
struct Palette {
	colors : array<vec3<f32>, 512>,
};

struct Time {
	seconds : f32,
	frames : i32,
};

@group(0) @binding(0) var<uniform> config : Config;
@group(0) @binding(1) var<uniform> palette : Palette;
@group(0) @binding(2) var<uniform> time : Time;
@group(0) @binding(3) var linearSampler : sampler;
@group(0) @binding(4) var tex : texture_2d<f32>;          // Rain rendering
@group(0) @binding(5) var bloomTex : texture_2d<f32>;     // Bloom glow
@group(0) @binding(6) var outputTex : texture_storage_2d<rgba8unorm, write>;

struct ComputeInput {
	@builtin(global_invocation_id) id : vec3<u32>,
};

const PI : f32 = 3.14159265359;

// Pseudo-random noise function for dithering
fn randomFloat( uv : vec2<f32> ) -> f32 {
	let a = 12.9898;
	let b = 78.233;
	let c = 43758.5453;
	let dt = dot( uv, vec2<f32>( a, b ) );
	let sn = dt % PI;
	return fract(sin(sn) * c);
}

// Combine base rain rendering with bloom glow
fn getBrightness(uv : vec2<f32>) -> vec4<f32> {
	var primary = textureSampleLevel(tex, linearSampler, uv, 0.0);
	var bloom = textureSampleLevel(bloomTex, linearSampler, uv, 0.0);
	return primary + bloom;
}

@compute @workgroup_size(32, 1, 1) fn computeMain(input : ComputeInput) {

	// Resolve the invocation ID to a texel coordinate
	var coord = vec2<u32>(input.id.xy);
	var screenSize = textureDimensions(tex);

	if (coord.x >= screenSize.x) {
		return;
	}

	var uv = vec2<f32>(coord) / vec2<f32>(screenSize);

	// Get combined brightness from rain and bloom
	var brightness = getBrightness(uv);

	// Apply dithering to reduce color banding
	// Dither: subtract a random value from the brightness
	brightness -= randomFloat( uv + vec2<f32>(time.seconds) ) * config.ditherMagnitude / 3.0;

	// Map brightness to color using palette lookup
	// Different channels: R=base glyphs, G=cursor, B=glint
	// Map the brightness to a position in the palette texture
	var paletteIndex = clamp(i32(brightness.r * 512.0), 0, 511);

	// Combine palette color with cursor and glint highlights
	textureStore(outputTex, coord, vec4<f32>(
		palette.colors[paletteIndex]                                          // Base color from palette
			+ min(config.cursorColor * config.cursorIntensity * brightness.g, vec3<f32>(1.0))  // Cursor highlight
			+ min(config.glintColor * config.glintIntensity * brightness.b, vec3<f32>(1.0))    // Glint highlight
			+ config.backgroundColor,                                         // Background tint
		1.0
	));
}

