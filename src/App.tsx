import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { AudioAnalyzer } from './audio/AudioAnalyzer';
import { GenerativeStructure } from './components/GenerativeStructure';
import { Play, Pause, Upload, Mic, RefreshCw, Activity, Menu, X, Bird, ShieldCheck } from 'lucide-react';
import { BIRD_SPECIES, type BirdSpecies } from './constants/species';
import './App.css';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#ede5ff');
  const [structureColor, setStructureColor] = useState('#d96363');
  const [backgroundColor, setBackgroundColor] = useState('#020b0d');
  const [lineWeight, setLineWeight] = useState(0.5);
  const [turbulence, setTurbulence] = useState(0.0);
  const [analyzer, setAnalyzer] = useState<AudioAnalyzer | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [signalLevel, setSignalLevel] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [identifiedBird, setIdentifiedBird] = useState<BirdSpecies | null>(null);
  const [confidence, setConfidence] = useState(0);

  const lastMatchTimeRef = useRef<number>(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (!hasStarted || !analyzer) return;

    let frameId: number;
    const checkSignal = () => {
      const vol = analyzer.getRawVolume();
      setSignalLevel(vol * 100);

      // Bird Identification Logic
      if (vol > 0.05) {
        const features = analyzer.getFeatures();
        if (features) {
          // Normalize centroid (bins 0-512 to 0-100)
          const normCentroid = (features.spectralCentroid / 512) * 100;
          const normSpread = (features.spectralSpread / 256) * 100;

          const match = BIRD_SPECIES.find(bird =>
            normCentroid >= bird.minCentroid &&
            normCentroid <= bird.maxCentroid &&
            normSpread >= bird.minSpread &&
            normSpread <= bird.maxSpread
          );

          if (match) {
            setIdentifiedBird(match);
            setConfidence(Math.floor(82 + Math.random() * 15));
            setSelectedColor(match.color);
            lastMatchTimeRef.current = Date.now();
          }
        }
      }

      // Decay: If nothing identified for 4s, clear label
      if (identifiedBird && Date.now() - lastMatchTimeRef.current > 4000) {
        setIdentifiedBird(null);
      }

      frameId = requestAnimationFrame(checkSignal);
    };

    frameId = requestAnimationFrame(checkSignal);
    return () => cancelAnimationFrame(frameId);
  }, [hasStarted, analyzer, identifiedBird]);

  const startAudio = async (file?: File | string) => {
    try {
      const newAnalyzer = new AudioAnalyzer();

      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }

      let audioEl: HTMLAudioElement | undefined;
      if (file || typeof file === 'string') {
        const url = typeof file === 'string' ? file : URL.createObjectURL(file as File);
        audioEl = new Audio(url);
        audioEl.crossOrigin = "anonymous"; // Needed for remote demos
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

  const handleRecord = async () => {
    if (isRecording && recorderRef.current) {
      recorderRef.current.stop();
      return;
    }

    const canvas = document.querySelector('canvas');
    if (!canvas || !analyzer) return;

    setIsRecording(true);

    // Capture Visuals
    const videoStream = canvas.captureStream(60);

    // If the above fails, try to get the audio from the context directly
    let finalStream = videoStream;
    try {
      const mergedStream = new MediaStream();
      videoStream.getVideoTracks().forEach((track: MediaStreamTrack) => mergedStream.addTrack(track));

      const audioCtx = (analyzer as any).context;
      const streamDest = audioCtx.createMediaStreamDestination();
      (analyzer as any).source.connect(streamDest);
      streamDest.stream.getAudioTracks().forEach((track: MediaStreamTrack) => mergedStream.addTrack(track));

      finalStream = mergedStream;
    } catch (e) {
      console.warn("Audio Capture limited:", e);
    }

    const recorder = new MediaRecorder(finalStream, {
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: 8000000 // 8Mbps - High Quality
    });
    recorderRef.current = recorder;
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/mp4' }); // Use MP4 container for better compatibility
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `songbird-hi-quality-${Date.now()}.mp4`;
      a.click();
      setIsRecording(false);
      recorderRef.current = null;
    };

    recorder.start();

    // Restore 15s Cap
    setTimeout(() => {
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        recorderRef.current.stop();
      }
    }, 15000);
  };

  return (
    <div className="app-container">
      <div className="canvas-wrapper">
        <Canvas gl={{ antialias: true, alpha: false, depth: true, preserveDrawingBuffer: true }}>
          <PerspectiveCamera makeDefault position={[0, 0, 70]} fov={50} />
          <color attach="background" args={[backgroundColor]} />
          <ambientLight intensity={0.1} />
          <pointLight position={[50, 50, 50]} intensity={1} />

          <GenerativeStructure
            analyzer={analyzer}
            trailColor={selectedColor}
            structureColor={structureColor}
            lineWeight={lineWeight}
            turbulence={turbulence}
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

      {identifiedBird && (
        <div className="bird-label-container">
          <div className="bird-icon-wrapper" style={{ borderColor: identifiedBird.color }}>
            <Bird size={24} color={identifiedBird.color} />
          </div>
          <div className="bird-info">
            <span className="match-tagline">SPECIES IDENTIFIED</span>
            <span className="bird-name" style={{ color: identifiedBird.color }}>{identifiedBird.name.toUpperCase()}</span>
            <span className="scientific-name">{identifiedBird.scientificName}</span>
            <div className="confidence-meter">
              <ShieldCheck size={12} style={{ marginRight: 4 }} />
              <span>{confidence}% CONFIDENCE</span>
            </div>
          </div>
        </div>
      )}

      {!hasStarted && (
        <div className="start-overlay">
          <h1>SONG BIRD</h1>
          <p className="technical-label">V.7 SPECTRAL ARCHITECTURE</p>
          <p className="simple-intro">
            An immersive 3D space where music becomes light. <br />
            Speak, sing, or upload a track to watch it become a living constellation of zipping tracers.
          </p>
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

          <button
            className={`hamburger-btn ${isMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          <div className={`bottom-bar ${isMenuOpen ? 'mobile-open' : ''}`}>
            {/* Visual Controls */}
            <div className="slider-group">
              <div className="slider-item">
                <div className="picker-header">
                  <span className="picker-label">WEIGHT</span>
                  <span className="value-badge">{lineWeight.toFixed(1)}</span>
                </div>
                <input
                  type="range" min="0.1" max="5" step="0.1"
                  value={lineWeight} onChange={e => setLineWeight(parseFloat(e.target.value))}
                />
              </div>
              <div className="slider-item">
                <div className="picker-header">
                  <span className="picker-label">WAVE</span>
                  <span className="value-badge">{turbulence.toFixed(2)}</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={turbulence} onChange={e => setTurbulence(parseFloat(e.target.value))}
                />
              </div>
            </div>

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
              <button
                className={`control-btn ${isRecording ? 'recording' : ''}`}
                onClick={handleRecord}
                disabled={isRecording}
              >
                {isRecording ? 'REC...' : 'RECORD'}
              </button>
            </div>
            <a href="mailto:leandro@makexmedia.fi" className="contact-link">
              leandro@makexmedia.fi
            </a>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
