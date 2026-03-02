import { useState, useRef, useEffect, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Capture() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const cameraRef = useRef(null);

    const [cameraActive, setCameraActive] = useState(false);
    const [currentSign, setCurrentSign] = useState('—');
    const [confidence, setConfidence] = useState(0);
    const [accumulatedText, setAccumulatedText] = useState('');
    const [cameraError, setCameraError] = useState('');
    const [autoSpeak, setAutoSpeak] = useState(true);

    // Use refs for values accessed inside MediaPipe callbacks
    // to avoid stale-closure problems with useState
    const isProcessingRef = useRef(false);
    const lastPredictionTime = useRef(0);
    const lastSpokenSign = useRef('');
    const PREDICTION_INTERVAL = 800; // ms between predictions

    // Auto-speak whenever currentSign changes to a valid gesture
    useEffect(() => {
        if (
            autoSpeak &&
            currentSign &&
            currentSign !== '—' &&
            currentSign !== '?' &&
            currentSign !== lastSpokenSign.current
        ) {
            lastSpokenSign.current = currentSign;
            speak(currentSign);
        }
    }, [currentSign, autoSpeak]);

    // Speak helper
    const speak = (text) => {
        if ('speechSynthesis' in window && text) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.85;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Extract landmarks, draw skeleton, send to backend
    const processResults = useCallback(async (results) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // Draw hand skeleton
            for (const landmarks of results.multiHandLandmarks) {
                const connections = [
                    [0, 1], [1, 2], [2, 3], [3, 4],
                    [0, 5], [5, 6], [6, 7], [7, 8],
                    [0, 9], [9, 10], [10, 11], [11, 12],
                    [0, 13], [13, 14], [14, 15], [15, 16],
                    [0, 17], [17, 18], [18, 19], [19, 20],
                    [5, 9], [9, 13], [13, 17]
                ];

                ctx.strokeStyle = '#2980b9';
                ctx.lineWidth = 2.5;
                for (const [i, j] of connections) {
                    ctx.beginPath();
                    ctx.moveTo(landmarks[i].x * canvas.width, landmarks[i].y * canvas.height);
                    ctx.lineTo(landmarks[j].x * canvas.width, landmarks[j].y * canvas.height);
                    ctx.stroke();
                }

                for (const lm of landmarks) {
                    ctx.beginPath();
                    ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = '#1abc9c';
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }

            // Throttle predictions using ref (no stale-closure issue)
            const now = Date.now();
            if (now - lastPredictionTime.current < PREDICTION_INTERVAL) return;
            if (isProcessingRef.current) return;

            lastPredictionTime.current = now;
            isProcessingRef.current = true;

            try {
                // Sort hands left-to-right
                const hands = [...results.multiHandLandmarks].sort(
                    (a, b) => Math.min(...a.map(lm => lm.x)) - Math.min(...b.map(lm => lm.x))
                );

                const dataAux = [];

                for (const landmarks of hands) {
                    const xs = landmarks.map(lm => lm.x);
                    const ys = landmarks.map(lm => lm.y);
                    const minX = Math.min(...xs);
                    const minY = Math.min(...ys);

                    for (const lm of landmarks) {
                        dataAux.push(lm.x - minX);
                        dataAux.push(lm.y - minY);
                    }
                }

                // Pad to 84 features (2 hands × 21 landmarks × 2 coords)
                if (hands.length === 1) {
                    for (let i = 0; i < 42; i++) dataAux.push(0.0);
                }
                while (dataAux.length < 84) dataAux.push(0.0);
                const finalData = dataAux.slice(0, 84);

                const response = await fetch(`${API_URL}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ landmarks: finalData }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setCurrentSign(data.sign);
                    setConfidence(data.confidence);
                }
            } catch (err) {
                console.error('Prediction error:', err);
            } finally {
                isProcessingRef.current = false;
            }
        } else {
            // No hand detected — clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setCurrentSign('—');
            setConfidence(0);
        }
    }, []); // No deps needed — uses only refs

    // Start camera + MediaPipe Hands
    const startCamera = useCallback(async () => {
        try {
            setCameraError('');
            const hands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });

            hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            hands.onResults(processResults);

            const video = videoRef.current;
            const camera = new Camera(video, {
                onFrame: async () => {
                    await hands.send({ image: video });
                },
                width: 640,
                height: 480,
            });

            cameraRef.current = camera;
            await camera.start();
            setCameraActive(true);
        } catch (err) {
            console.error('Camera error:', err);
            setCameraError('Unable to access camera. Please allow camera permissions and try again.');
        }
    }, [processResults]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cameraRef.current) cameraRef.current.stop();
        };
    }, []);

    const addToText = () => {
        if (currentSign && currentSign !== '—' && currentSign !== '?') {
            setAccumulatedText(prev => prev + currentSign);
        }
    };

    const confidencePct = (confidence * 100).toFixed(1);
    const isValidSign = currentSign && currentSign !== '—' && currentSign !== '?';

    return (
        <div className="page">
            <div className="page-container">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h1 className="section-title">Live ISL Capture</h1>
                    <p className="section-subtitle" style={{ margin: '0 auto' }}>
                        Show your ISL sign to the camera — we'll translate it in real-time! 🤟
                    </p>
                </div>

                <div className="capture-layout">
                    {/* ── Camera Feed ─── */}
                    <div className="camera-container" style={{ padding: 0 }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{
                                display: cameraActive ? 'block' : 'none',
                                width: '100%', height: '100%',
                                objectFit: 'cover', transform: 'scaleX(-1)'
                            }}
                        />
                        <canvas
                            ref={canvasRef}
                            style={{
                                display: cameraActive ? 'block' : 'none',
                                position: 'absolute', top: 0, left: 0,
                                width: '100%', height: '100%', transform: 'scaleX(-1)'
                            }}
                        />

                        {!cameraActive && (
                            <div className="camera-permission">
                                <span className="cam-icon">📷</span>
                                <h3>Camera Access Required</h3>
                                <p>{cameraError || 'Click below to start the camera and begin ISL recognition'}</p>
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={startCamera}
                                >
                                    🎥 Start Camera
                                </button>
                            </div>
                        )}

                        {cameraActive && (
                            <div className="camera-overlay">
                                <div className="camera-live-dot"></div>
                                <span className="camera-live-text">Live</span>
                            </div>
                        )}
                    </div>

                    {/* ── Prediction Panel ─── */}
                    <div className="prediction-panel">
                        <div className="neo-card prediction-card">
                            {/* Auto-speak toggle */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                                <button
                                    onClick={() => setAutoSpeak(v => !v)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontSize: '0.78rem', fontWeight: '700',
                                        color: autoSpeak ? '#27ae60' : 'var(--text-muted)',
                                        fontFamily: 'var(--font-body)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                    }}
                                    title="Toggle auto-speech"
                                >
                                    {autoSpeak ? '🔊 Auto-Speak ON' : '🔇 Auto-Speak OFF'}
                                </button>
                            </div>

                            <div className="prediction-label">Detected Sign</div>
                            <div
                                className="prediction-sign"
                                style={{ color: !isValidSign ? 'var(--text-muted)' : undefined }}
                            >
                                {currentSign}
                            </div>

                            <div className="prediction-confidence">
                                Confidence: <strong>{confidencePct}%</strong>
                            </div>
                            <div className="confidence-bar">
                                <div className="confidence-fill" style={{ width: `${confidence * 100}%` }}></div>
                            </div>

                            <div style={{ marginTop: '1.2rem', display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                                <button
                                    className="speak-btn"
                                    onClick={() => speak(currentSign)}
                                    title="Speak detected sign"
                                >
                                    🔊
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={addToText}
                                    disabled={!isValidSign}
                                >
                                    + Add to Text
                                </button>
                            </div>
                        </div>

                        <div className="neo-card text-accumulator">
                            <h3>Accumulated Text</h3>
                            <div className="accumulated-text">
                                {accumulatedText
                                    ? accumulatedText
                                    : <span style={{ color: 'var(--text-muted)', fontSize: '1rem', letterSpacing: 'normal', fontWeight: '400' }}>Signs will appear here...</span>
                                }
                            </div>
                            <div className="text-actions">
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => speak(accumulatedText)}
                                    disabled={!accumulatedText}
                                >
                                    🔊 Speak All
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => navigator.clipboard.writeText(accumulatedText)}
                                    disabled={!accumulatedText}
                                >
                                    📋 Copy
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setAccumulatedText(prev => prev + ' ')}
                                >
                                    ␣ Space
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setAccumulatedText('')}
                                    disabled={!accumulatedText}
                                >
                                    🗑 Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
