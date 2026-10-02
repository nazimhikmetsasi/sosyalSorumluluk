import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { useApp } from '../../context/AppContext';
import { X, QrCode, Camera, CameraOff } from 'lucide-react';

// Frames are shrunk before decoding: a QR code survives it and the scan stays cheap.
const DECODE_WIDTH = 480;
const SCAN_INTERVAL_MS = 150;
// After a rejected code the camera still points at it, so without a pause the same wrong
// code would be submitted every frame.
const RETRY_PAUSE_MS = 2000;

export const ScannerModal = ({ isOpen, onClose }) => {
  const { completeDelivery } = useApp();
  const [cameraError, setCameraError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  // The scan loop outlives renders, so it reads the latest callbacks through a ref.
  const handlersRef = useRef({ completeDelivery, onClose });
  useEffect(() => {
    handlersRef.current = { completeDelivery, onClose };
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    let stream;
    let timer;
    let stopped = false;
    let busy = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const scan = async () => {
      const video = videoRef.current;
      if (stopped) return;
      if (!busy && video && video.readyState >= 2 && video.videoWidth) {
        canvas.width = Math.min(DECODE_WIDTH, video.videoWidth);
        canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const found = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: 'dontInvert' });
        if (found?.data) {
          busy = true;
          const ok = await handlersRef.current.completeDelivery(found.data);
          if (stopped) return;
          if (ok) {
            handlersRef.current.onClose();
            return;
          }
          await new Promise(resolve => setTimeout(resolve, RETRY_PAUSE_MS));
          busy = false;
        }
      }
      timer = setTimeout(scan, SCAN_INTERVAL_MS);
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Bu tarayıcı kamerayı desteklemiyor. QR okutmak için kamera gerekir.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        setCameraError('');
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
        scan();
      } catch {
        setCameraError('Kameraya erişilemedi. Tarayıcı adres çubuğundan kamera iznini verin.');
      }
    })();

    return () => {
      stopped = true;
      setCameraReady(false);
      clearTimeout(timer);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-gray-900 text-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-700">

        {/* Header */}
        <div className="p-4 bg-gray-800/80 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#52B788]" />
            <h3 className="font-bold text-sm">Canlı QR Kod Tarayıcı</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center space-y-5">

          <div className="relative w-64 h-64 bg-black rounded-3xl border-2 border-[#52B788]/60 overflow-hidden flex items-center justify-center shadow-inner">

            <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />

            {cameraError ? (
              <div className="relative z-10 px-6 text-center space-y-2">
                <CameraOff className="w-12 h-12 text-gray-600 mx-auto" />
                <p className="text-xs text-gray-400 font-semibold">{cameraError}</p>
              </div>
            ) : (
              !cameraReady && <QrCode className="w-28 h-28 text-gray-700 opacity-40 animate-pulse" />
            )}

            {/* Viewfinder Target corners */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-[#52B788] rounded-tl-lg"></div>
            <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-[#52B788] rounded-tr-lg"></div>
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-[#52B788] rounded-bl-lg"></div>
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-[#52B788] rounded-br-lg"></div>

            {!cameraError && (
              <>
                <div className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-[#52B788] to-transparent shadow-[0_0_15px_#52B788] animate-bounce"></div>
                <div className="absolute bottom-3 bg-black/60 px-3 py-1 rounded-full text-[10px] text-[#95D5B2] font-semibold">
                  Kamerayı alıcının QR koduna tutun
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
