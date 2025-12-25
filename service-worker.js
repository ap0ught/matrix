/*
 * Matrix Digital Rain - Service Worker
 *
 * Implements offline functionality through aggressive caching.
 * Like the Matrix itself, once downloaded, the code persists in memory.
 * "There is no cloud, it's just someone else's computer" - Cache everything locally.
 *
 * Version: 2.0 - Now with dynamic cache versioning from VERSION file
 */

// Cache version will be loaded from VERSION file during installation
let CACHE_NAME = "matrix-v1"; // Default fallback

// Determine the base path for this service worker
// This allows the app to work in subdirectories (e.g., GitHub Pages PR previews)
const BASE_PATH = self.location.pathname.replace(/service-worker\.js$/, "");

// Files to cache for offline functionality (relative to BASE_PATH)
const STATIC_ASSETS = [
	"./",
	"index.html",
	"VERSION",
	// JavaScript modules
	"js/main.js",
	"js/config.js",
	"js/utils.js",
	"js/spotify.js",
	"js/spotify-ui.js",
	"js/mode-manager.js",
	"js/effects.js",
	"js/mode-display.js",
	"js/gallery.js",
	"js/colorToRGB.js",
	"js/fullscreen.js",
	"js/camera.js",
	// WebGL/REGL modules
	"js/regl/main.js",
	"js/regl/rainPass.js",
	"js/regl/bloomPass.js",
	"js/regl/palettePass.js",
	"js/regl/stripePass.js",
	"js/regl/imagePass.js",
	"js/regl/quiltPass.js",
	"js/regl/mirrorPass.js",
	"js/regl/utils.js",
	"js/regl/lkgHelper.js",
	// WebGPU modules
	"js/webgpu/main.js",
	"js/webgpu/rainPass.js",
	"js/webgpu/bloomPass.js",
	"js/webgpu/palettePass.js",
	"js/webgpu/stripePass.js",
	"js/webgpu/imagePass.js",
	"js/webgpu/mirrorPass.js",
	"js/webgpu/endPass.js",
	"js/webgpu/utils.js",
	// Libraries
	"lib/regl.min.js",
	"lib/gl-matrix.js",
	"lib/gpu-buffer.js",
	"lib/holoplaycore.module.js",
	// Shaders - GLSL
	"shaders/glsl/rainPass.vert.glsl",
	"shaders/glsl/rainPass.frag.glsl",
	"shaders/glsl/rainPass.intro.frag.glsl",
	"shaders/glsl/rainPass.raindrop.frag.glsl",
	"shaders/glsl/rainPass.symbol.frag.glsl",
	"shaders/glsl/rainPass.effect.frag.glsl",
	"shaders/glsl/bloomPass.highPass.frag.glsl",
	"shaders/glsl/bloomPass.blur.frag.glsl",
	"shaders/glsl/bloomPass.combine.frag.glsl",
	"shaders/glsl/palettePass.frag.glsl",
	"shaders/glsl/stripePass.frag.glsl",
	"shaders/glsl/imagePass.frag.glsl",
	"shaders/glsl/mirrorPass.frag.glsl",
	"shaders/glsl/quiltPass.frag.glsl",
	// Shaders - WGSL
	"shaders/wgsl/rainPass.wgsl",
	"shaders/wgsl/bloomBlur.wgsl",
	"shaders/wgsl/stripePass.wgsl",
	"shaders/wgsl/imagePass.wgsl",
	"shaders/wgsl/mirrorPass.wgsl",
	"shaders/wgsl/endPass.wgsl",
	// Font assets - MSDF textures
	"assets/matrixcode_msdf.png",
	"assets/megacity_msdf.png",
	"assets/resurrections_msdf.png",
	"assets/resurrections_glint_msdf.png",
	"assets/gothic_msdf.png",
	"assets/coptic_msdf.png",
	"assets/neomatrixology_msdf.png",
	"assets/huberfish_a_msdf.png",
	"assets/huberfish_d_msdf.png",
	"assets/gtarg_tenretniolleh_msdf.png",
	"assets/gtarg_alientext_msdf.png",
	// Font assets - TrueType
	"assets/Matrix-Code.ttf",
	"assets/Matrix-Resurrected.ttf",
	// Texture assets
	"assets/pixel_grid.png",
	"assets/metal.png",
	"assets/mesh.png",
	"assets/sand.png",
	// PWA icons
	"icon-192.png",
	"icon-512.png",
	"manifest.webmanifest",
];

