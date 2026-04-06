import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

export default function Calibrate() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('Loading model...');
  const [model, setModel] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    setup();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const setup = async () => {
    await tf.setBackend('webgl');
    await tf.ready();
    const loadedModel = await mobilenet.load();
    setModel(loadedModel);
    setStatus('Model ready! Starting camera...');
    startCamera(loadedModel);
  };

  const startCamera = async (loadedModel) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(resolve);
          };
        });
        setCameraActive(true);
        setStatus('Camera ready! Point at your doodle and click Capture');
      }
    } catch (err) {
      setStatus('Camera error: ' + err.message);
    }
  };

  const captureReference = async () => {
    if (!model || !videoRef.current || !canvasRef.current) return;
    setStatus('Capturing...');
    try {
      const canvas = canvasRef.current;
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 224, 224);
      const img = tf.browser.fromPixels(canvas);
      const embedding = model.infer(img, true);
      const data = await embedding.data();
      const embeddingArray = Array.from(data);
      const json = JSON.stringify({ embedding: embeddingArray });
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reference-embedding.json';
      a.click();
      setStatus('✅ Downloaded! Now upload reference-embedding.json to public/ folder on GitHub');
      img.dispose();
      embedding.dispose();
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  };

  return (
    <div style={{ padding: 20, background: '#000', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ color: '#00ff00' }}>Calibrate Art Scanner</h1>
      <p>{status}</p>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxWidth: 600, borderRadius: 8 }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <br />
      <button
        onClick={captureReference}
        disabled={!cameraActive}
        style={{ marginTop: 16, padding: '12px 24px', background: '#00ff00', color: '#000', fontSize: 18, borderRadius: 8, cursor: 'pointer', border: 'none' }}
      >
        Capture Reference
      </button>
    </div>
  );
}
