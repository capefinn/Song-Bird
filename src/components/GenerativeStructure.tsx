import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Mesh, Color } from 'three';
import { Text, Sphere, Float, Line, Billboard } from '@react-three/drei';
import type { AudioAnalyzer } from '../audio/AudioAnalyzer';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Data Point Interface with 4 key pieces of information
interface DataPoint {
    id: number;
    position: Vector3;
    color: string;         // Most active frequency band color at emission
    amplitude: number;     // 0 to 1 scale
    emissionTime: number;  // Absolute time since start (seconds)
    birthTime: number;     // Clock time when created (for lifetime calc)
}

interface GlowMarker {
    id: number;
    position: Vector3;
    color: string;
    birthTime: number;
}

export function GenerativeStructure({
    analyzer,
    trailColor = "#ede5ff",
    structureColor = "#d96363",
    lineWeight = 1.0,
    turbulence = 0.0,
    formation = 'ORBIT',
    symphonicMode = false,
    onDataPoint
}: {
    analyzer: AudioAnalyzer | null,
    trailColor?: string,
    structureColor?: string,
    lineWeight?: number,
    turbulence?: number,
    formation?: 'ORBIT' | 'PHYLLOTAXIS' | 'FRACTAL',
    symphonicMode?: boolean,
    onDataPoint?: (point: {
        color: string,
        amplitude: number,
        emissionTime: number,
        note: string,
        brightness: number
    }) => void
}) {
    const groupRef = useRef<Group>(null);
    const cursorRef = useRef(new Vector3(0, 0, 0));
    const fireflyRef = useRef<Mesh>(null);
    const lightRef = useRef<any>(null);
    const anchorRefs = useRef<(Group | null)[]>([]);

    // Data Points System
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
    const dataPointIdRef = useRef(0);
    const lastEmitTimeRef = useRef(0);
    const startTimeRef = useRef<number | null>(null);
    const currentTimeRef = useRef(0);

    // Trail Points (Using state for Line components compatibility)
    const [cometPoints, setCometPoints] = useState<Vector3[]>([]);
    const [structurePoints, setStructurePoints] = useState<Vector3[]>([]);

    const lastNoteRef = useRef(-1);
    const wasLockedRef = useRef(false);
    const sustainRef = useRef(0);
    const brightnessRef = useRef(0.5);
    const currentLabel = useRef("LISTENING...");

    // Glow markers for note release
    const [glowMarkers, setGlowMarkers] = useState<GlowMarker[]>([]);
    const glowIdRef = useRef(0);

    // 1. CONSTELLATION LAYOUT
    const anchors = useMemo(() => {
        const radius = 40;
        return Array.from({ length: 12 }).map((_, i) => {
            let pos = new Vector3();

            if (formation === 'PHYLLOTAXIS') {
                const phi = Math.acos(1 - 2 * (i + 0.5) / 12);
                const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
                pos.set(
                    radius * Math.cos(theta) * Math.sin(phi),
                    radius * Math.sin(theta) * Math.sin(phi),
                    radius * Math.cos(phi)
                );
            } else if (formation === 'FRACTAL') {
                const layer = Math.floor(i / 4);
                const subIndex = i % 4;
                const angle = (subIndex / 4) * Math.PI * 2 + (layer * Math.PI / 4);
                const r = radius * Math.pow(0.6, layer);
                const z = (layer - 1) * 15;
                pos.set(
                    r * Math.cos(angle),
                    r * Math.sin(angle),
                    z
                );
            } else {
                const angle = (i / 12) * Math.PI * 2;
                const phi = Math.acos(-1 + (2 * i) / 11);
                pos.set(
                    radius * Math.sin(phi) * Math.cos(angle),
                    radius * Math.sin(phi) * Math.sin(angle),
                    radius * Math.cos(phi)
                );
            }

            return {
                pos: pos,
                name: NOTE_NAMES[i],
                color: `hsl(${(i * 30)}, 70%, 65%)`,
                offset: Math.random() * 10
            };
        });
    }, [formation]);

    useFrame((state, delta) => {
        if (!analyzer) return;

        const freqData = analyzer.getFrequencyData();
        const volume = analyzer.getRawVolume();
        const features = analyzer.getFeatures();
        if (!freqData) return;

        // Initialize start time
        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.getElapsedTime();
        }
        const absoluteTime = state.clock.getElapsedTime() - startTimeRef.current;

        let targetPos = new Vector3(0, 0, 0);
        let isNoteLocked = false;
        let activeColor = new Color(trailColor);
        let activeColorHex = trailColor;

        // 2. MUSICAL LOGIC (PEAK vs CHROMA)
        if (symphonicMode && features?.chroma) {
            const chroma = features.chroma;
            let maxChroma = 0;
            let primaryNote = 0;

            const weightedPos = new Vector3(0, 0, 0);
            let totalWeight = 0;

            chroma.forEach((val, i) => {
                if (val > maxChroma) { maxChroma = val; primaryNote = i; }

                const weight = Math.pow(val, 2);
                weightedPos.add(anchors[i].pos.clone().multiplyScalar(weight));
                totalWeight += weight;

                const ref = anchorRefs.current[i];
                if (ref) {
                    const mesh = ref.children[0] as Mesh;
                    const scale = 1 + (val * 12);
                    mesh.scale.lerp(new Vector3(scale, scale, scale), 0.2);
                    (mesh.material as any).opacity = 0.05 + (val * 0.9);
                }
            });

            if (totalWeight > 0.01) {
                targetPos.copy(weightedPos.divideScalar(totalWeight));
                isNoteLocked = true;
                activeColor.copy(new Color(anchors[primaryNote].color));
                activeColorHex = anchors[primaryNote].color;
            }
        } else {
            let maxVal = 0;
            let maxBin = -1;
            let avgVal = 0;

            for (let i = 10; i < freqData.length / 2; i++) {
                avgVal += freqData[i];
                if (freqData[i] > maxVal) { maxVal = freqData[i]; maxBin = i; }
            }
            avgVal /= (freqData.length / 2);

            if (maxVal > 70 && maxVal > avgVal * 2.5 && maxBin > 0) {
                const nyquist = analyzer.getSampleRate() / 2;
                const freq = maxBin * (nyquist / freqData.length);

                if (freq > 0) {
                    const midi = Math.round(12 * Math.log2(freq / 440) + 69);
                    const dNote = (midi % 12 + 12) % 12;

                    isNoteLocked = true;
                    const anchor = anchors[dNote];
                    targetPos.copy(anchor.pos).multiplyScalar(1 + (volume * 0.1));
                    targetPos.y += (features?.spectralCentroid ? (features.spectralCentroid / 200) - 20 : 0);

                    activeColor.copy(new Color(anchor.color)).lerp(new Color(trailColor), 0.3);
                    activeColorHex = anchor.color;
                    currentLabel.current = NOTE_NAMES[dNote];
                    lastNoteRef.current = dNote;
                }
            }
        }

        // 3. DATA POINT EMISSION (More frequent, lower threshold)
        const now = state.clock.getElapsedTime();
        if (isNoteLocked && volume > 0.05 && (now - lastEmitTimeRef.current) > 0.15) {
            const newPoint: DataPoint = {
                id: dataPointIdRef.current++,
                position: cursorRef.current.clone(),
                color: activeColorHex,
                amplitude: Math.min(volume, 1),
                emissionTime: absoluteTime,
                birthTime: now
            };
            setDataPoints(prev => [...prev, newPoint].slice(-50));
            lastEmitTimeRef.current = now;

            // Callback to App for UI panel with rich data
            if (onDataPoint) {
                onDataPoint({
                    color: activeColorHex,
                    amplitude: Math.min(volume, 1),
                    emissionTime: absoluteTime,
                    note: currentLabel.current,
                    brightness: features?.spectralCentroid ? Math.min(features.spectralCentroid / 5000, 1) : 0
                });
            }
        }

        // 4. GLOW ON NOTE RELEASE
        if (wasLockedRef.current && !isNoteLocked) {
            // Note just released - spawn a glow marker
            const newGlow: GlowMarker = {
                id: glowIdRef.current++,
                position: cursorRef.current.clone(),
                color: activeColorHex,
                birthTime: now
            };
            setGlowMarkers(prev => [...prev, newGlow].slice(-20));
        }
        wasLockedRef.current = isNoteLocked;

        // Track sustain (how long same note is held)
        if (isNoteLocked) {
            sustainRef.current += delta;
        } else {
            sustainRef.current = Math.max(0, sustainRef.current - delta * 2);
        }

        // Track brightness for line width
        brightnessRef.current = features?.spectralCentroid
            ? Math.min(features.spectralCentroid / 3000, 1)
            : brightnessRef.current * 0.95;

        // 5. MOTION & PROXIMITY
        const zipSpeed = isNoteLocked ? 40 : 4;
        cursorRef.current.lerp(targetPos, zipSpeed * delta);

        anchors.forEach((a, i) => {
            const ref = anchorRefs.current[i];
            if (!ref) return;
            const dist = cursorRef.current.distanceTo(a.pos);
            const proximity = Math.max(0, 1 - dist / 25);

            const t = state.clock.getElapsedTime();
            ref.position.x = Math.sin(t * 0.4 + a.offset) * 1.5;
            ref.position.y = Math.cos(t * 0.5 + a.offset) * 1.5;
            ref.position.z = Math.sin(t * 0.3 + a.offset) * 1.5;

            const mesh = ref.children[0] as Mesh;
            if (mesh && mesh.material) {
                (mesh.material as any).opacity = 0.08 + proximity * 0.7;
                mesh.scale.setScalar(1 + proximity * 3);
            }
        });

        // 6. TRAIL UPDATES
        const cp = cursorRef.current.clone();

        if (turbulence > 0) {
            const t = state.clock.getElapsedTime();
            cp.y += Math.sin(t * 8 + cp.x * 0.4) * (turbulence * 12.0);
            cp.x += Math.cos(t * 7 + cp.z * 0.4) * (turbulence * 14.0);
            cp.z += Math.sin(t * 6 + cp.y * 0.4) * (turbulence * 8.0);
        }

        // Add sustain-based vertical oscillation
        // Removed as per user request to avoid scattered wave effect


        setCometPoints(prev => [...prev, cp].slice(-80));

        const lastS = structurePoints[structurePoints.length - 1];
        if (!lastS || cp.distanceTo(lastS) > 0.4) {
            setStructurePoints(prev => [...prev, cp].slice(-1500));
        }

        // Clean up old glow markers
        setGlowMarkers(prev => prev.filter(g => now - g.birthTime < 1.5));

        // 7. FIREFLY
        if (fireflyRef.current) {
            fireflyRef.current.position.copy(cursorRef.current);
            const s = 0.08 + (volume * 0.5);
            fireflyRef.current.scale.set(s, s, s);
            (fireflyRef.current.material as any).color.copy(activeColor);
        }
        if (lightRef.current) {
            lightRef.current.position.copy(cursorRef.current);
            lightRef.current.intensity = 20 + (volume * 100);
            lightRef.current.color.copy(activeColor);
        }

        if (groupRef.current) groupRef.current.rotation.y += delta * 0.025;

        // Update time ref for data point lifetime display
        currentTimeRef.current = state.clock.getElapsedTime();
    });

    // Render individual data point with labels
    const DataPointMarker = ({ point, currentTime }: { point: DataPoint, currentTime: number }) => {
        const lifetime = currentTime - point.birthTime;

        return (
            <group position={point.position}>
                {/* The Data Point Sphere */}
                <Sphere args={[0.3, 16, 16]}>
                    <meshBasicMaterial color={point.color} transparent opacity={0.8} />
                </Sphere>

                {/* Billboard labels that always face camera */}
                <Billboard>
                    {/* TOP: Amplitude (0-1) */}
                    <Text
                        position={[0, 1.2, 0]}
                        fontSize={0.5}
                        color="white"
                        anchorX="center"
                        anchorY="bottom"
                        fillOpacity={0.7}
                    >
                        {point.amplitude.toFixed(2)}
                    </Text>

                    {/* LEFT: Lifetime (animated seconds) */}
                    <Text
                        position={[-1.5, 0, 0]}
                        fontSize={0.4}
                        color="#88ff88"
                        anchorX="right"
                        anchorY="middle"
                        fillOpacity={0.6}
                    >
                        {lifetime.toFixed(1)}s
                    </Text>

                    {/* BOTTOM: Emission Time (absolute) */}
                    <Text
                        position={[0, -1.0, 0]}
                        fontSize={0.4}
                        color="#ffaa44"
                        anchorX="center"
                        anchorY="top"
                        fillOpacity={0.6}
                    >
                        @{point.emissionTime.toFixed(1)}s
                    </Text>
                </Billboard>
            </group>
        );
    };

    return (
        <group ref={groupRef}>
            {anchors.map((anchor, i) => (
                <Float key={i} speed={2} rotationIntensity={0.5}>
                    <group
                        position={anchor.pos}
                        ref={el => { anchorRefs.current[i] = el; }}
                    >
                        <Sphere args={[0.15, 12, 12]}>
                            <meshBasicMaterial transparent opacity={0.1} color={anchor.color} />
                        </Sphere>
                        <Text fontSize={0.7} color="white" fillOpacity={0.1} position={[0, -1.8, 0]}>
                            {anchor.name}
                        </Text>
                    </group>
                </Float>
            ))}

            <mesh ref={fireflyRef}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
            <pointLight ref={lightRef} distance={100} decay={2} />

            {/* COMET HEAD - Width varies with brightness */}
            {cometPoints.length > 2 && (
                <Line
                    points={cometPoints}
                    color={trailColor}
                    lineWidth={lineWeight * 6 * (0.5 + brightnessRef.current * 0.5)}
                    transparent
                    opacity={0.7}
                />
            )}

            {/* STRUCTURE MAP */}
            {structurePoints.length > 2 && (
                <Line
                    points={structurePoints}
                    color={structureColor}
                    lineWidth={lineWeight * 0.8}
                    transparent
                    opacity={0.15}
                />
            )}

            {/* GLOW MARKERS - Note release flashes */}
            {glowMarkers.map(glow => {
                const age = currentTimeRef.current - glow.birthTime;
                const fadeOut = Math.max(0, 1 - age / 1.5);
                return (
                    <group key={glow.id} position={glow.position}>
                        <Sphere args={[0.8 + (1 - fadeOut) * 0.8, 16, 16]}>
                            <meshBasicMaterial
                                color={glow.color}
                                transparent
                                opacity={fadeOut * 0.6}
                            />
                        </Sphere>
                        <pointLight
                            color={glow.color}
                            intensity={fadeOut * 50}
                            distance={20}
                            decay={2}
                        />
                    </group>
                );
            })}

            {/* DATA POINTS with metadata labels */}
            {dataPoints.map(point => (
                <DataPointMarker key={point.id} point={point} currentTime={currentTimeRef.current} />
            ))}

            <Text position={[0, -28, 0]} fontSize={1.5} color="white" fillOpacity={0.05}>
                {currentLabel.current}
            </Text>
        </group>
    );
}
