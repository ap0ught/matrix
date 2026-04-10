// @ts-check
import { defineConfig, devices } from "@playwright/test";

/**
 * Full matrix: every `getAvailableModes()` × every `getAvailableEffects()` on WebGL.
 * Run with: `npm run test:regression`
 * Not part of default `npm test` (see testIgnore in playwright.config.js).
 */
export default defineConfig({
	testDir: "./tests/regression",
	testMatch: "**/*.spec.js",
	timeout: 120_000,
	expect: { timeout: 15_000 },
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	use: {
		baseURL: "http://127.0.0.1:4173",
		trace: "on-first-retry",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		command: "npx --yes serve . -l 4173",
		url: "http://127.0.0.1:4173",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
