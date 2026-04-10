/**
 * Copies npm-distributed WebGL libraries into /lib for static hosting (no bundler).
 * Run automatically via postinstall after npm ci / npm install.
 */
import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const reglSrc = join(root, "node_modules/regl/dist/regl.min.js");
const twglSrc = join(root, "node_modules/twgl/dist/7.x/twgl-full.module.js");

if (!existsSync(reglSrc)) {
	console.warn("[vendor-webgl-deps] skip: node_modules/regl not installed yet");
	process.exit(0);
}

copyFileSync(reglSrc, join(root, "lib/regl.min.js"));
console.log("[vendor-webgl-deps] lib/regl.min.js <= regl npm package");

if (existsSync(twglSrc)) {
	copyFileSync(twglSrc, join(root, "lib/twgl-full.module.js"));
	console.log("[vendor-webgl-deps] lib/twgl-full.module.js <= twgl npm package");
}
