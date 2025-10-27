// ============================================================================
// Matrix Digital Rain - Final Output Pass (WebGPU)
// ============================================================================
// "Welcome to the real world" - Final blit to screen with coordinate flip

@group(0) @binding(0) var nearestSampler : sampler;
@group(0) @binding(1) var tex : texture_2d<f32>;

struct VertOutput {
	@builtin(position) Position : vec4<f32>,
	@location(0) uv : vec2<f32>,
};

// Vertex shader - generates a fullscreen triangle pair (quad)
@vertex fn vertMain(@builtin(vertex_index) index : u32) -> VertOutput {
	// Generate UV coordinates from vertex index: (0,0), (1,0), (0,1), (1,1)
	var uv = vec2<f32>(f32(index % 2u), f32((index + 1u) % 6u / 3u));
	// Convert to normalized device coordinates: -1 to 1
	var position = vec4<f32>(uv * 2.0 - 1.0, 1.0, 1.0);
	return VertOutput(position, uv);
}

// Fragment shader - samples the input texture and outputs to screen
@fragment fn fragMain(input : VertOutput) -> @location(0) vec4<f32> {
	var uv = input.uv;
	// Flip Y coordinate to match screen orientation
	uv.y = 1.0 - uv.y;
	// Sample and return the final color
	return textureSample( tex, nearestSampler, uv );
}
