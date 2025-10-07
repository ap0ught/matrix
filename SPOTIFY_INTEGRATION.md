# Spotify Integration for Matrix Rain

This implementation adds real-time music visualization to the Matrix digital rain effect using the Spotify Web API.

## Features

### 🎵 Spotify Integration

- **OAuth 2.0 Authentication**: Secure popup-based authentication flow
- **Real-time Track Data**: Fetches currently playing track information every 5 seconds
- **Audio Features**: Analyzes tempo, energy, danceability, and valence
- **Token Management**: Automatic token refresh and secure localStorage storage

### 🎨 Music Visualization

- **Corner Minimap**: Configurable position (top-left, top-right, bottom-left, bottom-right)
- **Track Information**: Displays song title, artist, and album art
- **Audio Features Display**: Shows energy, tempo, danceability, and mood percentages
- **Animated Bars**: 16-bar spectrum visualization based on audio features
- **Beat Pulse Effect**: Synchronizes with track tempo

### 🌈 Matrix Integration

- **Dynamic Colors**: Music influences the color palette based on mood (valence)
- **Speed Modulation**: Tempo and energy affect animation and fall speed
- **Brightness Control**: Energy levels modify overall brightness and cursor intensity
- **Beat Reactions**: Bloom effects pulse with the music beat
- **Configurable Sensitivity**: Adjustable influence strength (0.1x to 3.0x)

## Setup Instructions

### 1. Get Spotify Credentials

1. Visit the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app or use an existing one
3. Add your Matrix site URL to the app's redirect URIs (e.g., `http://localhost:8000/`)
4. Copy the Client ID

### 2. Configure the Integration

1. Open the Matrix rain visualization
2. Click the Spotify (♪) icon in the top-left corner to expand the controls
3. Paste your Spotify Client ID in the "Client ID" field
4. Click "Connect" to authenticate with Spotify
5. Authorize the app in the popup window

### 3. Enable Features

- **Sync Matrix with Music**: Check this to make the Matrix effect respond to your music
- **Show Visualizer**: Toggle the corner minimap on/off
- **Visualizer Position**: Choose where to display the minimap

## URL Parameters

You can configure Spotify features via URL parameters:

```
?spotifyEnabled=true              # Enable Spotify integration
&spotifyClientId=your_client_id   # Pre-fill client ID
&musicSync=true                   # Enable music synchronization
&musicSensitivity=1.5             # Set sensitivity (0.1-3.0)
&musicColors=true                 # Enable color influence
&musicSpeed=true                  # Enable speed influence
&musicBrightness=true             # Enable brightness influence
&visualizer=true                  # Show visualizer
&visualizerPos=bottom-right       # Set visualizer position
```

## Music Influence Details

When music synchronization is enabled, the following Matrix parameters are modified:

### Speed Effects

- **Animation Speed**: Scales with tempo (normalized to 120 BPM) and energy
- **Fall Speed**: Increases with energy level
- **Cycle Speed**: Faster glyph changes with higher energy

### Visual Effects

- **Brightness**: Energy and valence boost overall brightness
- **Cursor Intensity**: Scales with energy level
- **Bloom Strength**: Pulses with beat detection
- **Raindrop Length**: Influenced by danceability

### Color Effects

- **Palette Hue**: Shifts based on valence (mood) - happy songs shift toward warmer colors
- **Cursor Color**: Hue shifts with track mood
- **Saturation/Lightness**: Energy affects color intensity

## Technical Implementation

### Files Added

- `js/spotify.js` - Spotify Web API integration and OAuth handling
- `js/visualizer.js` - Music visualizer minimap component
- `js/spotify-ui.js` - User interface controls and settings
- `js/music-integration.js` - Matrix parameter modification based on audio features
- Updates to `js/main.js` and `js/config.js`

### API Usage

- Uses Spotify Web API endpoints:
  - `/v1/me/player/currently-playing` - Get current track
  - `/v1/audio-features/{id}` - Get audio analysis
- Implements proper rate limiting and error handling
- Caches audio features to minimize API calls

### Progressive Enhancement

- Completely optional - works without affecting core Matrix functionality
- Graceful fallback when no music is playing
- No external dependencies beyond existing Matrix libraries

## Privacy & Security

- Client ID is stored locally (localStorage)
- Tokens are stored securely in localStorage
- No server-side components required
- Popup-based OAuth prevents credential exposure

## Troubleshooting

### Connection Issues

- Ensure your Client ID is correct
- Check that your domain is added to Spotify app redirect URIs
- Verify popup blockers aren't preventing authentication

### No Music Data

- Make sure Spotify is playing music in the same browser
- Check that your Spotify account has premium features (if required)
- Try refreshing the connection if data stops updating

### Performance

- Music synchronization updates parameters 10 times per second
- Disable features you don't need to reduce CPU usage
- Visualizer can be hidden while keeping music sync active
