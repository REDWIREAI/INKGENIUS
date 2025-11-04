// FIX: Import `React` to make the React namespace available for types.
import React, { useState, useCallback } from 'react';

// Helper function to calculate distance between two points
const getDistance = (touches: React.TouchList): number => {
    const [touch1, touch2] = [touches[0], touches[1]];
    return Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );
};

// Helper function to calculate the angle between two points
const getAngle = (touches: React.TouchList): number => {
    const [touch1, touch2] = [touches[0], touches[1]];
    return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX) * 180 / Math.PI;
};

interface Transform {
    x: number;
    y: number;
    scale: number;
    rotation: number;
}

export const useTouchGestures = () => {
    const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1, rotation: 0 });
    const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null);
    const [lastDistance, setLastDistance] = useState<number | null>(null);
    const [lastAngle, setLastAngle] = useState<number | null>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 1) {
            setLastPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        } else if (e.touches.length === 2) {
            setLastDistance(getDistance(e.touches));
            setLastAngle(getAngle(e.touches));
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.touches.length === 1 && lastPosition) {
            const touch = e.touches[0];
            const dx = touch.clientX - lastPosition.x;
            const dy = touch.clientY - lastPosition.y;
            setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setLastPosition({ x: touch.clientX, y: touch.clientY });
        } else if (e.touches.length === 2 && lastDistance && lastAngle !== null) {
            const newDistance = getDistance(e.touches);
            const newAngle = getAngle(e.touches);

            const scale = newDistance / lastDistance;
            const rotation = newAngle - lastAngle;

            setTransform(prev => ({
                ...prev,
                scale: Math.max(0.1, prev.scale * scale),
                rotation: prev.rotation + rotation
            }));

            setLastDistance(newDistance);
            setLastAngle(newAngle);
        }
    }, [lastPosition, lastDistance, lastAngle]);

    const handleTouchEnd = useCallback(() => {
        setLastPosition(null);
        setLastDistance(null);
        setLastAngle(null);
    }, []);

    const transformStyle = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`;

    return {
        transformStyle,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
    };
};
