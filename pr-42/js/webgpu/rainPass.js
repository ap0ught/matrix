/*
 * Matrix Rain Pass - WebGPU Implementation
 *
 * This is the heart of the Matrix digital rain effect using WebGPU rendering.
 * Like the cascading green code Neo sees when he first perceives the Matrix's
 * true nature, this pass generates the endless streams of falling glyphs.
 *
 * The rain pass handles:
 * - Glyph positioning and animation in columns
 * - Multi-channel Signed Distance Field (MSDF) glyph rendering
 * - Sawtooth wave functions for non-colliding raindrop behavior
 * - Volumetric 3D effects with perspective depth
 * - Interactive ripple effects for user input
 */

import { structs } from "../../lib/gpu-buffer.js";
import { makeRenderTarget, loadTexture, loadShader, makeUniformBuffer, makeBindGroup, makePass } from "./utils.js";

/*
 * Ripple Effect Types
 *
 * When the Matrix responds to external stimuli (like mouse clicks),
 * it creates ripples that propagate through the digital rain.
 * These ripples represent disturbances in the simulation's fabric.
 */
const rippleTypes = {
	box: 0, // Square ripple effect - geometric, digital disturbance
	circle: 1, // Circular ripple effect - organic, natural disturbance
};

/*
 * Geometry Constants
 *
 * Each raindrop glyph is rendered as a quad (rectangle) made of two triangles.
 * This constant defines how many vertices we need per quad for efficient
 * GPU batch rendering.
 */
const numVerticesPerQuad = 2 * 3;

/*
 * Configuration Buffer Creation
 *
 * This function creates a GPU buffer containing all the parameters needed
 * to control the rain effect. It's like uploading the Matrix's operating
 * parameters to the simulation's memory banks.
 *
 * @param {GPUDevice} device - WebGPU device for buffer creation
 * @param {Object} configUniforms - Uniform buffer layout specification
 * @param {Object} config - User configuration parameters
 * @param {number} density - Rain density multiplier for 3D effects
 * @param {Array} gridSize - [width, height] of the glyph grid
 * @param {Matrix} glyphTransform - Transformation matrix for glyph rotation/flipping
 * @returns {GPUBuffer} Uniform buffer containing configuration data
 */
const makeConfigBuffer = (device, configUniforms, config, density, gridSize, glyphTransform) => {
	/*
	 * Configuration Data Assembly
	 *
	 * Combine user configuration with computed values needed for rendering:
	 * - Grid dimensions for proper raindrop column calculation
	 * - Debug view toggle for development and troubleshooting
	 * - Ripple parameters for interactive effects
	 * - Slant calculations for angled rain (like wind in the Matrix)
	 * - MSDF parameters for crisp glyph rendering
	 * - Glyph transformation matrix for rotation and mirroring
	 */
	const configData = {
		...config,
		gridSize,
		density,
		showDebugView: config.effect === "none", // Debug mode shows raw rain structure
		rippleType: config.rippleTypeName in rippleTypes ? rippleTypes[config.rippleTypeName] : -1,
		/*
		 * Slant Scale Compensation
		 * When rain falls at an angle, we need to adjust the visual scale
		 * to maintain consistent column spacing. This formula prevents
		 * gaps or overlaps when the rain is tilted.
		 */
		slantScale: 1 / (Math.abs(Math.sin(2 * config.slant)) * (Math.sqrt(2) - 1) + 1),
		slantVec: [Math.cos(config.slant), Math.sin(config.slant)],
		msdfPxRange: 4, // MSDF pixel range for distance field sampling
		glyphTransform,
	};

	/* Uncomment for debugging configuration values:
	   console.table(configData); */

	return makeUniformBuffer(device, configUniforms, configData);
};

/*
 * Rain Pass Factory Function
 *
 * This function creates the complete Matrix rain rendering system.
 * Like constructing the digital world from its fundamental code,
 * this assembles all the components needed to generate the iconic
 * cascading green glyphs.
 *
 * @param {Object} params - Factory parameters
 * @param {Object} params.config - Matrix configuration settings
 * @param {GPUDevice} params.device - WebGPU device for GPU operations
 * @param {GPUBuffer} params.timeBuffer - Time uniform for animation
 * @returns {Object} Complete rain pass with render function
 */
