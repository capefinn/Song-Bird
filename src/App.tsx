import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { AudioAnalyzer } from './audio/AudioAnalyzer';
import { GenerativeStructure } from './components/GenerativeStructure';
import { Play, Pause, Upload, Mic, RefreshCw, Activity } from 'lucide-react';
import './App.css';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#00ffcc');
  const [structureColor, setStructureColor] = useState('#ffffff');
  const [backgroundColor, setBackgroundColor] = useState('#020202');
  const [analyzer, setAnalyzer] = useState<AudioAnalyzer | null>(null);
  const [signalLevel, setSignalLevel] = useState(0);

  const audioElRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!hasStarted || !analyzer) return;

    let frameId: number;
    const checkSignal = () => {
      if (analyzer) {
        setSignalLevel(analyzer.getRawVolume() * 100);
      }
      frameId = requestAnimationFrame(checkSignal);
    };

    frameId = requestAnimationFrame(checkSignal);
    return () => cancelAnimationFrame(frameId);
  }, [hasStarted, analyzer]);

  const startAudio = async (file?: File) => {
    try {
      const newAnalyzer = new AudioAnalyzer();

      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }

      let audioEl: HTMLAudioElement | undefined;
      if (file) {
        const url = URL.createObjectURL(file);
        audioEl = new Audio(url);
        audioEl.loop = true;
        audioElRef.current = audioEl;
      }

      await newAnalyzer.start(audioEl);
      setAnalyzer(newAnalyzer);
      setIsPlaying(true);
      setHasStarted(true);
    } catch (e) {
      console.error("Audio Fault:", e);
      alert("Please ensure microphone access is enabled in System Settings > Privacy & Security.");
    }
  };

  const togglePause = () => {
    if (audioElRef.current) {
      if (isPlaying) audioElRef.current.pause();
      else audioElRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const reset = () => window.location.reload();

  return (
    <div className="app-container">
      <div className="canvas-wrapper">
        <Canvas gl={{ antialias: true, alpha: false, depth: true }}>
          <PerspectiveCamera makeDefault position={[0, 0, 70]} fov={50} />
          <color attach="background" args={[backgroundColor]} />
          <ambientLight intensity={0.1} />
          <pointLight position={[50, 50, 50]} intensity={1} />

          <GenerativeStructure
            analyzer={analyzer}
            trailColor={selectedColor}
            structureColor={structureColor}
          />

          <OrbitControls
            enablePan={false}
            minDistance={5}
            maxDistance={400}
            autoRotate
            autoRotateSpeed={0.5}
          />

          <EffectComposer>
            <Bloom luminanceThreshold={0.2} intensity={1.5} mipmapBlur />
          </EffectComposer>
        </Canvas>
      </div>

      {!hasStarted && (
        <div className="start-overlay">
          <h1>SONG BIRD</h1>
          <p className="technical-label">V.5 SPECTRAL ARCHITECTURE</p>
          <div className="start-actions">
            <button className="big-start-btn" onClick={() => startAudio()}>
              <Mic size={24} style={{ marginRight: 10 }} /> LIVE
            </button>
            <label className="big-start-btn">
              <Upload size={24} style={{ marginRight: 10 }} /> UPLOAD
              <input
                className="file-input"
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) startAudio(file);
                }}
              />
            </label>
          </div>
        </div>
      )}

      {hasStarted && (
        <>
          <div className="signal-monitor">
            <Activity size={14} style={{ marginRight: 8, opacity: 0.5 }} />
            <div className="signal-bar-bg">
              <div
                className="signal-bar-fill"
                style={{ width: `${Math.min(100, signalLevel)}%`, background: selectedColor }}
              />
            </div>
            <span className="status-label">{analyzer?.getState().toUpperCase()}</span>
          </div>

          <div className="bottom-bar">
            <div className="color-pickers">
              <div className="color-picker-item">
                <span className="picker-label">COMET</span>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="color-picker-input"
                />
              </div>
              <div className="color-picker-item">
                <span className="picker-label">TRACE</span>
                <input
                  type="color"
                  value={structureColor}
                  onChange={(e) => setStructureColor(e.target.value)}
                  className="color-picker-input"
                />
              </div>
              <div className="color-picker-item">
                <span className="picker-label">BG</span>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="color-picker-input"
                />
              </div>
            </div>
            <div className="control-group">
              <button className="control-btn" onClick={togglePause}>
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button className="control-btn" onClick={reset}>
                <RefreshCw size={24} />
              </button>
            </div>
            <div style={{ width: 40 }} />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
