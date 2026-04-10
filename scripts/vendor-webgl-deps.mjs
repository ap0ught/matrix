/**
 * Copies npm-distributed WebGL runtime into /lib for static hosting (no bundler).
 * Run automatically via postinstall after npm ci / npm install.
 *
 * Policy: see DEPENDENCY_POLICY.md — only vendored bits we still depend on belong here.
 */
import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const reglSrc = join(root, "node_modules/regl/dist/regl.min.js");

if (!existsSync(reglSrc)) {
	console.warn("[vendor-webgl-deps] skip: node_modules/regl not installed yet");
	process.exit(0);
}

copyFileSync(reglSrc, join(root, "lib/regl.min.js"));
console.log("[vendor-webgl-deps] lib/regl.min.js <= regl npm package");
