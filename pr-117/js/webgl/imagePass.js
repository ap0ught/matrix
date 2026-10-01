import { fullscreenQuadReglBase, loadImage, loadText, makePassFBO, makePass, requireShaderString } from "./utils.js";

// Multiplies the rendered rain and bloom by a loaded in image

const defaultBGURL = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Flammarion_Colored.jpg/917px-Flammarion_Colored.jpg";

export default ({ regl, config }, inputs) => {
	const output = makePassFBO(regl, config.useHalfFloat);
	const bgURL = "bgURL" in config ? config.bgURL : defaultBGURL;
	const background = loadImage(regl, bgURL);
	const imagePassFrag = loadText("shaders/glsl/imagePass.frag.glsl");
	let render;
	const programsReady = Promise.all([background.loaded, imagePassFrag.loaded]).then(() => {
		render = regl({
			...fullscreenQuadReglBase,
			frag: requireShaderString("imagePass.frag", () => imagePassFrag.text()),
			uniforms: {
				backgroundTex: background.texture,
				tex: inputs.primary,
				bloomTex: inputs.bloom,
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