export default ({ config, device, timeBuffer }) => {
	/* Import glMatrix for 3D math operations */
	const { mat2, mat4, vec2, vec3 } = glMatrix;

	/*
	 * Asset Loading Pipeline
	 *
	 * Load all the resources needed for the Matrix rain:
	 * - MSDF glyph texture: The actual Matrix symbols
	 * - Glint texture: Highlights and special effects on glyphs
	 * - Base texture: Optional surface material for glyphs
	 * - Glint surface texture: Optional material for glyph highlights
	 * - Shader code: GPU programs for rendering the rain
	 */
	const assets = [
		loadTexture(device, config.glyphMSDFURL), // Main glyph texture
		loadTexture(device, config.glintMSDFURL), // Glyph highlight texture
		loadTexture(device, config.baseTextureURL, false, true), // Optional base material
		loadTexture(device, config.glintTextureURL, false, true), // Optional glint material
		loadShader(device, "shaders/wgsl/rainPass.wgsl"), // Rain rendering shader
	];

	/*
	 * Volumetric Density Calculation
	 *
	 * In 3D volumetric mode, we multiply the number of columns to create
	 * depth layers that overlap, simulating raindrops at different distances.
	 * This creates the illusion that the code extends infinitely into
	 * the screen, just like Neo's perception in the construct loading program.
	 */
	const density = config.volumetric && config.effect !== "none" ? config.density : 1;
	const gridSize = [Math.floor(config.numColumns * density), config.numColumns];
	const numCells = gridSize[0] * gridSize[1];

	/*
	 * Geometry Generation Strategy
	 *
	 * - 2D Mode: Single fullscreen quad that samples the rain texture
	 * - 3D Mode: Grid of quads positioned at different depths in space
	 *
	 * The volumetric mode requires individual quads for each column/row
	 * combination so they can be positioned independently in 3D space.
	 */
	const numQuads = config.volumetric ? numCells : 1;

	/*
	 * Glyph Transformation Matrix
	 *
	 * This matrix handles user-requested glyph modifications:
	 * - Horizontal flipping (mirroring) for alternate aesthetics
	 * - Rotation for angled or upside-down code effects
	 *
	 * The transformations are applied in matrix multiplication order:
	 * scaling first (for flipping), then rotation.
	 */
	const glyphTransform = mat2.fromScaling(mat2.create(), vec2.fromValues(config.glyphFlip ? -1 : 1, 1));
	mat2.rotate(glyphTransform, glyphTransform, (config.glyphRotation * Math.PI) / 180);

	const transform = mat4.create();
	if (config.volumetric && config.isometric) {
		mat4.rotateX(transform, transform, (Math.PI * 1) / 8);
		mat4.rotateY(transform, transform, (Math.PI * 1) / 4);
		mat4.translate(transform, transform, vec3.fromValues(0, 0, -1));
		mat4.scale(transform, transform, vec3.fromValues(1, 1, 2));
	} else {
		mat4.translate(transform, transform, vec3.fromValues(0, 0, -1));
	}
	const camera = mat4.create();

	// TODO: vantage points, multiple renders

	// We use the different channels for different parts of the raindrop
	const renderFormat = "rgba8unorm";

	const linearSampler = device.createSampler({
		magFilter: "linear",
		minFilter: "linear",
	});

	const renderPassConfig = {
		colorAttachments: [
			{
				// view: null,
				loadOp: "clear",
				storeOp: "store",
			},
			{
				// view: null,
				loadOp: "clear",
				storeOp: "store",
			},
		],
	};

	let configBuffer;
	let sceneUniforms;
	let sceneBuffer;
	let introPipeline;
	let computePipeline;
	let renderPipeline;
	let introBindGroup;
	let computeBindGroup;
	let renderBindGroup;
	let output;
	let highPassOutput;

	const loaded = (async () => {
		const [glyphMSDFTexture, glintMSDFTexture, baseTexture, glintTexture, rainShader] = await Promise.all(assets);

		const rainShaderUniforms = structs.from(rainShader.code);
		configBuffer = makeConfigBuffer(device, rainShaderUniforms.Config, config, density, gridSize, glyphTransform);

		const introCellsBuffer = device.createBuffer({
			size: gridSize[0] * rainShaderUniforms.IntroCell.minSize,
			usage: GPUBufferUsage.STORAGE,
		});

		const cellsBuffer = device.createBuffer({
			size: numCells * rainShaderUniforms.Cell.minSize,
			usage: GPUBufferUsage.STORAGE,
		});

		sceneUniforms = rainShaderUniforms.Scene;
		sceneBuffer = makeUniformBuffer(device, sceneUniforms);

		const additiveBlendComponent = {
			operation: "add",
			srcFactor: "one",
			dstFactor: "one",
		};

		[introPipeline, computePipeline, renderPipeline] = await Promise.all([
			device.createComputePipelineAsync({
				layout: "auto",
				compute: {
					module: rainShader.module,
					entryPoint: "computeIntro",
				},
			}),

			device.createComputePipelineAsync({
				layout: "auto",
				compute: {
					module: rainShader.module,
					entryPoint: "computeMain",
				},
			}),

			device.createRenderPipelineAsync({
				layout: "auto",
				vertex: {
					module: rainShader.module,
					entryPoint: "vertMain",
				},
				fragment: {
					module: rainShader.module,
					entryPoint: "fragMain",
					targets: [
						{
							format: renderFormat,
							blend: {
								color: additiveBlendComponent,
								alpha: additiveBlendComponent,
							},
						},
						{
							format: renderFormat,
							blend: {
								color: additiveBlendComponent,
								alpha: additiveBlendComponent,
							},
						},
					],
				},
			}),
		]);

		introBindGroup = makeBindGroup(device, introPipeline, 0, [configBuffer, timeBuffer, introCellsBuffer]);
		computeBindGroup = makeBindGroup(device, computePipeline, 0, [configBuffer, timeBuffer, cellsBuffer, introCellsBuffer]);
		renderBindGroup = makeBindGroup(device, renderPipeline, 0, [
			configBuffer,
			timeBuffer,
			sceneBuffer,
			linearSampler,
			glyphMSDFTexture.createView(),
			glintMSDFTexture.createView(),
			baseTexture.createView(),
			glintTexture.createView(),
			cellsBuffer,
		]);
	})();

	const build = (size) => {
		// Update scene buffer: camera and transform math for the volumetric mode
		const aspectRatio = size[0] / size[1];
		if (config.volumetric && config.isometric) {
			if (aspectRatio > 1) {
				mat4.orthoZO(camera, -1.5 * aspectRatio, 1.5 * aspectRatio, -1.5, 1.5, -1000, 1000);
			} else {
				mat4.orthoZO(camera, -1.5, 1.5, -1.5 / aspectRatio, 1.5 / aspectRatio, -1000, 1000);
			}
		} else {
			mat4.perspectiveZO(camera, (Math.PI / 180) * 90, aspectRatio, 0.0001, 1000);
		}
		const screenSize = aspectRatio > 1 ? [1, aspectRatio] : [1 / aspectRatio, 1];
		device.queue.writeBuffer(sceneBuffer, 0, sceneUniforms.toBuffer({ screenSize, camera, transform }));

		// Update
		output?.destroy();
		output = makeRenderTarget(device, size, renderFormat);

		highPassOutput?.destroy();
		highPassOutput = makeRenderTarget(device, size, renderFormat);

		return {
			primary: output,
			highPass: highPassOutput,
		};
	};

	const run = (encoder, shouldRender) => {
		// We render the code into an Target using MSDFs: https://github.com/Chlumsky/msdfgen

		const introPass = encoder.beginComputePass();
		introPass.setPipeline(introPipeline);
		introPass.setBindGroup(0, introBindGroup);
		introPass.dispatchWorkgroups(Math.ceil(gridSize[0] / 32), 1, 1);
		introPass.end();

		const computePass = encoder.beginComputePass();
		computePass.setPipeline(computePipeline);
		computePass.setBindGroup(0, computeBindGroup);
		computePass.dispatchWorkgroups(Math.ceil(gridSize[0] / 32), gridSize[1], 1);
		computePass.end();

		if (shouldRender) {
			renderPassConfig.colorAttachments[0].view = output.createView();
			renderPassConfig.colorAttachments[1].view = highPassOutput.createView();
			const renderPass = encoder.beginRenderPass(renderPassConfig);
			renderPass.setPipeline(renderPipeline);
			renderPass.setBindGroup(0, renderBindGroup);
			renderPass.draw(numVerticesPerQuad * numQuads, 1, 0, 0);
			renderPass.end();
		}
	};

	return makePass("Rain", loaded, build, run);
};
