# 🕊️ SONG BIRD: Spectral Architecture

**Song Bird** is an immersive, high-fidelity 3D audio visualizer inspired by technical drawing, mechanical precision, and the "Spectral Architecture" of artists like Lucio Arese. It transforms sound into a living, structural constellation.

## 🌌 The Vision
Unlike traditional visualizers that react with "soft" waves, **Song Bird** uses a "Zipping" engine. It maps the frequency peaks of your audio to 12 sentient anchors (Musical Notes) in a deep 3D nebula. 

As the music moves, a high-velocity **Firefly Tracer** zips between these anchors, leaving a brilliant "Comet" tail that gradually "cools" into a permanent white structural map of the song's skeleton.

## ✨ Key Features
- **Sentient 3D Constellation**: 12 Note-anchors that drift organically and glow intensely when approached.
- **Dual-Layer Trails**: High-intensity "Comet" tracers that fade into a persistent "Structure Map."
- **Surgical Pitch Accuracy**: Custom-built FFT peak resolver for mechanical note-locking, even in noisy environments.
- **GPU-Accelerated Performance**: Built with naked Buffer Geometries to ensure 60FPS fluid motion without crashing.
- **Customizable Void**: Independent technical selectors for Comet color, Structure color, and Background Void.

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
1. **Live Mode**: Click the **MIC** button to allow the visualizer to listen to your surroundings (Instruments, Voice, or Speakers).
2. **Upload Mode**: Click **UPLOAD** to drop an MP3/WAV file directly into the constellation.
3. **Controls**: Use the bottom technical bar to adjust the Comet trail color, the persistence map color, and the background "atmosphere" color.
4. **Orbit**: Click and drag on the screen to rotate through the 3D nebula. Use the scroll wheel to zoom into the specific note nodes.

## 📡 Deployment
This project is optimized for deployment on **[Vercel](https://vercel.com/)**.
1. Connect your GitHub repository to Vercel.
2. Ensure the framework preset is set to **Vite**.
3. Push to `main` to trigger an automatic build.

---
*Created with surgical precision.*
