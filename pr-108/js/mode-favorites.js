/**
 * Persist favorite Matrix versions in localStorage (PWA-friendly).
 */

const STORAGE_KEY = "matrix.pwa.favoriteVersions";

/**
 * @param {string[]} validModes
 * @returns {string[]}
 */
export function loadFavoriteVersions(validModes) {
	if (!validModes?.length) return [];
	const allowed = new Set(validModes);
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((v) => typeof v === "string" && allowed.has(v));
	} catch {
		return [];
	}
}

/**
 * @param {string[]} favorites
 */
export function saveFavoriteVersions(favorites) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
	} catch (e) {
		console.warn("[Matrix] Could not save favorite modes:", e);
	}
}

/**
 * @param {string} version
 * @param {string[]} validModes
 * @returns {string[]} new list (sorted for stable storage)
 */
export function toggleFavoriteVersion(version, validModes) {
	const allowed = new Set(validModes);
	if (!allowed.has(version)) return loadFavoriteVersions(validModes);
	const current = new Set(loadFavoriteVersions(validModes));
	if (current.has(version)) {
		current.delete(version);
	} else {
		current.add(version);
	}
	const next = validModes.filter((v) => current.has(v));
	saveFavoriteVersions(next);
	return next;
}
