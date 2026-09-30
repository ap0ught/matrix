import { fullscreenQuadReglBase, loadText, makePassFBO, makePass, requireShaderString } from "./utils.js";

// Multiplies the rendered rain and bloom by a loaded in image

export default ({ regl, config, lkg }, inputs) => {
	if (!lkg.enabled) {
		return makePass({
			primary: inputs.primary,
		});
	}

	const output = makePassFBO(regl, config.useHalfFloat);
	const quiltPassFrag = loadText("shaders/glsl/quiltPass.frag.glsl");
	let render;
	const programsReady = quiltPassFrag.loaded.then(() => {
		render = regl({
			...fullscreenQuadReglBase,
			frag: requireShaderString("quiltPass.frag", () => quiltPassFrag.text()),
			uniforms: {
				quiltTexture: inputs.primary,
				...lkg,
			},
			framebuffer: output,
		});
	});
	return makePass(
		{
			primary: output,
		},
		programsReady,
		(w, h) => output.resize(w, h),
		(shouldRender) => {
			if (shouldRender) {
				render({});
			}
		},
	);
};
