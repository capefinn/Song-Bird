import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Mesh, Color } from 'three';
import { Text, Sphere, Float, Line } from '@react-three/drei';
import type { AudioAnalyzer } from '../audio/AudioAnalyzer';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function GenerativeStructure({
    analyzer,
    trailColor = "#ede5ff",
    structureColor = "#d96363",
    lineWeight = 1.0,
    turbulence = 0.0,
    formation = 'ORBIT',
    symphonicMode = false,
    particleColor = '#4cc9f0',
    particleSize = 0.2
}: {
    analyzer: AudioAnalyzer | null,
    trailColor?: string,
    structureColor?: string,
    lineWeight?: number,
    turbulence?: number,
    formation?: 'ORBIT' | 'PHYLLOTAXIS' | 'FRACTAL',
    symphonicMode?: boolean,
    particleColor?: string,
    particleSize?: number
}) {
    const groupRef = useRef<Group>(null);
    const particleGroupRef = useRef<any>(null);
    const cursorRef = useRef(new Vector3(0, 0, 0));
    const fireflyRef = useRef<Mesh>(null);
    const lightRef = useRef<any>(null);
    const anchorRefs = useRef<(Group | null)[]>([]);

    // 0. PARTICLE CLOUD DATA
    const particles = useMemo(() => {
        const count = 1500;
        const positions = new Float32Array(count * 3);
        const drift = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const r = 60 + Math.random() * 140;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            drift[i] = Math.random() * Math.PI * 2;
        }
        return { positions, drift };
    }, []);

    // Trail Points (Using state for Line components compatibility)
    const [cometPoints, setCometPoints] = useState<Vector3[]>([]);
    const [structurePoints, setStructurePoints] = useState<Vector3[]>([]);

    const lastNoteRef = useRef(-1);
    const currentLabel = useRef("LISTENING...");

    // 1. CONSTELLATION LAYOUT
    const anchors = useMemo(() => {
        const radius = 40;
        return Array.from({ length: 12 }).map((_, i) => {
            let pos = new Vector3();

            if (formation === 'PHYLLOTAXIS') {
                // Natural Fibonacci Spiral on a Sphere
                const phi = Math.acos(1 - 2 * (i + 0.5) / 12);
                const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
                pos.set(
                    radius * Math.cos(theta) * Math.sin(phi),
                    radius * Math.sin(theta) * Math.sin(phi),
                    radius * Math.cos(phi)
                );
            } else if (formation === 'FRACTAL') {
                // Recursive crystalline structure (Nested Layers)
                const layer = Math.floor(i / 4); // 3 layers of 4
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
                // Default ORBIT (Spherical Shell)
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

        // 2. PARTICLE ANIMATION (Interconnected Atmosphere)
        if (particleGroupRef.current) {
            const time = state.clock.getElapsedTime();
            const positions = particleGroupRef.current.geometry.attributes.position.array;

            for (let i = 0; i < particles.positions.length / 3; i++) {
                const i3 = i * 3;
                const offset = particles.drift[i];
                // Organic drift + volume reaction
                const reaction = volume * 1.5;
                positions[i3] += Math.sin(time * 0.2 + offset) * 0.05 + (Math.random() - 0.5) * reaction;
                positions[i3 + 1] += Math.cos(time * 0.3 + offset) * 0.05 + (Math.random() - 0.5) * reaction;
                positions[i3 + 2] += Math.sin(time * 0.25 + offset) * 0.05 + (Math.random() - 0.5) * reaction;
            }
            particleGroupRef.current.geometry.attributes.position.needsUpdate = true;
            particleGroupRef.current.rotation.y += delta * 0.05;
        }

        let targetPos = new Vector3(0, 0, 0);
        let isNoteLocked = false;
        let activeColor = new Color(trailColor);

        // 2. MUSICAL LOGIC (PEAK vs CHROMA)
        if (symphonicMode && features?.chroma) {
            // SYMPHONIC MODE: Weighted Harmonic Influence
            const chroma = features.chroma;
            let maxChroma = 0;
            let primaryNote = 0;

            // Influence the target position by all active notes
            const weightedPos = new Vector3(0, 0, 0);
            let totalWeight = 0;

            chroma.forEach((val, i) => {
                if (val > maxChroma) { maxChroma = val; primaryNote = i; }

                // Boost contribution of cleaner notes
                const weight = Math.pow(val, 2);
                weightedPos.add(anchors[i].pos.clone().multiplyScalar(weight));
                totalWeight += weight;

                // Animate anchors based on Chroma (Holographic Resonance)
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
            }
        } else {
            // BIRD MODE: Surgical Single Peak
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
                    currentLabel.current = NOTE_NAMES[dNote];
                    lastNoteRef.current = dNote;
                }
            }
        }

        // 3. MOTION & PROXIMITY
        const zipSpeed = isNoteLocked ? 40 : 4;
        cursorRef.current.lerp(targetPos, zipSpeed * delta);

        // Update Anchor Glows & Organic Drift
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

        // 4. TRAIL UPDATES
        const cp = cursorRef.current.clone();

        // Apply Waviness to the incoming point (Much more aggressive now)
        if (turbulence > 0) {
            const t = state.clock.getElapsedTime();
            cp.y += Math.sin(t * 8 + cp.x * 0.4) * (turbulence * 12.0);
            cp.x += Math.cos(t * 7 + cp.z * 0.4) * (turbulence * 14.0);
            cp.z += Math.sin(t * 6 + cp.y * 0.4) * (turbulence * 8.0);
        }

        // Comet Head
        setCometPoints(prev => [...prev, cp].slice(-80));

        // Structure Map
        const lastS = structurePoints[structurePoints.length - 1];
        if (!lastS || cp.distanceTo(lastS) > 0.4) {
            setStructurePoints(prev => [...prev, cp].slice(-1500));
        }

        // 5. FIREFLY
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
    });

    return (
        <group ref={groupRef}>
            {/* 0. PARTICLE CLOUD */}
            <points ref={particleGroupRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[particles.positions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={particleSize}
                    color={particleColor}
                    transparent
                    opacity={0.4}
                    sizeAttenuation
                    depthWrite={false}
                    blending={2} // Additive Blending
                />
            </points>

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

            {/* COMET HEAD (drei Line for real width) */}
            {cometPoints.length > 2 && (
                <Line
                    points={cometPoints}
                    color={trailColor}
                    lineWidth={lineWeight * 6}
                    transparent
                    opacity={0.7}
                />
            )}

            {/* STRUCTURE MAP (drei Line for real width) */}
            {structurePoints.length > 2 && (
                <Line
                    points={structurePoints}
                    color={structureColor}
                    lineWidth={lineWeight * 0.8}
                    transparent
                    opacity={0.15}
                />
            )}

            <Text position={[0, -28, 0]} fontSize={1.5} color="white" fillOpacity={0.05}>
                {currentLabel.current}
            </Text>
        </group>
    );
}
