'use client';

import React from 'react';
import { extractRoomCodeFromQr } from '../utils/qr';

type DetectedBarcode = {
  rawValue?: string;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
};

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onRoomCode: (roomCode: string) => void;
}

function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  if (typeof window === 'undefined') return null;
  const candidate = (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  return candidate ?? null;
}

export function QrScannerModal({ open, onClose, onRoomCode }: QrScannerModalProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const stoppedRef = React.useRef(false);
  const [message, setMessage] = React.useState('Point your camera at an RMIT room QR code.');
  const [isScanning, setIsScanning] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    let frameId = 0;
    stoppedRef.current = false;
    queueMicrotask(() => setMessage('Point your camera at an RMIT room QR code.'));

    async function startScanner() {
      const BarcodeDetector = getBarcodeDetector();
      if (!BarcodeDetector) {
        setMessage('QR scanning is not supported in this browser. Try opening this app in Chrome or Edge on your phone.');
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage('Camera access is not available. Use a supported mobile browser over HTTPS.');
        return;
      }

      try {
        setIsScanning(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d', { willReadFrequently: true });

        const scanFrame = async () => {
          if (stoppedRef.current || !video || !canvas || !context) return;

          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            try {
              const codes = await detector.detect(canvas);
              const decoded = codes.find((code) => code.rawValue)?.rawValue;
              if (decoded) {
                const roomCode = extractRoomCodeFromQr(decoded);
                if (roomCode) {
                  onRoomCode(roomCode);
                  onClose();
                  return;
                }
                setMessage('QR scanned, but no RMIT room code was found in it.');
              }
            } catch {
              setMessage('Could not read that frame. Hold the camera steady and try again.');
            }
          }

          frameId = window.setTimeout(scanFrame, 250);
        };

        await scanFrame();
      } catch {
        setMessage('Camera permission was blocked. Allow camera access and try again.');
      } finally {
        setIsScanning(false);
      }
    }

    void startScanner();

    return () => {
      stoppedRef.current = true;
      window.clearTimeout(frameId);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsScanning(false);
    };
  }, [onClose, onRoomCode, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black text-white">
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />

      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/75 to-transparent px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <h2 className="text-base font-semibold leading-tight">Scan Room QR</h2>
          <p className="text-xs text-white/75">RMIT timetable sign</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/25 active:scale-95"
        >
          Close
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-8">
        <div className="relative aspect-square w-full max-w-[320px] rounded-[24px] border-2 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.32)]">
          <span className="absolute -left-1 -top-1 h-10 w-10 rounded-tl-[24px] border-l-4 border-t-4 border-[#E60028]" />
          <span className="absolute -right-1 -top-1 h-10 w-10 rounded-tr-[24px] border-r-4 border-t-4 border-[#E60028]" />
          <span className="absolute -bottom-1 -left-1 h-10 w-10 rounded-bl-[24px] border-b-4 border-l-4 border-[#E60028]" />
          <span className="absolute -bottom-1 -right-1 h-10 w-10 rounded-br-[24px] border-b-4 border-r-4 border-[#E60028]" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-14 text-center">
        <p className="mx-auto max-w-sm text-sm font-medium text-white">{message}</p>
        {!isScanning && (
          <p className="mx-auto mt-2 max-w-xs text-xs text-white/65">
            Camera preview starts after browser permission is granted.
          </p>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