/*
 * Service Worker Installation
 * Cache all static assets during installation phase
 * Loads version number from VERSION file to create unique cache names
 */
self.addEventListener("install", (event) => {
	console.log("[Matrix Service Worker] Installing...");
	console.log("[Matrix Service Worker] 'There is no spoon' - Preparing to cache the Matrix...");
	event.waitUntil(
		// First, fetch the VERSION file to get the current version
		// Use cache: 'reload' to ensure we get the latest version
		fetch(new URL("VERSION", BASE_PATH + "/").href, { cache: "reload" })
			.then((response) => response.text())
			.then((versionText) => {
				// Update cache name with version from VERSION file
				const version = versionText.trim();
				CACHE_NAME = `matrix-v${version}`;
				console.log(`[Matrix Service Worker] 🔋 Version: ${version}`);
				console.log(`[Matrix Service Worker] 💾 Cache Name: ${CACHE_NAME}`);
				console.log(`[Matrix Service Worker] 📦 Assets to cache: ${STATIC_ASSETS.length} files`);
				return caches.open(CACHE_NAME);
			})
			.catch((error) => {
				// If VERSION file fails to load, use default cache name
				console.warn("[Matrix Service Worker] Failed to load VERSION file, using default cache name:", error);
				console.log(`[Matrix Service Worker] 💾 Fallback Cache Name: ${CACHE_NAME}`);
				return caches.open(CACHE_NAME);
			})
			.then((cache) => {
				console.log("[Matrix Service Worker] Caching static assets...");
				// Convert relative paths to absolute URLs using BASE_PATH
				const absoluteAssets = STATIC_ASSETS.map((path) => new URL(path, BASE_PATH + "/").href);
				return cache.addAll(absoluteAssets);
			})
			.then(() => {
				console.log("[Matrix Service Worker] ✅ Installation complete - The Matrix is cached!");
				console.log(`[Matrix Service Worker] Cache '${CACHE_NAME}' is ready for offline use`);
				return self.skipWaiting();
			})
			.catch((error) => {
				console.error("[Matrix Service Worker] ❌ Installation failed:", error);
			}),
	);
});

/*
 * Service Worker Activation
 * Clean up old caches when activating a new version
 */
self.addEventListener("activate", (event) => {
	console.log("[Matrix Service Worker] Activating...");
	console.log(`[Matrix Service Worker] Current cache: ${CACHE_NAME}`);
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				console.log(`[Matrix Service Worker] Found ${cacheNames.length} cache(s):`, cacheNames);
				const oldCaches = cacheNames.filter((cacheName) => cacheName !== CACHE_NAME);
				if (oldCaches.length > 0) {
					console.log(`[Matrix Service Worker] 🗑️  Cleaning up ${oldCaches.length} old cache(s)...`);
				}
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== CACHE_NAME) {
							console.log(`[Matrix Service Worker] 🗑️  Deleting old cache: ${cacheName}`);
							return caches.delete(cacheName);
						}
					}),
				);
			})
			.then(() => {
				console.log(`[Matrix Service Worker] ✅ Activation complete - ${CACHE_NAME} is active`);
				console.log("[Matrix Service Worker] 'I know kung fu.' - Ready to serve offline!");
				return self.clients.claim();
			}),
	);
});

/*
 * Fetch Event Handler - Cache First Strategy
 *
 * The Matrix code persists even when disconnected from the mainframe.
 * This implements a cache-first approach: serve from cache if available,
 * otherwise fetch from network and cache the result.
 */
self.addEventListener("fetch", (event) => {
	// Only handle GET requests
	if (event.request.method !== "GET") {
		return;
	}

	// Skip cross-origin requests (like Spotify API calls)
	if (!event.request.url.startsWith(self.location.origin)) {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				// Found in cache - serve immediately
				return cachedResponse;
			}

			// Not in cache - fetch from network
			return fetch(event.request)
				.then((networkResponse) => {
					// Don't cache non-successful responses
					if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === "error") {
						return networkResponse;
					}

					// Clone the response before caching (response can only be consumed once)
					const responseToCache = networkResponse.clone();

					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseToCache);
					});

					return networkResponse;
				})
				.catch((error) => {
					console.error("[Matrix Service Worker] Fetch failed:", error);
					// Could return a custom offline page here if desired
					throw error;
				});
		}),
	);
});
