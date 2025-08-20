/*
 * Matrix Camera Input System
 *
 * This module handles webcam integration for interactive Matrix effects,
 * particularly the mirror mode where the digital rain reflects the user's
 * movements. Like Morpheus showing Neo the mirror that becomes liquid,
 * this creates a bridge between the physical and digital worlds.
 */

/*
 * Future Enhancement Notes
 * TODO: switch to video-based texture for better performance
 * TODO: add mipmap support for smoother scaling
 */

/*
 * Camera Stream Elements
 * - video: The HTML5 video element receiving the webcam stream
 * - cameraCanvas: Canvas for capturing video frames as textures
 * - context: 2D rendering context for frame capture
 */
const video = document.createElement("video");
const cameraCanvas = document.createElement("canvas");
cameraCanvas.width = 1;
cameraCanvas.height = 1;
const context = cameraCanvas.getContext("2d");

/*
 * Camera Configuration State
 * These variables track the camera's dimensions and aspect ratio
 * for proper integration with the Matrix rendering pipeline
 */
let cameraAspectRatio = 1.0;
const cameraSize = [1, 1];

/*
 * Continuous Frame Capture Loop
 *
 * This function creates a rendering loop that continuously captures
 * frames from the video stream to the canvas. Each frame becomes
 * available as a texture for the Matrix effect to sample from.
 *
 * The loop runs at the browser's refresh rate (typically 60fps)
 * using requestAnimationFrame for smooth performance.
 */
const drawToCanvas = () => {
	requestAnimationFrame(drawToCanvas);
	context.drawImage(video, 0, 0);
};

/*
 * Camera Initialization and Stream Setup
 *
 * This function implements the "red pill" moment for camera access -
 * requesting permission to see the user's physical reality and integrate
 * it with the Matrix digital environment.
 *
 * The setup process:
 * 1. Request camera permissions from the user
 * 2. Configure optimal video settings (1280x720@60fps preferred)
 * 3. Extract actual stream dimensions from the camera
 * 4. Set up the video element and canvas for texture capture
 * 5. Begin the continuous frame capture loop
 *
 * Error handling gracefully degrades when camera access is denied
 * or unavailable, allowing the Matrix to continue without user reflection.
 *
 * @returns {Promise<void>} Resolves when camera is successfully initialized
 */
const setupCamera = async () => {
	try {
		/*
		 * MediaDevices.getUserMedia() Request
		 * Request video stream with optimal settings for Matrix integration:
		 * - Minimum 800px width to ensure detail visibility
		 * - Ideal 1280px width for HD quality digital rain interaction
		 * - 60fps frame rate for smooth real-time response
		 * - No audio needed for visual-only Matrix effects
		 */
		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				width: { min: 800, ideal: 1280 },
				frameRate: { ideal: 60 },
			},
			audio: false,
		});

		/*
		 * Stream Configuration Extraction
		 * Get the actual video track settings to properly configure
		 * our canvas and aspect ratio calculations. The camera may
		 * not provide exactly what we requested, so we adapt.
		 */
		const videoTrack = stream.getVideoTracks()[0];
		const { width, height } = videoTrack.getSettings();

		/*
		 * Video and Canvas Dimension Synchronization
		 * Configure all video-related elements with the actual camera dimensions.
		 * This ensures the digital rain properly reflects the user's aspect ratio
		 * without distortion - maintaining the illusion of the mirror world.
		 */
		video.width = width;
		video.height = height;
		cameraCanvas.width = width;
		cameraCanvas.height = height;
		cameraAspectRatio = width / height;
		cameraSize[0] = width;
		cameraSize[1] = height;

		/*
		 * Video Stream Activation
		 * Connect the MediaStream to the video element and begin playback.
		 * Once playing, the video frames become available for canvas capture.
		 */
		video.srcObject = stream;
		video.play();

		/*
		 * Begin Frame Capture Loop
		 * Start the continuous process of capturing video frames to canvas,
		 * making them available as textures for the Matrix rendering pipeline.
		 */
		drawToCanvas();
	} catch (e) {
		/*
		 * Graceful Degradation
		 * If camera access fails (permissions denied, hardware unavailable, etc.),
		 * log the issue but allow the Matrix to continue without user reflection.
		 * The digital rain will simply not include interactive mirror effects.
		 */
		console.warn(`Camera not initialized: ${e}`);
	}
};

/*
 * Module Exports
 * Export the camera canvas (for texture access), aspect ratio (for proper scaling),
 * dimensions (for coordinate mapping), and setup function (for initialization).
 */
export { cameraCanvas, cameraAspectRatio, cameraSize, setupCamera };
