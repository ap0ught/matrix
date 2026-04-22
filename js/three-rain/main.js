/**
 * Experimental Three.js rain: mathcode glyphs on even columns, Latin alphabet on odd columns.
 * See RENDERING_PIPELINE.md — this is not feature-parity with regl/WebGPU (no MSDF, bloom, effects).
 */
import * as THREE from "../../lib/three.module.js";
import { setupFullscreenToggle } from "../fullscreen.js";
import { buildGlyphAtlas } from "./glyphAtlas.js";
import {
	MATHCODE_GLYPHS,
	ALPHABET_GLYPHS,
	GLYPH_COUNT_MATH,
	GLYPH_ID_ALPHA_START,
} from "./glyphs.js";

const vertexShader = /* glsl */ `
precision highp float;
attribute float aPhase;
attribute float aSpeed;
attribute float aColumn;
attribute float aGlyph;

uniform float uTime;
uniform float uNumColumns;
uniform float uFallScale;

varying vec2 vUv;
varying float vGlyph;

void main() {
	vUv = uv;
	vGlyph = aGlyph;
	float nx = (aColumn + 0.5) / uNumColumns;
	float x = (nx - 0.5) * 2.0 + position.x * (2.0 / uNumColumns) * 0.92;
	float y = fract(uTime * aSpeed * uFallScale + aPhase) * 2.0 - 1.0 + position.y * 0.11;
	vec4 world = vec4(x, y, 0.0, 1.0);
	#ifdef USE_INSTANCING
		world = instanceMatrix * world;
	#endif
	gl_Position = projectionMatrix * modelViewMatrix * world;
}
`;

const fragmentShader = /* glsl */ `
precision mediump float;
uniform sampler2D uAtlas;
uniform float uAtlasCols;
uniform float uAtlasRows;

varying vec2 vUv;
varying float vGlyph;

void main() {
	float id = floor(vGlyph + 0.5);
	float cx = mod(id, uAtlasCols);
	float cy = floor(id / uAtlasCols);
	vec2 atlasUv = (vec2(cx, uAtlasRows - 1.0 - cy) + vUv) / vec2(uAtlasCols, uAtlasRows);
	vec4 tex = texture(uAtlas, atlasUv);
	float lum = max(tex.r, max(tex.g, tex.b));
	vec3 green = vec3(0.05, 0.95, 0.28);
	gl_FragColor = vec4(green * lum, lum * 0.95);
}
`;

function randomInt(maxExclusive) {
	return Math.floor(Math.random() * maxExclusive);
}

function pickGlyphId(column) {
	const useMath = column % 2 === 0;
	if (useMath) {
		return randomInt(GLYPH_COUNT_MATH);
	}
	return GLYPH_ID_ALPHA_START + randomInt(ALPHABET_GLYPHS.length);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {import("../config.js").MatrixConfig} config
 */
export default async function main(canvas, config) {
	const cleanupFullscreen = setupFullscreenToggle(canvas);

	const numColumns = Math.max(16, Math.min(80, Number(config.numColumns) || 40));
	const dropsPerColumn = 32;
	const count = numColumns * dropsPerColumn;

	const { texture, cols: atlasCols, rows: atlasRows, totalGlyphs } = buildGlyphAtlas(
		THREE,
		MATHCODE_GLYPHS,
		ALPHABET_GLYPHS,
	);

	const geometry = new THREE.PlaneGeometry((2 / numColumns) * 0.92, 0.11, 1, 1);
	const phase = new Float32Array(count);
	const speed = new Float32Array(count);
	const column = new Float32Array(count);
	const glyph = new Float32Array(count);

	let idx = 0;
	for (let c = 0; c < numColumns; c++) {
		for (let d = 0; d < dropsPerColumn; d++) {
			phase[idx] = Math.random();
			speed[idx] = 0.35 + Math.random() * 0.45;
			column[idx] = c;
			glyph[idx] = pickGlyphId(c);
			idx++;
		}
	}

	geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
	geometry.setAttribute("aSpeed", new THREE.InstancedBufferAttribute(speed, 1));
	geometry.setAttribute("aColumn", new THREE.InstancedBufferAttribute(column, 1));
	geometry.setAttribute("aGlyph", new THREE.InstancedBufferAttribute(glyph, 1));

	const material = new THREE.ShaderMaterial({
		uniforms: {
			uTime: { value: 0 },
			uNumColumns: { value: numColumns },
			uFallScale: { value: (config.fallSpeed ?? 0.4) * 1.2 },
			uAtlas: { value: texture },
			uAtlasCols: { value: atlasCols },
			uAtlasRows: { value: atlasRows },
		},
		vertexShader,
		fragmentShader,
		transparent: true,
		depthTest: false,
		blending: THREE.NormalBlending,
	});

	const mesh = new THREE.InstancedMesh(geometry, material, count);
	mesh.frustumCulled = false;

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	scene.add(mesh);

	const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
	camera.position.set(0, 0, 2);
	camera.lookAt(0, 0, 0);

	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true,
		alpha: false,
		powerPreference: "high-performance",
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
	renderer.setClearColor(0x000000, 1);

	const resize = () => {
		const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
		const w = Math.ceil(canvas.clientWidth * dpr * (config.resolution ?? 0.75));
		const h = Math.ceil(canvas.clientHeight * dpr * (config.resolution ?? 0.75));
		renderer.setSize(w, h, false);
		canvas.width = w;
		canvas.height = h;
	};
	window.addEventListener("resize", resize);
	resize();

	let raf = 0;
	const clock = new THREE.Clock();

	const tick = () => {
		material.uniforms.uTime.value = clock.getElapsedTime();
		renderer.render(scene, camera);
		raf = requestAnimationFrame(tick);
	};
	tick();

	/** Cycle glyphs like `cycleSpeed` on the main rain (coarse timer). */
	const cycleMs = Math.max(120, Math.min(2000, (1 / (config.cycleSpeed ?? 0.05)) * 40));
	const glyphAttr = geometry.getAttribute("aGlyph");
	const cycleTimer = window.setInterval(() => {
		for (let i = 0; i < count; i++) {
			const c = column[i];
			glyph[i] = pickGlyphId(c);
		}
		glyphAttr.needsUpdate = true;
	}, cycleMs);

}
