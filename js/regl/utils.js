/*
 * REGL Utilities - WebGL Rendering Helpers
 * 
 * This module provides utility functions for the REGL-based WebGL renderer.
 * Like the utilities that keep Zion's machines running, these functions handle
 * the fundamental operations needed for Matrix rain rendering.
 * 
 * REGL is a functional WebGL wrapper that treats graphics operations as
 * pure functions - very fitting for the Matrix's deterministic nature.
 */

/*
 * Pass Texture Factory
 * 
 * Creates textures used for intermediate rendering passes in the graphics pipeline.
 * These textures serve as temporary storage for image data between processing steps,
 * like frames in the Matrix's simulation buffer.
 * 
 * @param {Object} regl - REGL context for WebGL operations
 * @param {boolean} halfFloat - Whether to use 16-bit (half) or 8-bit precision
 * @returns {Object} REGL texture configuration object
 * 
 * Half-float textures provide higher precision for calculations while using
 * less memory than full 32-bit floats - crucial for smooth raindrop animation.
 */
const makePassTexture = (regl, halfFloat) =>
	regl.texture({
		width: 1,           // Initial size - will be resized when used
		height: 1,          // Initial size - will be resized when used  
		type: halfFloat ? "half float" : "uint8",  // Data precision type
		wrap: "clamp",      // Prevent texture wrapping at edges
		min: "linear",      // Linear filtering for smooth scaling
		mag: "linear",      // Linear filtering for smooth scaling
	});

/*
 * Frame Buffer Object (FBO) Factory
 * 
 * Creates frame buffer objects for off-screen rendering. Think of these as
 * alternative reality buffers where we can render effects before compositing
 * them into the final Matrix display.
 * 
 * @param {Object} regl - REGL context
 * @param {boolean} halfFloat - Precision level for the color buffer
 * @returns {Object} REGL framebuffer object
 */
const makePassFBO = (regl, halfFloat) => regl.framebuffer({ color: makePassTexture(regl, halfFloat) });

/*
 * Double Buffer System - Ping-Pong Rendering
 * 
 * Creates a pair of framebuffers that alternate between being source and destination.
 * This is essential for iterative GPU computations like particle physics - each frame
 * reads from one buffer while writing to the other, then they swap roles.
 * 
 * Like the Matrix's temporal duality, we need two states to create the illusion
 * of continuous change from discrete computational steps.
 * 
 * @param {Object} regl - REGL context
 * @param {Object} props - Texture properties for the buffers
 * @returns {Object} Double buffer with front() and back() accessor functions
 */
const makeDoubleBuffer = (regl, props) => {
	/*
	 * Create Two Identical Framebuffers
	 * Each contains a color texture with the specified properties.
	 * No depth/stencil buffer needed for most Matrix effects.
	 */
	const state = Array(2)
		.fill()
		.map(() =>
			regl.framebuffer({
				color: regl.texture(props),
				depthStencil: false,  // No depth testing needed for 2D effects
			})
		);
	
	/*
	 * Buffer Access Functions
	 * front() and back() alternate based on the frame tick count.
	 * This creates the ping-pong effect needed for iterative calculations.
	 */
	return {
		front: ({ tick }) => state[tick % 2],      // Current frame's source buffer
		back: ({ tick }) => state[(tick + 1) % 2], // Current frame's destination buffer
	};
};

/*
 * Power-of-Two Check
 * 
 * WebGL has historically required power-of-two textures for certain operations
 * like mipmapping. This utility checks if a number is a power of two using
 * logarithmic math instead of bit manipulation for clarity.
 * 
 * @param {number} x - Number to test
 * @returns {boolean} True if x is a power of 2
 */
const isPowerOfTwo = (x) => Math.log2(x) % 1 == 0;

