import { useEffect, useRef } from 'react';
import { Hands } from '@mediapipe/hands';
import type { Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export interface HandData {
    isVisible: boolean;
    distance: number; // 0 to 1, distance between hands
    center: { x: number, y: number, z: number };
}

interface HandTrackerProps {
    onHandUpdate: (data: HandData) => void;
}

export const HandTracker = ({ onHandUpdate }: HandTrackerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const handsRef = useRef<Hands | null>(null);

    useEffect(() => {
        if (!videoRef.current) return;

        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        hands.onResults((results: Results) => {
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                let handData: HandData = {
                    isVisible: true,
                    distance: 1,
                    center: { x: 0, y: 0, z: 0 },
                };

                const landmarks = results.multiHandLandmarks;

                if (landmarks.length === 2) {
                    // Calculate distance between hands
                    const h1 = landmarks[0][9]; // Middle finger MCP
                    const h2 = landmarks[1][9];
                    const dist = Math.sqrt(
                        Math.pow(h1.x - h2.x, 2) +
                        Math.pow(h1.y - h2.y, 2) +
                        Math.pow(h1.z - h2.z, 2)
                    );
                    handData.distance = Math.min(dist * 2, 1); // Normalize roughly
                    handData.center = {
                        x: (h1.x + h2.x) / 2,
                        y: (h1.y + h2.y) / 2,
                        z: (h1.z + h2.z) / 2,
                    };
                } else {
                    // Single hand - distance based on z or just default
                    const h = landmarks[0][9];
                    handData.distance = 0.5 + Math.abs(h.z) * 2;
                    handData.center = { x: h.x, y: h.y, z: h.z };
                }

                // Map Mediapipe (0,0 is top-left) to internal space (-1 to 1)
                handData.center.x = (handData.center.x - 0.5) * 2;
                handData.center.y = (0.5 - handData.center.y) * 2;

                onHandUpdate(handData);
            } else {
                onHandUpdate({ isVisible: false, distance: 1, center: { x: 0, y: 0, z: 0 } });
            }
        });

        const camera = new Camera(videoRef.current, {
            onFrame: async () => {
                await hands.send({ image: videoRef.current! });
            },
            width: 640,
            height: 480,
        });

        camera.start();
        handsRef.current = hands;

        return () => {
            camera.stop();
            hands.close();
        };
    }, [onHandUpdate]);

    return (
        <video
            ref={videoRef}
            style={{ display: 'none' }}
            playsInline
        />
    );
};
