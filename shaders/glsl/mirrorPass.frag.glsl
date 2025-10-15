// ============================================================================
// Matrix Digital Rain - Mirror/Camera Effect Pass
// ============================================================================
// "Know thyself" - Overlays Matrix code on live camera feed with ripple effects

precision mediump float;
varying vec2 vUV;

// Aspect ratios for proper image scaling
uniform float aspectRatio, cameraAspectRatio;

// Animation time for ripple effects
uniform float time;

// Click positions and times for ripple generation (x, y, timestamp)
uniform vec3 clicks[5];

// Input textures: rain, bloom, and camera feed
uniform sampler2D tex;
uniform sampler2D bloomTex;
uniform sampler2D cameraTex;

void main() {

	// Calculate ripple distortion from recent clicks
	float intensity = 0.0;
	for (int i = 0; i < 5; i++) {
		vec3 click = clicks[i];
		// Distance from this pixel to the click point (aspect-corrected)
		float distanceToClick = length((click.xy - vUV) * vec2(aspectRatio, 1.0));
		// Time since the click occurred
		float elapsedTime = clamp(time - click.z, -100.0, 100.0);
		// Ripple calculation: wave front moves outward from click
		float t = distanceToClick - elapsedTime * 0.5;
		intensity += sin(t * 40.0) / t;  // Decaying sine wave
	}
	intensity *= 0.2;

	// Apply slight UV distortion based on ripple intensity
	vec2 uv = vUV + intensity * 0.001;

	// Calculate webcam UV with aspect ratio correction
	float webcamAspectAdjust = cameraAspectRatio / aspectRatio;
	vec2 webcamTransform = vec2(1.0, webcamAspectAdjust);
	if (webcamAspectAdjust > 1.0) {
		webcamTransform = vec2(1.0 / webcamAspectAdjust, 1.0);
	}
	vec2 webcamUV = ((uv - 0.5) * webcamTransform) + 0.5;

	// Sample webcam with green tint and vignette
	vec3 webcam = texture2D(cameraTex, 1.0 - webcamUV).rgb;
	webcam *= mix(vec3(0.1, 0.3, 0.0), vec3(0.9, 1.0, 0.7), 1.0 - length(vUV - 0.5) * 1.5);

	// Blend Matrix code with webcam feed
	vec3 code = mix(
		webcam, 
		vec3(0.7, 1.0, 0.4),  // Green Matrix color
		texture2D(tex, uv).r * (1.0 + intensity * 0.3) + texture2D(bloomTex, uv).r * 0.5
	);

	gl_FragColor = vec4(code, 1.0);
}
