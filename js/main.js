import makeConfig from "./config.js";

/*
 * Matrix Digital Rain - Main Entry Point
 * 
 * This is the primary application bootstrap that initializes the Matrix
 * digital rain effect. It handles renderer selection between WebGL and WebGPU,
 * detects software rendering fallbacks, and presents Matrix-themed warnings.
 */

/* 
 * Initialize the main rendering canvas
 * Creates a full-screen canvas element that will display the Matrix effect
 */
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

/*
 * Prevent scrolling on touch devices during Matrix experience
 * Touch movements could interfere with the immersive digital rain effect
 */
document.addEventListener("touchmove", (e) => e.preventDefault(), {
	passive: false,
});

/*
 * WebGPU Capability Detection
 * 
 * WebGPU is the next-generation graphics API that provides better performance
 * and more modern features compared to WebGL. This function checks if the
 * browser supports the required WebGPU interfaces for our Matrix rendering.
 * 
 * @returns {Promise<boolean>} True if WebGPU is fully supported
 */
const supportsWebGPU = async () => {
	return window.GPUQueue != null && navigator.gpu != null && navigator.gpu.getPreferredCanvasFormat != null;
};

/*
 * SwiftShader Software Renderer Detection
 * 
 * SwiftShader is Chrome's software fallback renderer used when hardware
 * acceleration is disabled. While it can run WebGL applications, performance
 * is significantly reduced. This detection helps us warn users about the
 * "blue pill" of disabled hardware acceleration versus the "red pill" of
 * optimal performance.
 * 
 * @returns {boolean} True if running on SwiftShader software renderer
 */
const isRunningSwiftShader = () => {
	const gl = document.createElement("canvas").getContext("webgl");
	const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
	const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
	return renderer.toLowerCase().includes("swiftshader");
};

/*
 * Matrix Initialization Sequence
 * 
 * Once the page loads, we begin the sequence to enter the Matrix. This involves:
 * 1. Parsing URL parameters for customization (like choosing red pill options)
 * 2. Determining the optimal rendering path (WebGPU vs WebGL)
 * 3. Checking for performance limitations (SwiftShader detection)
 * 4. Presenting the iconic choice between blue pill (accept limitations) 
 *    and red pill (optimize for truth/performance)
 */
document.body.onload = async () => {
	/*
	 * Configuration Parsing
	 * URL parameters allow users to customize their Matrix experience,
	 * from choosing different versions (classic, resurrections, etc.)
	 * to adjusting visual effects and performance settings
	 */
	const urlParams = new URLSearchParams(window.location.search);
	const config = makeConfig(Object.fromEntries(urlParams.entries()));
	
	/*
	 * Renderer Selection Logic
	 * Choose between WebGPU (cutting-edge) and WebGL (widely supported)
	 * WebGPU provides better performance and more advanced features,
	 * but WebGL ensures broader browser compatibility
	 */
	const useWebGPU = (await supportsWebGPU()) && ["webgpu"].includes(config.renderer?.toLowerCase());
	const solution = import(`./${useWebGPU ? "webgpu" : "regl"}/main.js`);

	/*
	 * The Matrix Choice: Blue Pill vs Red Pill
	 * 
	 * If hardware acceleration is disabled (SwiftShader detected), we present
	 * the user with a Matrix-themed choice:
	 * - Blue Pill: Accept the performance limitations and continue
	 * - Red Pill: Learn how to enable hardware acceleration for optimal experience
	 * 
	 * This mirrors the film's central metaphor about choosing between 
	 * comfortable ignorance and enlightening truth.
	 */
	if (isRunningSwiftShader() && !config.suppressWarnings) {
		const notice = document.createElement("notice");
		notice.innerHTML = `<div class="notice">
		<p>Wake up, Neo... you've got hardware acceleration disabled.</p>
		<p>This project will still run, incredibly, but at a noticeably low framerate.</p>
		<button class="blue pill">Plug me in</button>
		<a class="red pill" target="_blank" href="https://www.google.com/search?q=chrome+enable+hardware+acceleration">Free me</a>
		`;
		canvas.style.display = "none";
		document.body.appendChild(notice);
		
		/*
		 * Blue Pill Handler
		 * User chooses to continue with software rendering despite limitations.
		 * We suppress further warnings and proceed with the Matrix experience.
		 */
		document.querySelector(".blue.pill").addEventListener("click", async () => {
			config.suppressWarnings = true;
			urlParams.set("suppressWarnings", true);
			history.replaceState({}, "", "?" + unescape(urlParams.toString()));
			(await solution).default(canvas, config);
			canvas.style.display = "unset";
			document.body.removeChild(notice);
		});
	} else {
		/*
		 * Direct Matrix Entry
		 * Hardware acceleration is available or warnings are suppressed.
		 * Initialize the chosen rendering solution immediately.
		 */
		(await solution).default(canvas, config);
	}
};
