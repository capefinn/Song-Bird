# 🕊️ SONG BIRD: Spectral Architecture

**Song Bird** is an immersive, high-fidelity 3D audio visualizer inspired by technical drawing, mechanical precision, and the "Spectral Architecture" of artists like Lucio Arese. It transforms sound into a living, structural constellation.

## 🌌 The Vision
Unlike traditional visualizers that react with "soft" waves, **Song Bird** uses a "Zipping" engine. It maps the frequency peaks of your audio to 12 sentient anchors (Musical Notes) in a deep 3D nebula. 

As the music moves, a high-velocity **Firefly Tracer** zips between these anchors, leaving a brilliant "Comet" tail that gradually "cools" into a permanent white structural map of the song's skeleton.

## 🔬 How It Works (The Mechanics)
Song Bird is not a random particle system; it is a precision instrument measuring specific audio properties in real-time:

### 1. Audio Analysis (The Ear)
- **FFT (Fast Fourier Transform):** We use a high-resolution 2048-bin FFT to break audio into its component frequencies.
- **Peak Detection:** The engine scans the frequency spectrum to find the single loudest frequency peak (the "fundamental pitch") at any given moment.
- **Note Resolution:** This frequency is mathematically converted into a musical note (C, C#, D, etc.) using the logarithmic MIDI scale.

### 2. Visual Mapping (The Eye)
- **The Constellation:** 12 invisible anchors represent the 12 musical notes of the chromatic scale, arranged in a 3D formation (Orbit, Phyllotaxis, Fractal, or Mandala).
- **The Zipping Engine:** When a clear note is detected, the "Firefly" cursor is magnetically pulled toward that note's anchor.
- **Spectral Centroid (Brightness):** We measure the "brightness" or timbre of the sound. Brighter sounds (like hi-hats or violins) create thicker, more intense trails, while darker sounds create thinner lines.
- **Amplitude (Volume):** The loudness of the sound controls the size of the Firefly and the intensity of the light it casts.

## ✨ Key Features
- **Sentient 3D Constellation**: 12 Note-anchors that drift organically and glow intensely when approached.
- **Multiple Formations**: Choose between Orbit, Natural (Phyllotaxis), Fractal, or the kaleidoscopic Mandala mode.
- **Dual-Layer Trails**: High-intensity "Comet" tracers that fade into a persistent "Structure Map."
- **Surgical Pitch Accuracy**: Custom-built FFT peak resolver for mechanical note-locking.
- **Reactive Glow**: Notes leave behind glowing "release markers" when the melody changes.
- **GPU-Accelerated Performance**: Built with naked Buffer Geometries to ensure 60FPS fluid motion.

## 🛠️ Technical Stack
- **Engine**: [Three.js](https://threejs.org/) + [React Three Fiber](https://r3f.docs.pmnd.rs/)
- **Audio Processing**: Web Audio API (Manual FFT) + [Meyda](https://meyda.js.org/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Language**: TypeScript

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/capefinn/Song-Bird.git
   cd Song-Bird
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173/` (or the port shown in your terminal).

## 🎛️ How to Use
1. **Live Mode**: Click the **MIC** button to allow the visualizer to listen to your surroundings.
2. **Upload Mode**: Click **UPLOAD** to drop an MP3/WAV file directly into the constellation.
3. **Controls**: Use the bottom technical bar to adjust the Comet trail color, the persistence map color, and the background "atmosphere" color.
4. **Orbit**: Click and drag on the screen to rotate through the 3D nebula. Use the scroll wheel to zoom.

## 📡 Deployment
This project is optimized for deployment on **[Vercel](https://vercel.com/)**.
1. Connect your GitHub repository to Vercel.
2. Ensure the framework preset is set to **Vite**.
3. Push to `main` to trigger an automatic build.


