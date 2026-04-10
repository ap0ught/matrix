/**
 * Copies three.module.js from the three npm package into /lib for static hosting (no bundler).
 * Run after npm install (see package.json postinstall).
 */
import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const threeSrc = join(root, "node_modules/three/build/three.module.js");

if (!existsSync(threeSrc)) {
	console.warn("[vendor-three] skip: node_modules/three not installed yet");
	process.exit(0);
}

copyFileSync(threeSrc, join(root, "lib/three.module.js"));
console.log("[vendor-three] lib/three.module.js <= three npm package");
