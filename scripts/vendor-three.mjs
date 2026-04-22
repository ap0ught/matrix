/**
 * Copies Three.js ESM runtime from the three npm package into /lib for static hosting (no bundler).
 * Run after npm install (see package.json postinstall).
 *
 * Note: recent Three.js builds split `three.module.js` into multiple modules (e.g. `three.core.js`).
 * When hosting `lib/three.module.js` directly, we must also vendor its sibling imports.
 */
import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const threeSrc = join(root, "node_modules/three/build/three.module.js");
const threeCoreSrc = join(root, "node_modules/three/build/three.core.js");

if (!existsSync(threeSrc)) {
	console.warn("[vendor-three] skip: node_modules/three not installed yet");
	process.exit(0);
}

copyFileSync(threeSrc, join(root, "lib/three.module.js"));
console.log("[vendor-three] lib/three.module.js <= three npm package");

if (!existsSync(threeCoreSrc)) {
	console.warn("[vendor-three] skip: three.core.js missing in this three version");
	process.exit(0);
}
copyFileSync(threeCoreSrc, join(root, "lib/three.core.js"));
console.log("[vendor-three] lib/three.core.js <= three npm package");
