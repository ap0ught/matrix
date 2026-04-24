/**
 * Raster glyph atlas (CanvasTexture) for the Three.js rain demo.
 * Not MSDF — crisp enough at small sizes; see RENDERING_PIPELINE.md vs main WebGL path.
 * @param {typeof import("three")} THREE
 * @param {string[]} mathGlyphs
 * @param {string[]} alphaGlyphs
 */
export function buildGlyphAtlas(THREE, mathGlyphs, alphaGlyphs) {
	const combined = [...mathGlyphs, ...alphaGlyphs];
	const cols = 10;
	const rows = Math.ceil(combined.length / cols);
	const cell = 64;
	const w = cols * cell;
	const h = rows * cell;

	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("[three-rain] 2D canvas context unavailable");
	}
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, w, h);
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = "#e8ffe8";
	const fontPx = Math.floor(cell * 0.55);
	ctx.font = `600 ${fontPx}px "Segoe UI Symbol", "Noto Sans Math", "DejaVu Sans", sans-serif`;

	for (let i = 0; i < combined.length; i++) {
		const col = i % cols;
		const row = Math.floor(i / cols);
		const cx = col * cell + cell / 2;
		const cy = row * cell + cell / 2;
		ctx.fillText(combined[i] || "?", cx, cy);
	}

	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	if ("colorSpace" in texture) {
		texture.colorSpace = THREE.SRGBColorSpace;
	}

	return {
		texture,
		cols,
		rows,
		totalGlyphs: combined.length,
	};
}
