import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Wind, Eye, EyeOff } from "lucide-react";

interface Petal3D {
  x: number;
  y: number;
  z: number; // depth (0 to 600)
  size: number;
  pitch: number; // 3D X rotation
  yaw: number; // 3D Y rotation
  roll: number; // 3D Z rotation
  dPitch: number;
  dYaw: number;
  dRoll: number;
  vx: number;
  vy: number;
  vz: number;
  swayFreq: number;
  swayPhase: number;
  colorType: number; // variant 0: sakura pink, 1: blush rose, 2: peach blossom, 3: cream petal
  curl: number; // petal curvature factor
}

export const FallingPetals3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [density, setDensity] = useState<"gentle" | "breeze" | "shower">("breeze");
  const [showControls, setShowControls] = useState(false);

  // Mouse interaction state
  const mouseRef = useRef<{ x: number; y: number; vx: number; vy: number; lastX: number; lastY: number }>({
    x: -1000,
    y: -1000,
    vx: 0,
    vy: 0,
    lastX: -1000,
    lastY: -1000,
  });

  const countByDensity = {
    gentle: 30,
    breeze: 55,
    shower: 95,
  };

  useEffect(() => {
    if (!isEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const m = mouseRef.current;
      m.vx = (e.clientX - m.lastX) * 0.3;
      m.vy = (e.clientY - m.lastY) * 0.3;
      m.lastX = e.clientX;
      m.lastY = e.clientY;
      m.x = e.clientX;
      m.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Color palettes for authentic Ghibli / spring campus cherry blossoms
    const petalPalettes = [
      {
        frontTop: "rgba(255, 192, 203, 0.92)",
        frontMid: "rgba(244, 143, 177, 0.85)",
        frontBase: "rgba(216, 27, 96, 0.8)",
        backTop: "rgba(255, 218, 224, 0.9)",
        backMid: "rgba(248, 187, 208, 0.82)",
        backBase: "rgba(233, 30, 99, 0.75)",
        shadow: "rgba(180, 50, 90, 0.25)",
      },
      {
        frontTop: "rgba(255, 228, 225, 0.95)",
        frontMid: "rgba(255, 182, 193, 0.88)",
        frontBase: "rgba(220, 100, 130, 0.82)",
        backTop: "rgba(255, 240, 245, 0.92)",
        backMid: "rgba(255, 192, 203, 0.85)",
        backBase: "rgba(199, 21, 133, 0.75)",
        shadow: "rgba(150, 40, 80, 0.2)",
      },
      {
        frontTop: "rgba(255, 218, 185, 0.92)",
        frontMid: "rgba(255, 160, 160, 0.85)",
        frontBase: "rgba(230, 80, 100, 0.8)",
        backTop: "rgba(255, 230, 200, 0.9)",
        backMid: "rgba(250, 175, 175, 0.82)",
        backBase: "rgba(210, 70, 90, 0.75)",
        shadow: "rgba(170, 60, 60, 0.2)",
      },
      {
        frontTop: "rgba(255, 245, 245, 0.96)",
        frontMid: "rgba(255, 205, 215, 0.88)",
        frontBase: "rgba(235, 120, 150, 0.82)",
        backTop: "rgba(255, 250, 250, 0.92)",
        backMid: "rgba(255, 215, 225, 0.85)",
        backBase: "rgba(215, 100, 130, 0.78)",
        shadow: "rgba(160, 70, 100, 0.2)",
      },
    ];

    const targetCount = countByDensity[density];
    const petals: Petal3D[] = [];

    const createPetal = (spawnAtTop = false): Petal3D => ({
      x: Math.random() * (width + 300) - 150,
      y: spawnAtTop ? -30 - Math.random() * 50 : Math.random() * (height + 50),
      z: Math.random() * 500, // 0 = foreground (large, fast), 500 = background (small, subtle)
      size: 14 + Math.random() * 12,
      pitch: Math.random() * Math.PI * 2,
      yaw: Math.random() * Math.PI * 2,
      roll: Math.random() * Math.PI * 2,
      dPitch: (Math.random() - 0.5) * 0.04,
      dYaw: (Math.random() - 0.5) * 0.05,
      dRoll: (Math.random() - 0.5) * 0.03,
      vx: 0.6 + Math.random() * 1.2, // general gentle breeze rightward
      vy: 1.1 + Math.random() * 1.4, // gravity
      vz: (Math.random() - 0.5) * 0.4,
      swayFreq: 0.0015 + Math.random() * 0.002,
      swayPhase: Math.random() * Math.PI * 2,
      colorType: Math.floor(Math.random() * petalPalettes.length),
      curl: 0.15 + Math.random() * 0.25,
    });

    for (let i = 0; i < targetCount; i++) {
      petals.push(createPetal(false));
    }

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.666, 2.5); // normalized frame delta
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Dampen mouse velocity
      const m = mouseRef.current;
      m.vx *= 0.92;
      m.vy *= 0.92;

      // Sort by depth (z-index) so background petals render first
      petals.sort((a, b) => b.z - a.z);

      const focalLength = 350;

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];

        // 3D Perspective scale
        const scale = focalLength / (focalLength + p.z);

        // Sinusoidal swaying / wind turbulence
        const sway = Math.sin(now * p.swayFreq + p.swayPhase);
        const windGust = Math.sin(now * 0.0007) * 0.8 + 0.5;

        // Interaction with mouse gust
        const dx = p.x - m.x;
        const dy = p.y - m.y;
        const distSq = dx * dx + dy * dy;
        const radius = 180;
        if (distSq < radius * radius && distSq > 1) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / radius) * 3;
          p.x += (dx / dist) * force + m.vx * 0.2;
          p.y += (dy / dist) * force + m.vy * 0.2;
          p.dPitch += 0.02 * force;
          p.dYaw += 0.03 * force;
        }

        // Update physics
        p.x += (p.vx + windGust + sway * 0.8) * scale * dt;
        p.y += (p.vy + Math.abs(sway) * 0.4) * scale * dt;
        p.z += p.vz * dt;

        // Keep z in range
        if (p.z < 20) p.vz = Math.abs(p.vz);
        if (p.z > 550) p.vz = -Math.abs(p.vz);

        // Update 3D Euler angles
        p.pitch += p.dPitch * dt;
        p.yaw += p.dYaw * dt;
        p.roll += p.dRoll * dt;

        // Respawn when offscreen
        if (p.y > height + 40 || p.x > width + 100 || p.x < -150) {
          petals[i] = createPetal(true);
          continue;
        }

        // 3D Petal Projection Matrix Simulation
        // Pitch (X) and Yaw (Y) project the 3D surface onto the 2D canvas
        const cosPitch = Math.cos(p.pitch);
        const cosYaw = Math.cos(p.yaw);
        const isFacingFront = cosPitch * cosYaw >= 0;

        const palette = petalPalettes[p.colorType];
        const colors = isFacingFront
          ? { top: palette.frontTop, mid: palette.frontMid, base: palette.frontBase }
          : { top: palette.backTop, mid: palette.backMid, base: palette.backBase };

        // Scale factors along projected 3D axes
        const scaleX = Math.abs(cosYaw) * scale;
        const scaleY = Math.abs(cosPitch) * scale;
        const actualWidth = Math.max(p.size * 0.85 * scaleX, 1.5);
        const actualHeight = Math.max(p.size * 1.35 * scaleY, 2.5);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.roll);

        // Soft 3D drop-shadow for petals closer to the screen
        if (p.z < 280) {
          ctx.shadowColor = palette.shadow;
          ctx.shadowBlur = (300 - p.z) * 0.025;
          ctx.shadowOffsetX = 2 * scale;
          ctx.shadowOffsetY = 4 * scale;
        }

        // Draw organic curved sakura / flower petal
        ctx.beginPath();
        const halfW = actualWidth / 2;
        const h = actualHeight;

        // Base of petal (stem attachment point)
        ctx.moveTo(0, 0);

        // Left curve
        ctx.bezierCurveTo(
          -halfW * 1.2,
          -h * 0.35,
          -halfW * (1.1 + p.curl),
          -h * 0.85,
          -halfW * 0.3,
          -h
        );

        // Top notch / gentle double-lobed sakura tip
        ctx.quadraticCurveTo(0, -h * 0.93, halfW * 0.3, -h);

        // Right curve
        ctx.bezierCurveTo(
          halfW * (1.1 + p.curl),
          -h * 0.85,
          halfW * 1.2,
          -h * 0.35,
          0,
          0
        );

        ctx.closePath();

        // 3D Gradient shading across the petal surface
        const grad = ctx.createLinearGradient(0, 0, 0, -h);
        grad.addColorStop(0, colors.base);
        grad.addColorStop(0.55, colors.mid);
        grad.addColorStop(1, colors.top);

        ctx.fillStyle = grad;
        ctx.fill();

        // Delicate central petal vein for high-fidelity realism
        if (p.z < 350) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(halfW * 0.15, -h * 0.5, 0, -h * 0.82);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = Math.max(0.6 * scale, 0.3);
          ctx.stroke();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isEnabled, density]);

  return (
    <>
      {/* 3D Canvas Layer across all pages */}
      {isEnabled && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-30 w-full h-full"
          style={{ willChange: "transform" }}
        />
      )}

      {/* Floating Petals Ambience Control Bar (bottom-right) */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 select-none">
        {showControls && (
          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#1a2a40]/15 shadow-xl space-y-3 text-xs w-64 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between border-b border-[#1a2a40]/10 pb-2">
              <div className="flex items-center gap-1.5 font-semibold text-[#003d80]">
                <Sparkles className="w-3.5 h-3.5 text-[#0056b3]" />
                <span>3D Falling Petals</span>
              </div>
              <button
                onClick={() => setIsEnabled(!isEnabled)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                  isEnabled
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {isEnabled ? "Active" : "Off"}
              </button>
            </div>

            {/* Density Selector */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#7a8fa8] tracking-wider block">
                Breeze Intensity
              </span>
              <div className="grid grid-cols-3 gap-1">
                {(["gentle", "breeze", "shower"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDensity(mode)}
                    className={`py-1 rounded-md text-[11px] font-medium capitalize transition-all cursor-pointer ${
                      density === mode
                        ? "bg-[#003d80] text-white shadow-2xs"
                        : "bg-[#f0f4f8] text-[#4a5e7a] hover:bg-black/5"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-[#7a8fa8] leading-tight">
              🌸 3D physics with perspective depth, wind turbulence, and interactive cursor swirls across all pages.
            </p>
          </div>
        )}

        <button
          onClick={() => setShowControls(!showControls)}
          title="3D Falling Petals Settings"
          className="p-2.5 bg-white/90 hover:bg-white text-[#003d80] rounded-full shadow-lg border border-[#1a2a40]/15 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <span className="text-base leading-none">🌸</span>
          <span className="hidden sm:inline">3D Petals</span>
          <Wind className="w-3.5 h-3.5 opacity-70" />
        </button>
      </div>
    </>
  );
};
