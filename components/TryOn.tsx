import React, { useEffect, useRef, useState } from 'react';
import { useTouchGestures } from '../hooks/useTouchGestures';

interface TryOnProps {
    imageUrl: string;
    onClose: () => void;
}

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const TryOn: React.FC<TryOnProps> = ({ imageUrl, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const { transformStyle, ...touchHandlers } = useTouchGestures();

    useEffect(() => {
        let stream: MediaStream | null = null;
        
        const startCamera = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("Camera not supported on this device.");
                }
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: "environment" } // Prefer back camera
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err: any) {
                console.error("Error accessing camera:", err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError("Camera permission denied. Please enable it in your browser settings.");
                } else {
                    setError("Could not access camera. Please ensure it is not in use by another application.");
                }
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute top-0 left-0 w-full h-full object-cover"
            />
            
            {error ? (
                <div className="z-10 p-4 bg-red-800/80 text-white rounded-lg text-center">
                    <p className="font-bold">Camera Error</p>
                    <p>{error}</p>
                </div>
            ) : (
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 touch-none"
                    style={{ transform: transformStyle }}
                    {...touchHandlers}
                >
                    <img
                        src={imageUrl}
                        alt="Tattoo to try on"
                        className="w-full h-full object-contain pointer-events-none mix-blend-multiply"
                        style={{ opacity: 0.85 }}
                        draggable="false"
                    />
                </div>
            )}
            
            <div className="absolute top-4 right-4 z-20">
                <button
                    onClick={onClose}
                    className="p-2 bg-black/50 rounded-full hover:bg-black/80 transition-colors"
                    aria-label="Close try on"
                >
                    <CloseIcon />
                </button>
            </div>
            
            {!error && (
                <div className="absolute bottom-4 left-4 right-4 z-20 text-center p-2 bg-black/50 rounded-md">
                    <p className="text-white text-sm">Pinch to zoom, drag to move, rotate with two fingers.</p>
                </div>
            )}
        </div>
    );
};

export default TryOn;