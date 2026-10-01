import { structs } from "../../lib/gpu-buffer.js";
import { makeUniformBuffer, makePipeline } from "./utils.js";

import makeRain from "./rainPass.js";
import makeBloomPass from "./bloomPass.js";
import makePalettePass from "./palettePass.js";
import makeStripePass from "./stripePass.js";
import makeImagePass from "./imagePass.js";
import makeMirrorPass from "./mirrorPass.js";
import makeEndPass from "./endPass.js";
import { setupCamera, cameraCanvas, cameraAspectRatio, cameraSize } from "../camera.js";
import { setupFullscreenToggle } from "../fullscreen.js";
import { createEffectsMapping, getEffectPass } from "../effects.js";

const loadJS = (src) =>
	new Promise((resolve, reject) => {
		const tag = document.createElement("script");
		tag.onload = resolve;
		tag.onerror = reject;
		tag.src = src;
		document.body.appendChild(tag);
	});

/*
 * gl-matrix installs a page global, so it only needs injecting once — even when the renderer is
 * rebuilt for a new config (see `updateConfig` below).
 */
const scriptLoads = new Map();
const loadScriptOnce = (src) => {
	if (!scriptLoads.has(src)) {
		scriptLoads.set(src, loadJS(src));
	}
	return scriptLoads.get(src);
};

/*
 * The renderer currently attached to a canvas, so `updateConfig` can tear it down and build a new
 * pipeline on the same canvas (gallery item picks, screensaver mode switches).
 */
let activeSession = null;

const startWebGPUMatrix = async (canvas, config) => {
	await loadScriptOnce("lib/gl-matrix.js");

	// Setup fullscreen toggle with proper cleanup
	const cleanupFullscreen = setupFullscreenToggle(canvas);

	if (config.useCamera) {
		await setupCamera();
	}

	const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
	const adapter = await navigator.gpu.requestAdapter();
	const device = await adapter.requestDevice();
	const canvasContext = canvas.getContext("webgpu");

	// console.table(device.limits);

	canvasContext.configure({
		device,
		format: canvasFormat,
		alphaMode: "opaque",
		usage:
			// GPUTextureUsage.STORAGE_BINDING |
			GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
	});

	const timeUniforms = structs.from(`struct Time { seconds : f32, frames : i32, };`).Time;
	const timeBuffer = makeUniformBuffer(device, timeUniforms);
	const cameraTex = device.createTexture({
		size: cameraSize,
		format: "rgba8unorm",
		usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
	});

	const context = {
		config,
		adapter,
		device,
		canvas,
		canvasContext,
		timeBuffer,
		canvasFormat,
		cameraTex,
		cameraAspectRatio,
		cameraSize,
	};

	// Create dynamic effects mapping
	const passModules = {
		makePalettePass,
		makeStripePass,
		makeImagePass,
		makeMirrorPass,
	};
	const effects = createEffectsMapping("webgpu", passModules);
	const effectPass = getEffectPass(config.effect, effects, "palette");
	const pipeline = await makePipeline(context, [makeRain, makeBloomPass, effectPass, makeEndPass]);

	const targetFrameTimeMilliseconds = 1000 / config.fps;
	let frames = 0;
	let start = NaN;
	let last = NaN;
	let outputs;

	const renderLoop = (now) => {
		if (isNaN(start)) {
			start = now;
		}

		if (isNaN(last)) {
			last = start;
		}

		const shouldRender = config.fps >= 60 || now - last >= targetFrameTimeMilliseconds || config.once;
		if (shouldRender) {
			while (now - targetFrameTimeMilliseconds > last) {
				last += targetFrameTimeMilliseconds;
			}
		}

		const devicePixelRatio = window.devicePixelRatio ?? 1;
		const canvasWidth = Math.ceil(canvas.clientWidth * devicePixelRatio * config.resolution);
		const canvasHeight = Math.ceil(canvas.clientHeight * devicePixelRatio * config.resolution);
		const canvasSize = [canvasWidth, canvasHeight];
		if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			outputs = pipeline.build(canvasSize);
		}

		if (config.useCamera) {
			device.queue.copyExternalImageToTexture({ source: cameraCanvas }, { texture: cameraTex }, cameraSize);
		}

		device.queue.writeBuffer(timeBuffer, 0, timeUniforms.toBuffer({ seconds: (now - start) / 1000, frames }));
		frames++;

		const encoder = device.createCommandEncoder();
		pipeline.run(encoder, shouldRender);
		// Eventually, when WebGPU allows it, we'll remove the endPass and just copy from our pipeline's output to the canvas texture.
		// encoder.copyTextureToTexture({ texture: outputs?.primary }, { texture: canvasContext.getCurrentTexture() }, canvasSize);
		device.queue.submit([encoder.finish()]);

		if (!config.once) {
			raf = requestAnimationFrame(renderLoop);
		}
	};

	// Chrome can enter/exit fullscreen without firing window resize with updated
	// clientWidth/clientHeight, so the render target stays at the old bitmap size
	// and looks scaled only in fullscreen.
	const recalcOutputs = () => {
		const devicePixelRatio = window.devicePixelRatio ?? 1;
		const canvasWidth = Math.ceil(canvas.clientWidth * devicePixelRatio * config.resolution);
		const canvasHeight = Math.ceil(canvas.clientHeight * devicePixelRatio * config.resolution);
		const canvasSize = [canvasWidth, canvasHeight];
		if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			outputs = pipeline.build(canvasSize);
		}
	};

	const recalcFullscreenChange = () => {
		recalcOutputs();
		if (config.useCamera) {
			device.queue.copyExternalImageToTexture({ source: cameraCanvas }, { texture: cameraTex }, cameraSize);
		}
	};

	document.addEventListener("fullscreenchange", recalcFullscreenChange);
	document.addEventListener("webkitfullscreenchange", recalcFullscreenChange);
	document.addEventListener("mozfullscreenchange", recalcFullscreenChange);
	document.addEventListener("MSFullscreenChange", recalcFullscreenChange);
	window.addEventListener("resize", recalcOutputs);

	let raf = requestAnimationFrame(renderLoop);

	activeSession = {
		canvas,
		dispose: () => {
			cancelAnimationFrame(raf);
			document.removeEventListener("fullscreenchange", recalcFullscreenChange);
			document.removeEventListener("webkitfullscreenchange", recalcFullscreenChange);
			document.removeEventListener("mozfullscreenchange", recalcFullscreenChange);
			document.removeEventListener("MSFullscreenChange", recalcFullscreenChange);
			window.removeEventListener("resize", recalcOutputs);
			cleanupFullscreen();
			device.destroy();
			if (activeSession?.canvas === canvas) {
				activeSession = null;
			}
		},
	};
};

export default startWebGPUMatrix;

/**
 * Rebuild the renderer with a new config on the same canvas, so gallery item picks and
 * screensaver mode switches actually change what is on screen.
 *
 * @param {import("../config.js").MatrixConfig} config
 * @returns {Promise<void>}
 */
export const updateConfig = (config) => {
	const session = activeSession;
	if (!session) {
		console.warn("[Matrix][WebGPU] updateConfig() called before the renderer started");
		return Promise.resolve();
	}
	session.dispose();
	return startWebGPUMatrix(session.canvas, config);
};
