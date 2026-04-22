// @ts-check
import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright runs browser smoke tests against a static copy of the site.
 * `webServer` starts a local static file server so ES modules and assets resolve.
 */
export default defineConfig({
	testDir: "./tests",
	// Node's `node --test` uses `*.test.mjs`; Playwright only runs `*.spec.js`.
	testMatch: "**/*.spec.js",
	// Full version×effect matrix: `npm run test:regression` (see tests/regression/).
	testIgnore: ["tests/regression/**"],
	timeout: 60_000,
	expect: { timeout: 10_000 },
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
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