/*
 * Asynchronous Image Loader
 * 
 * Loads images for use as textures while providing immediate fallback texture.
 * This prevents rendering errors when assets haven't loaded yet - the Matrix
 * continues running even while loading new reality data.
 * 
 * @param {Object} regl - REGL context
 * @param {string} url - Image URL to load
 * @param {boolean} mipmap - Whether to generate mipmaps for the texture
 * @returns {Object} Texture accessor with loading state management
 */
const loadImage = (regl, url, mipmap) => {
	/*
	 * Initialize with 1x1 black pixel as fallback
	 * This ensures rendering can proceed immediately even before image loads
	 */
	let texture = regl.texture([[0]]);
	let loaded = false;
	
	return {
		/*
		 * Texture Accessor
		 * Returns the current texture, warning if still loading
		 */
		texture: () => {
			if (!loaded && url != null) {
				console.warn(`texture still loading: ${url}`);
			}
			return texture;
		},
		/*
		 * Width Accessor
		 * Returns texture width, defaulting to 1 if still loading
		 */
		width: () => {
			if (!loaded && url != null) {
				console.warn(`texture still loading: ${url}`);
			}
			return loaded ? texture.width : 1;
		},
		/*
		 * Height Accessor  
		 * Returns texture height, defaulting to 1 if still loading
		 */
		height: () => {
			if (!loaded && url != null) {
				console.warn(`texture still loading: ${url}`);
			}
			return loaded ? texture.height : 1;
		},
		loaded: (async () => {
			if (url != null) {
				const data = new Image();
				data.crossOrigin = "anonymous";
				data.src = url;
				await data.decode();
				loaded = true;
				if (mipmap) {
					if (!isPowerOfTwo(data.width) || !isPowerOfTwo(data.height)) {
						console.warn(`Can't mipmap a non-power-of-two image: ${url}`);
					}
					mipmap = false;
				}
				texture = regl.texture({
					data,
					mag: "linear",
					min: mipmap ? "mipmap" : "linear",
					flipY: true,
				});
			}
		})(),
	};
};

const loadText = (url) => {
	let text = "";
	let loaded = false;
	return {
		text: () => {
			if (!loaded) {
				console.warn(`text still loading: ${url}`);
			}
			return text;
		},
		loaded: (async () => {
			if (url != null) {
				text = await (await fetch(url)).text();
				loaded = true;
			}
		})(),
	};
};

const makeFullScreenQuad = (regl, uniforms = {}, context = {}) =>
	regl({
		vert: `
		precision mediump float;
		attribute vec2 aPosition;
		varying vec2 vUV;
		void main() {
			vUV = 0.5 * (aPosition + 1.0);
			gl_Position = vec4(aPosition, 0, 1);
		}
	`,

		frag: `
		precision mediump float;
		varying vec2 vUV;
		uniform sampler2D tex;
		void main() {
			gl_FragColor = texture2D(tex, vUV);
		}
	`,

		attributes: {
			aPosition: [-4, -4, 4, -4, 0, 4],
		},
		count: 3,

		uniforms: {
			...uniforms,
			time: regl.context("time"),
			tick: regl.context("tick"),
		},

		context,

		depth: { enable: false },
	});

const make1DTexture = (regl, rgbas) => {
	const data = rgbas.map((rgba) => rgba.map((f) => Math.floor(f * 0xff))).flat();
	return regl.texture({
		data,
		width: data.length / 4,
		height: 1,
		format: "rgba",
		mag: "linear",
		min: "linear",
	});
};

const makePass = (outputs, ready, setSize, execute) => ({
	outputs: outputs ?? {},
	ready: ready ?? Promise.resolve(),
	setSize: setSize ?? (() => {}),
	execute: execute ?? (() => {}),
});

const makePipeline = (context, steps) =>
	steps.filter((f) => f != null).reduce((pipeline, f, i) => [...pipeline, f(context, i == 0 ? null : pipeline[i - 1].outputs)], []);

export { makePassTexture, makePassFBO, makeDoubleBuffer, loadImage, loadText, makeFullScreenQuad, make1DTexture, makePass, makePipeline };
