// ============================================================================
// Matrix Digital Rain - Bloom Combine Compute Shader (WebGPU)
// ============================================================================
// "The answer is out there, Neo" - Combines multiple blur levels for rich glow

struct Config {
	pyramidHeight : f32,     // Number of blur levels
	bloomStrength : f32      // Overall bloom intensity
};

@group(0) @binding(0) var<uniform> config : Config;
@group(0) @binding(1) var linearSampler : sampler;

// Blur pyramid textures - each progressively more blurred
@group(0) @binding(2) var tex1 : texture_2d<f32>;  // Finest detail
@group(0) @binding(3) var tex2 : texture_2d<f32>;
@group(0) @binding(4) var tex3 : texture_2d<f32>;
@group(0) @binding(5) var tex4 : texture_2d<f32>;  // Most blurred
@group(0) @binding(6) var outputTex : texture_storage_2d<rgba8unorm, write>;

struct ComputeInput {
	@builtin(global_invocation_id) id : vec3<u32>,
};

@compute @workgroup_size(32, 1, 1) fn computeMain(input : ComputeInput) {

	// Resolve invocation ID to texel coordinate
	var coord = vec2<u32>(input.id.xy);
	var outputSize = textureDimensions(outputTex);

	if (coord.x >= outputSize.x) {
		return;
	}

	// Calculate UV coordinates
	var uv = (vec2<f32>(coord) + 0.5) / vec2<f32>(outputSize);
	var sum = vec4<f32>(0.0);

	// Combine all blur levels with weighted blending
	// Loop unrolled for WebGPU compatibility
	// Weight calculation: finer details get higher weight
	
	{
		var i = 0.0;
		var weight = (1.0 - i / config.pyramidHeight);
		weight = pow(weight + 0.5, 1.0 / 3.0);
		sum += textureSampleLevel( tex1, linearSampler, uv, i + 1.0 ) * weight;
	}
	{
		var i = 1.0;
		var weight = (1.0 - i / config.pyramidHeight);
		weight = pow(weight + 0.5, 1.0 / 3.0);
		sum += textureSampleLevel( tex2, linearSampler, uv, i + 1.0 ) * weight;
	}
	{
		var i = 2.0;
		var weight = (1.0 - i / config.pyramidHeight);
		weight = pow(weight + 0.5, 1.0 / 3.0);
		sum += textureSampleLevel( tex3, linearSampler, uv, i + 1.0 ) * weight;
	}
	{
		var i = 3.0;
		var weight = (1.0 - i / config.pyramidHeight);
		weight = pow(weight + 0.5, 1.0 / 3.0);
		sum += textureSampleLevel( tex4, linearSampler, uv, i + 1.0 ) * weight;
	}

	// Apply overall bloom strength and store result
	textureStore(outputTex, coord, sum * config.bloomStrength);
}
