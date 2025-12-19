import Meyda from 'meyda';

export interface AudioFeatures {
  chroma: number[];
  rms: number;
  spectralSpread: number;
  spectralCentroid: number;
  spectralFlux: number;
}

export class AudioAnalyzer {
  private context: AudioContext;
  private source: AudioNode | null = null;
  private analyzer: any = null;
  private nativeAnalyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  public latestFeatures: AudioFeatures | null = null;

  constructor() {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass();
  }

  async start(audioElement?: HTMLAudioElement): Promise<void> {
    if (this.context.state === 'suspended') await this.context.resume();

    try {
      if (audioElement) {
        this.source = this.context.createMediaElementSource(audioElement);
        this.source.connect(this.context.destination);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
        this.source = this.context.createMediaStreamSource(stream);
      }

      // 1. NATIVE ANALYSER (High Res for Peak Finding)
      this.nativeAnalyser = this.context.createAnalyser();
      this.nativeAnalyser.fftSize = 2048;
      this.nativeAnalyser.smoothingTimeConstant = 0.75;
      this.source.connect(this.nativeAnalyser);

      this.dataArray = new Uint8Array(this.nativeAnalyser.frequencyBinCount);

      // 2. MEYDA (Secondary features)
      this.analyzer = Meyda.createMeydaAnalyzer({
        audioContext: this.context,
        source: this.source,
        bufferSize: 1024,
        featureExtractors: ['chroma', 'rms', 'spectralSpread', 'spectralCentroid', 'spectralFlux'],
        callback: (f: any) => { this.latestFeatures = f; }
      });

      // Keep context hot
      const sink = this.context.createGain();
      sink.gain.value = 0.00001;
      this.source.connect(sink);
      sink.connect(this.context.destination);

      this.analyzer.start();
      if (audioElement) audioElement.play();

    } catch (err) {
      console.error("Critical Audio Error:", err);
      throw err;
    }
  }

  getFrequencyData(): Uint8Array | null {
    if (!this.nativeAnalyser || !this.dataArray) return null;
    (this.nativeAnalyser as any).getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getSampleRate(): number {
    return this.context.sampleRate;
  }

  getRawVolume(): number {
    const data = this.getFrequencyData();
    if (!data) return 0;
    let max = 0;
    for (let i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
    return max / 255;
  }

  getFeatures(): AudioFeatures | null { return this.latestFeatures; }
  getState(): string { return this.context.state; }
  getDestination(): AudioNode { return this.context.destination; }

  async stop() {
    if (this.analyzer) this.analyzer.stop();
    if (this.source) this.source.disconnect();
    await this.context.suspend();
  }
}
