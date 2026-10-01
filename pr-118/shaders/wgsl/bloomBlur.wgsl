// ============================================================================
// Matrix Digital Rain - Bloom Blur Compute Shader (WebGPU)
// ============================================================================
// "Let the light guide you" - Gaussian blur for soft Matrix glow effect

const ONE_OVER_SQRT_2PI = 0.39894;

struct Config {
	bloomRadius : f32,      // Blur radius in pixels
	direction : vec2<f32>,  // Blur direction: (1,0) horizontal or (0,1) vertical
};

@group(0) @binding(0) var<uniform> config : Config;
@group(0) @binding(1) var linearSampler : sampler;
@group(0) @binding(2) var tex : texture_2d<f32>;
@group(0) @binding(3) var outputTex : texture_storage_2d<rgba8unorm, write>;

struct ComputeInput {
	@builtin(global_invocation_id) id : vec3<u32>,
};

// Calculate Gaussian probability density function for smooth blur weights
fn gaussianPDF(x : f32) -> f32 {
	return ONE_OVER_SQRT_2PI * exp( -0.5 *
		( x * x ) / ( config.bloomRadius * config.bloomRadius )
	) / config.bloomRadius;
}

@compute @workgroup_size(32, 1, 1) fn computeMain(input : ComputeInput) {

	// Resolve invocation ID to texel coordinate
	var coord = vec2<u32>(input.id.xy);
	var outputSize = textureDimensions(outputTex);

	if (coord.x >= outputSize.x) {
		return;
	}

	// Calculate UV coordinates
	var uv = (vec2<f32>(coord) + 0.5) / vec2<f32>(outputSize);
	var uvOffset = config.direction / vec2<f32>(outputSize);

	// Apply Gaussian blur in the specified direction
	// Sample center pixel
	var weightSum = gaussianPDF(0.0);
	var sum = textureSampleLevel( tex, linearSampler, uv, 0.0) * weightSum;
	
	// Sample pixels along the blur direction with Gaussian weighting
	for (var x : f32 = 1.0; x < config.bloomRadius; x += 1.0) {
		var weight = gaussianPDF(x);
		sum += textureSampleLevel( tex, linearSampler, uv + uvOffset * x, 0.0) * weight;
		sum += textureSampleLevel( tex, linearSampler, uv - uvOffset * x, 0.0) * weight;
		weightSum += weight * 2.0;
	}

	// Normalize by total weight and store result
	textureStore(outputTex, coord, sum / weightSum);
}
