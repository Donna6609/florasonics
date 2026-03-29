import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function AudioVisualization({ isActive, volume, color, soundId }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const barCount = 24;
    const barWidth = width / barCount;

    // Different wave patterns based on sound type
    const getWavePattern = (index, time) => {
      const x = index / barCount;
      const volumeFactor = volume / 100;

      switch (soundId) {
        case "rain":
        case "thunder":
          return Math.random() * height * 0.7 * volumeFactor;
        case "ocean":
        case "stream":
          return Math.sin(x * Math.PI * 2 + time * 2) * height * 0.4 * volumeFactor;
        case "wind":
        case "fan":
          return (Math.sin(x * Math.PI * 3 + time * 3) + Math.sin(x * Math.PI * 5 + time * 1.5)) * height * 0.25 * volumeFactor;
        case "fire":
          return (Math.random() * 0.7 + Math.sin(time * 4) * 0.3) * height * 0.6 * volumeFactor;
        case "birds":
        case "forest":
          return (Math.sin(x * Math.PI * 8 + time * 4) * Math.random()) * height * 0.5 * volumeFactor;
        case "cafe":
        case "train":
          return (Math.sin(x * Math.PI * 4 + time) + Math.random() * 0.3) * height * 0.35 * volumeFactor;
        default:
          return Math.sin(x * Math.PI * 2 + time) * height * 0.4 * volumeFactor;
      }
    };

    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      time += 0.03;

      for (let i = 0; i < barCount; i++) {
        const barHeight = getWavePattern(i, time);
        const x = i * barWidth;
        const y = height - barHeight;

        // Create gradient
        const gradient = ctx.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, `${color}40`);
        gradient.addColorStop(1, `${color}10`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, volume, color, soundId]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 32 }}
      exit={{ opacity: 0, height: 0 }}
      className="relative w-full overflow-hidden rounded-lg"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-8"
        style={{ display: "block" }}
      />
    </motion.div>
  );
}