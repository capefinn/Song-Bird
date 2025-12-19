import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Mesh, Color, BufferGeometry } from 'three';
import { Text, Sphere, Float } from '@react-three/drei';
import type { AudioAnalyzer } from '../audio/AudioAnalyzer';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function GenerativeStructure({
    analyzer,
    trailColor = "#00ffcc",
    structureColor = "#ffffff"
}: { analyzer: AudioAnalyzer | null, trailColor?: string, structureColor?: string }) {
    const groupRef = useRef<Group>(null);
    const cursorRef = useRef(new Vector3(0, 0, 0));
    const fireflyRef = useRef<Mesh>(null);
    const lightRef = useRef<any>(null);
    const anchorRefs = useRef<(Group | null)[]>([]);

    // Geometry Refs (High Performance, No State)
    const cometGeoRef = useRef<BufferGeometry>(null);
    const structureGeoRef = useRef<BufferGeometry>(null);

    // Data Buffers
    const cometPositions = useMemo(() => new Float32Array(150 * 3).fill(0), []);
    const structurePositions = useMemo(() => new Float32Array(2000 * 3).fill(0), []);
    const structureIdx = useRef(0);

    const lastNoteRef = useRef(-1);
    const currentLabel = useRef("LISTENING...");

    // 1. CONSTELLATION LAYOUT
    const anchors = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const phi = Math.acos(-1 + (2 * i) / 11);
            const r = 40;
            return {
                pos: new Vector3(
                    r * Math.sin(phi) * Math.cos(angle),
                    r * Math.sin(phi) * Math.sin(angle),
                    r * Math.cos(phi)
                ),
                name: NOTE_NAMES[i],
                color: `hsl(${(i * 30)}, 70%, 65%)`,
                offset: Math.random() * 10
            };
        });
    }, []);

    useFrame((state, delta) => {
        if (!analyzer) return;

        const freqData = analyzer.getFrequencyData();
        const volume = analyzer.getRawVolume();
        const features = analyzer.getFeatures();
        if (!freqData) return;

        // 2. STABLE PEAK DETECTION
        let maxVal = 0;
        let maxBin = -1;
        for (let i = 10; i < freqData.length / 2; i++) {
            if (freqData[i] > maxVal) { maxVal = freqData[i]; maxBin = i; }
        }

        let targetPos = new Vector3(0, 0, 0);
        let isNoteLocked = false;
        let activeColor = new Color(trailColor);

        if (maxVal > 40 && maxBin > 0) {
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

        // 4. BUFFER UPDATES
        const cp = cursorRef.current;

        // Comet Head (Shift buffer)
        for (let i = 149; i > 0; i--) {
            cometPositions[i * 3] = cometPositions[(i - 1) * 3];
            cometPositions[i * 3 + 1] = cometPositions[(i - 1) * 3 + 1];
            cometPositions[i * 3 + 2] = cometPositions[(i - 1) * 3 + 2];
        }
        cometPositions[0] = cp.x; cometPositions[1] = cp.y; cometPositions[2] = cp.z;
        if (cometGeoRef.current) cometGeoRef.current.attributes.position.needsUpdate = true;

        // Structure Map
        const lastIdx = (structureIdx.current === 0 ? 1999 : structureIdx.current - 1) * 3;
        const distToLast = Math.hypot(cp.x - structurePositions[lastIdx], cp.y - structurePositions[lastIdx + 1], cp.z - structurePositions[lastIdx + 2]);

        if (distToLast > 0.3) {
            structurePositions[structureIdx.current * 3] = cp.x;
            structurePositions[structureIdx.current * 3 + 1] = cp.y;
            structurePositions[structureIdx.current * 3 + 2] = cp.z;
            structureIdx.current = (structureIdx.current + 1) % 2000;
            if (structureGeoRef.current) structureGeoRef.current.attributes.position.needsUpdate = true;
        }

        // 5. FIREFLY
        if (fireflyRef.current) {
            fireflyRef.current.position.copy(cp);
            const s = 0.06 + (volume * 0.4);
            fireflyRef.current.scale.set(s, s, s);
            (fireflyRef.current.material as any).color.copy(activeColor);
        }
        if (lightRef.current) {
            lightRef.current.position.copy(cp);
            lightRef.current.intensity = 15 + (volume * 60);
            lightRef.current.color.copy(activeColor);
        }

        if (groupRef.current) groupRef.current.rotation.y += delta * 0.025;
    });

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

            {/* COMET HEAD (Low-level line) */}
            <line>
                <bufferGeometry ref={cometGeoRef}>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[cometPositions, 3]}
                    />
                </bufferGeometry>
                <lineBasicMaterial color={trailColor} linewidth={2} transparent opacity={0.6} />
            </line>

            {/* STRUCTURE MAP (Low-level line) */}
            <line>
                <bufferGeometry ref={structureGeoRef}>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[structurePositions, 3]}
                    />
                </bufferGeometry>
                <lineBasicMaterial color={structureColor} transparent opacity={0.1} />
            </line>

            <Text position={[0, -28, 0]} fontSize={1.5} color="white" fillOpacity={0.05}>
                {currentLabel.current}
            </Text>
        </group>
    );
}
