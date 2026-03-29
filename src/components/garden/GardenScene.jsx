import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

// Animated SVG leaf/plant elements that react to active sounds
function FloatingLeaf({ delay = 0, x = 50, size = 24, color = "#4ade80", duration = 12 }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ left: `${x}%`, bottom: "-10%", fontSize: size }}
      animate={{
        y: [0, -window.innerHeight - 100],
        x: [0, Math.sin(delay) * 60, Math.cos(delay) * 40, 0],
        rotate: [0, 180, 360],
        opacity: [0, 0.7, 0.7, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      🍃
    </motion.div>
  );
}

function Firefly({ delay = 0, x = 50, y = 50 }) {
  return (
    <motion.div
      className="absolute pointer-events-none rounded-full"
      style={{ left: `${x}%`, top: `${y}%`, width: 4, height: 4, background: "#fde047" }}
      animate={{
        opacity: [0, 1, 0],
        x: [0, Math.random() * 40 - 20],
        y: [0, Math.random() * 40 - 20],
        scale: [0.5, 1.5, 0.5],
      }}
      transition={{
        duration: 2 + Math.random() * 3,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function RainDrop({ delay = 0, x = 50 }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: "-5%", width: 1, background: "rgba(147,197,253,0.5)", borderRadius: 2 }}
      animate={{
        y: ["0vh", "110vh"],
        height: [8, 16],
        opacity: [0.6, 0],
      }}
      transition={{
        duration: 0.8 + Math.random() * 0.4,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

function SmokeParticle({ delay = 0, x = 50 }) {
  const drift = (Math.random() - 0.5) * 80;
  return (
    <motion.div
      className="absolute pointer-events-none rounded-full"
      style={{
        left: `${x}%`,
        bottom: "15%",
        width: 18 + Math.random() * 20,
        height: 18 + Math.random() * 20,
        background: "radial-gradient(circle, rgba(200,200,200,0.18) 0%, transparent 70%)",
        filter: "blur(6px)",
      }}
      animate={{
        y: [0, -180 - Math.random() * 120],
        x: [0, drift],
        opacity: [0, 0.55, 0.3, 0],
        scale: [0.5, 1.8, 2.5, 3],
      }}
      transition={{
        duration: 4 + Math.random() * 3,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

function WaterRipple({ x = 50, y = 80 }) {
  return (
    <motion.div
      className="absolute pointer-events-none rounded-full border border-cyan-400/30"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
      animate={{
        width: [0, 60],
        height: [0, 60],
        opacity: [0.6, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeOut",
        delay: Math.random() * 2,
      }}
    />
  );
}

export default function GardenScene({ activeSounds }) {
  const hasRain = activeSounds.some(s => s.id === "rain");
  const hasForest = activeSounds.some(s => s.id === "forest");
  const hasStream = activeSounds.some(s => s.id === "stream");
  const hasNight = activeSounds.some(s => s.id === "night");
  const hasBirds = activeSounds.some(s => s.id === "birds");
  const hasOcean = activeSounds.some(s => s.id === "ocean");
  const hasFire = activeSounds.some(s => s.id === "fire");
  const isActive = activeSounds.length > 0;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Base garden gradient */}
      <div
        className="absolute inset-0 transition-all duration-3000"
        style={{
          background: isActive
            ? "radial-gradient(ellipse at 20% 80%, rgba(21,128,61,0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(6,78,59,0.15) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(20,83,45,0.3) 0%, transparent 40%)"
            : "transparent",
        }}
      />

      {/* Ground flora silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-around opacity-20">
        {["🌿", "🌱", "🍀", "🌿", "🌾", "🌱", "🍀", "🌿", "🌾", "🌱"].map((emoji, i) => (
          <motion.span
            key={i}
            className="text-2xl sm:text-4xl select-none"
            animate={isActive ? {
              y: [0, -3, 0],
              rotate: [0, i % 2 === 0 ? 5 : -5, 0],
            } : {}}
            transition={{
              duration: 3 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      {/* Rain effect */}
      {hasRain && Array.from({ length: 30 }).map((_, i) => (
        <RainDrop key={i} delay={i * 0.07} x={Math.random() * 100} />
      ))}

      {/* Stream ripples */}
      {hasStream && Array.from({ length: 5 }).map((_, i) => (
        <WaterRipple key={i} x={30 + i * 10} y={70 + (i % 3) * 5} />
      ))}

      {/* Ocean ripples */}
      {hasOcean && Array.from({ length: 8 }).map((_, i) => (
        <WaterRipple key={i} x={10 + i * 11} y={75} />
      ))}

      {/* Floating leaves for forest/birds */}
      {(hasForest || hasBirds) && Array.from({ length: 8 }).map((_, i) => (
        <FloatingLeaf
          key={i}
          delay={i * 1.5}
          x={5 + i * 12}
          size={16 + (i % 3) * 8}
          duration={10 + i * 1.2}
        />
      ))}

      {/* Fireflies for night sounds */}
      {hasNight && Array.from({ length: 15 }).map((_, i) => (
        <Firefly
          key={i}
          delay={i * 0.4}
          x={10 + Math.random() * 80}
          y={10 + Math.random() * 70}
        />
      ))}

      {/* Campfire smoke */}
      {hasFire && Array.from({ length: 14 }).map((_, i) => (
        <SmokeParticle key={i} delay={i * 0.35} x={44 + (i % 5) * 3} />
      ))}

      {/* Ambient pollen/spores when active */}
      {isActive && Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3,
            height: 3,
            background: "rgba(134,239,172,0.4)",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.sin(i) * 20, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}