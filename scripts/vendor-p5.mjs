/**
 * Copies p5.min.js from the p5 npm package into /lib for static hosting (no bundler).
 * The build is a browser UMD bundle (`window.p5`). Run after npm install (package.json postinstall).
 */
import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p5Src = join(root, "node_modules/p5/lib/p5.min.js");

if (!existsSync(p5Src)) {
	console.warn("[vendor-p5] skip: node_modules/p5 not installed yet");
	process.exit(0);
}

copyFileSync(p5Src, join(root, "lib/p5.min.js"));
console.log("[vendor-p5] lib/p5.min.js <= p5 npm package");
