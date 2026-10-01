// ============================================================================
// Matrix Digital Rain - Looking Glass Quilt Display Shader
// ============================================================================
// "Down the rabbit hole" - Renders holographic 3D on Looking Glass displays

precision mediump float;

// Quilt texture - contains multiple views arranged in a grid
uniform sampler2D quiltTexture;

// Looking Glass calibration parameters
uniform float pitch;        // Lenticular lens pitch
uniform float tilt;         // View tilt angle
uniform float center;       // Center view offset
uniform float invView;      // Invert view direction
uniform float flipImageX;   // Horizontal flip
uniform float flipImageY;   // Vertical flip
uniform float subp;         // Subpixel offset

// Quilt dimensions - how views are arranged in the texture
uniform float tileX;
uniform float tileY;
uniform vec2 quiltViewPortion;

varying vec2 vUV;

// Convert 3D coordinates (u, v, view_index) to 2D texture coordinates
// Maps from individual view space to position within the quilt texture
vec2 texArr(vec3 uvz) {
  float z = floor(uvz.z * tileX * tileY);
  float x = (mod(z, tileX) + uvz.x) / tileX;
  float y = (floor(z / tileX) + uvz.y) / tileY;
  return vec2(x, y) * quiltViewPortion;
}

// Utility function for value remapping (currently unused)
float remap(float value, float from1, float to1, float from2, float to2) {
 return (value - from1) / (to1 - from1) * (to2 - from2) + from2;
}

void main() {
  // Sample three different views for RGB channels (chromatic approach)
  vec4 rgb[3];
  vec3 nuv = vec3(vUV.xy, 0.0);

  // Apply image flipping if needed
  // Flip UVs if necessary
  nuv.x = (1.0 - flipImageX) * nuv.x + flipImageX * (1.0 - nuv.x);
  nuv.y = (1.0 - flipImageY) * nuv.y + flipImageY * (1.0 - nuv.y);

  // For each color channel, sample a slightly different view
  // This creates the holographic 3D effect through parallax
  for (int i = 0; i < 3; i++) {
    // Calculate which view to sample based on screen position
    nuv.z = (vUV.x + float(i) * subp + vUV.y * tilt) * pitch - center;
    nuv.z = mod(nuv.z + ceil(abs(nuv.z)), 1.0);
    nuv.z = (1.0 - invView) * nuv.z + invView * (1.0 - nuv.z);
    
    // Sample the appropriate view from the quilt
    rgb[i] = texture2D(quiltTexture, texArr(vec3(vUV.x, vUV.y, nuv.z)));
  }

  // Combine the three views into final RGB output
  // Each color channel comes from a slightly different perspective
  gl_FragColor = vec4(rgb[0].r, rgb[1].g, rgb[2].b, 1);
}
