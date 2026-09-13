import React, { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, Wind, Flower2, Leaf, Sun, RefreshCw } from "lucide-react";

export type TreeSeason = "blossom" | "green" | "autumn" | "countdown";

interface LeafCluster {
  x: number;
  y: number;
  radius: number;
  depth: number;
  branchIdx: number;
  swayFactor: number;
  colorIdx: number;
  count: number;
}

interface FallingLeaf {
  x: number;
  y: number;
  z: number;
  size: number;
  pitch: number;
  yaw: number;
  roll: number;
  dPitch: number;
  dYaw: number;
  dRoll: number;
  vx: number;
  vy: number;
  swayPhase: number;
  swaySpeed: number;
  color: string;
  accentColor: string;
  stemColor: string;
  type: "blossom" | "green" | "autumn";
  life: number;
  maxLife: number;
  opacity: number;
}

interface BranchNode {
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  x2: number;
  y2: number;
  thickness: number;
  depth: number;
  parentIdx: number;
  swayAmount: number;
  swayOffset: number;
}

interface RealisticTreeBackgroundProps {
  daysRemaining?: number;
  className?: string;
}

export const RealisticTreeBackground: React.FC<RealisticTreeBackgroundProps> = ({
  daysRemaining = 260,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [season, setSeason] = useState<TreeSeason>(() => {
    try {
      const saved = localStorage.getItem("campus_tree_season");
      if (saved && ["blossom", "green", "autumn", "countdown"].includes(saved)) {
        return saved as TreeSeason;
      }
    } catch (e) {}
    return "blossom";
  });

  const [windActive, setWindActive] = useState(false);
  const [leafRate, setLeafRate] = useState<"gentle" | "breeze" | "flurry">("breeze");

  // Determine active visual season palette
  const activeSeason: "blossom" | "green" | "autumn" =
    season === "countdown"
      ? daysRemaining > 180
        ? "blossom"
        : daysRemaining > 90
        ? "green"
        : "autumn"
      : season;

  // Mouse interaction state for wind eddies
  const mouseRef = useRef<{ x: number; y: number; vx: number; vy: number; lastX: number; lastY: number }>({
    x: -2000,
    y: -2000,
    vx: 0,
    vy: 0,
    lastX: -2000,
    lastY: -2000,
  });

  const windBoostRef = useRef<number>(1.0);

  const handleSeasonChange = (newSeason: TreeSeason) => {
    setSeason(newSeason);
    try {
      localStorage.setItem("campus_tree_season", newSeason);
    } catch (e) {}
  };

  const triggerWindGust = useCallback(() => {
    windBoostRef.current = 3.5;
    setWindActive(true);
    setTimeout(() => {
      windBoostRef.current = 1.0;
      setWindActive(false);
    }, 2500);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    let branches: BranchNode[] = [];
    let clusters: LeafCluster[] = [];
    let fallingLeaves: FallingLeaf[] = [];

    // Color Palettes
    const palettes = {
      blossom: {
        skyGrad: ["rgba(255, 240, 245, 0.4)", "rgba(255, 228, 235, 0.15)"],
        trunk: ["#3d271d", "#5c3d2e", "#8a5d43"],
        leafColors: [
          "rgba(255, 182, 193, 0.88)", // light pink
          "rgba(255, 192, 203, 0.92)", // sakura pink
          "rgba(244, 143, 177, 0.85)", // blush
          "rgba(255, 218, 224, 0.90)", // soft petal
          "rgba(233, 30, 99, 0.75)",   // deep rose
          "rgba(255, 240, 245, 0.95)", // ivory petal
        ],
        accent: "rgba(255, 105, 180, 0.8)",
        stem: "rgba(180, 80, 100, 0.6)",
      },
      green: {
        skyGrad: ["rgba(235, 248, 240, 0.35)", "rgba(220, 245, 230, 0.12)"],
        trunk: ["#2d1e15", "#4a3325", "#6e4d38"],
        leafColors: [
          "rgba(46, 125, 50, 0.88)",  // forest green
          "rgba(67, 160, 71, 0.85)",  // fresh green
          "rgba(102, 187, 106, 0.90)", // bright leaf
          "rgba(56, 142, 60, 0.86)",  // emerald
          "rgba(129, 199, 132, 0.82)", // spring shoot
          "rgba(27, 94, 32, 0.80)",   // deep shadow green
        ],
        accent: "rgba(139, 195, 74, 0.8)",
        stem: "rgba(50, 100, 50, 0.6)",
      },
      autumn: {
        skyGrad: ["rgba(255, 245, 230, 0.4)", "rgba(255, 235, 210, 0.15)"],
        trunk: ["#3a2016", "#583222", "#7e4a33"],
        leafColors: [
          "rgba(217, 72, 15, 0.90)",  // rust orange
          "rgba(247, 103, 7, 0.88)",  // vibrant amber
          "rgba(250, 176, 5, 0.92)",  // golden yellow
          "rgba(232, 89, 12, 0.85)",  // fiery vermilion
          "rgba(180, 40, 10, 0.82)",  // crimson fall
          "rgba(212, 120, 25, 0.88)", // ochre maple
        ],
        accent: "rgba(255, 140, 0, 0.85)",
        stem: "rgba(140, 60, 20, 0.6)",
      },
    };

    // Generate Branch Structure tailored to frame content gracefully
    const buildTree = (w: number, h: number) => {
      branches = [];
      clusters = [];

      // Base trunk position: Left edge arching up and spreading across the top/mid screen
      const trunkBaseX = w * 0.08;
      const trunkBaseY = h + 20;

      // 1. Main Trunk
      const trunkMidX = w * 0.14;
      const trunkMidY = h * 0.62;
      const trunkTopX = w * 0.22;
      const trunkTopY = h * 0.38;

      branches.push({
        x1: trunkBaseX,
        y1: trunkBaseY,
        cx: trunkMidX - 20,
        cy: trunkBaseY - (trunkBaseY - trunkTopY) * 0.5,
        x2: trunkTopX,
        y2: trunkTopY,
        thickness: Math.min(38, Math.max(22, w * 0.024)),
        depth: 0,
        parentIdx: -1,
        swayAmount: 0.02,
        swayOffset: 0,
      });

      // 2. Primary Limbs branching outwards
      const primaryLimbs = [
        // Large High Canopy Canopy Arching across the Top Right
        {
          x1: trunkTopX,
          y1: trunkTopY,
          cx: w * 0.36,
          cy: h * 0.22,
          x2: w * 0.52,
          y2: h * 0.18,
          thickness: 18,
          depth: 1,
          swayAmount: 0.05,
          swayOffset: 0.8,
        },
        // Upper Left Overhead Branch
        {
          x1: trunkTopX,
          y1: trunkTopY,
          cx: w * 0.12,
          cy: h * 0.26,
          x2: w * 0.04,
          y2: h * 0.20,
          thickness: 14,
          depth: 1,
          swayAmount: 0.06,
          swayOffset: 1.5,
        },
        // Mid-Right Reaching Branch
        {
          x1: trunkTopX,
          y1: trunkTopY + 30,
          cx: w * 0.34,
          cy: h * 0.44,
          x2: w * 0.48,
          y2: h * 0.40,
          thickness: 13,
          depth: 1,
          swayAmount: 0.07,
          swayOffset: 2.1,
        },
        // Low Left Background Branch
        {
          x1: trunkMidX,
          y1: trunkMidY + 20,
          cx: w * 0.05,
          cy: h * 0.54,
          x2: w * 0.01,
          y2: h * 0.50,
          thickness: 12,
          depth: 1,
          swayAmount: 0.04,
          swayOffset: 0.4,
        },
      ];

      primaryLimbs.forEach((limb, idx) => {
        const pIdx = branches.length;
        branches.push({
          ...limb,
          parentIdx: 0,
        });

        // 3. Secondary Twigs and Shoots
        const subCount = idx === 0 ? 5 : 3;
        for (let s = 0; s < subCount; s++) {
          const t = (s + 1) / (subCount + 1);
          const startX = limb.x1 + (limb.x2 - limb.x1) * t;
          const startY = limb.y1 + (limb.y2 - limb.y1) * t;

          const angle = (idx % 2 === 0 ? -0.4 : 0.4) + (Math.random() - 0.5) * 0.6;
          const length = (w * 0.08) + Math.random() * (w * 0.07);
          const endX = startX + Math.cos(angle) * length;
          const endY = startY + Math.sin(angle) * length - 15;

          const bIdx = branches.length;
          branches.push({
            x1: startX,
            y1: startY,
            cx: (startX + endX) / 2 + (Math.random() - 0.5) * 20,
            cy: (startY + endY) / 2 - 10,
            x2: endX,
            y2: endY,
            thickness: Math.max(3, limb.thickness * 0.45),
            depth: 2,
            parentIdx: pIdx,
            swayAmount: 0.12 + Math.random() * 0.08,
            swayOffset: Math.random() * Math.PI * 2,
          });

          // Leaf Clusters at twig ends and junctions
          clusters.push({
            x: endX,
            y: endY,
            radius: 35 + Math.random() * 30,
            depth: 2,
            branchIdx: bIdx,
            swayFactor: 1.2,
            colorIdx: Math.floor(Math.random() * 6),
            count: 24 + Math.floor(Math.random() * 18),
          });

          // Mid-twig cluster
          if (Math.random() > 0.4) {
            clusters.push({
              x: (startX + endX) / 2,
              y: (startY + endY) / 2,
              radius: 25 + Math.random() * 20,
              depth: 1,
              branchIdx: bIdx,
              swayFactor: 0.8,
              colorIdx: Math.floor(Math.random() * 6),
              count: 14 + Math.floor(Math.random() * 10),
            });
          }
        }
      });
    };

    const handleResize = () => {
      if (!canvas) return;
      dpr = window.devicePixelRatio || 1;
      width = canvas.width = window.innerWidth * dpr;
      height = canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      buildTree(window.innerWidth, window.innerHeight);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const m = mouseRef.current;
      m.vx = (e.clientX - m.lastX) * 0.25;
      m.vy = (e.clientY - m.lastY) * 0.25;
      m.lastX = e.clientX;
      m.lastY = e.clientY;
      m.x = e.clientX;
      m.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Spawn falling leaf / petal
    const spawnLeaf = (fromCluster?: LeafCluster) => {
      const p = palettes[activeSeason];
      let originX = 0;
      let originY = 0;

      if (fromCluster && Math.random() > 0.3) {
        originX = fromCluster.x + (Math.random() - 0.5) * fromCluster.radius;
        originY = fromCluster.y + (Math.random() - 0.5) * fromCluster.radius;
      } else if (clusters.length > 0 && Math.random() > 0.2) {
        const randCluster = clusters[Math.floor(Math.random() * clusters.length)];
        originX = randCluster.x + (Math.random() - 0.5) * randCluster.radius;
        originY = randCluster.y + (Math.random() - 0.5) * randCluster.radius;
      } else {
        originX = Math.random() * window.innerWidth * 0.7;
        originY = -10 + Math.random() * (window.innerHeight * 0.4);
      }

      const colorIdx = Math.floor(Math.random() * p.leafColors.length);

      fallingLeaves.push({
        x: originX,
        y: originY,
        z: 50 + Math.random() * 350,
        size: activeSeason === "blossom" ? 8 + Math.random() * 7 : 10 + Math.random() * 9,
        pitch: Math.random() * Math.PI * 2,
        yaw: Math.random() * Math.PI * 2,
        roll: Math.random() * Math.PI * 2,
        dPitch: (Math.random() - 0.5) * 0.05,
        dYaw: (Math.random() - 0.5) * 0.08,
        dRoll: (Math.random() - 0.5) * 0.04,
        vx: 0.8 + Math.random() * 1.5,
        vy: 0.6 + Math.random() * 1.2,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.02 + Math.random() * 0.03,
        color: p.leafColors[colorIdx],
        accentColor: p.accent,
        stemColor: p.stem,
        type: activeSeason,
        life: 0,
        maxLife: 600 + Math.random() * 400,
        opacity: 0.85 + Math.random() * 0.15,
      });
    };

    // Initialize initial flurry
    for (let i = 0; i < 35; i++) {
      spawnLeaf();
      if (fallingLeaves.length > 0) {
        fallingLeaves[fallingLeaves.length - 1].y = Math.random() * window.innerHeight;
      }
    }

    let time = 0;

    // Render loop
    const render = () => {
      time += 0.02;
      const curW = window.innerWidth;
      const curH = window.innerHeight;

      ctx.clearRect(0, 0, curW, curH);

      const p = palettes[activeSeason];

      // Subtle atmospheric ambient gradient behind tree
      const bgGrad = ctx.createLinearGradient(0, 0, curW, curH);
      bgGrad.addColorStop(0, p.skyGrad[0]);
      bgGrad.addColorStop(1, p.skyGrad[1]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, curW, curH);

      // Mouse speed dampening
      const m = mouseRef.current;
      m.vx *= 0.92;
      m.vy *= 0.92;

      const wind = (Math.sin(time * 0.5) * 0.6 + 0.8) * windBoostRef.current;

      // 1. Draw Tree Branches with realistic organic curves
      branches.forEach((b) => {
        ctx.save();
        const sway = Math.sin(time + b.swayOffset) * b.swayAmount * 15 * windBoostRef.current;

        const startX = b.x1;
        const startY = b.y1;
        const endX = b.x2 + sway;
        const endY = b.y2 + sway * 0.3;
        const ctrlX = b.cx + sway * 0.5;
        const ctrlY = b.cy;

        // Bark gradient
        const branchGrad = ctx.createLinearGradient(startX, startY, endX, endY);
        branchGrad.addColorStop(0, p.trunk[0]);
        branchGrad.addColorStop(0.5, p.trunk[1]);
        branchGrad.addColorStop(1, p.trunk[2]);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.strokeStyle = branchGrad;
        ctx.lineWidth = b.thickness;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
        ctx.shadowBlur = b.thickness * 0.4;
        ctx.stroke();

        // Inner bark texture lines
        if (b.thickness > 8) {
          ctx.beginPath();
          ctx.moveTo(startX + 2, startY - 2);
          ctx.quadraticCurveTo(ctrlX, ctrlY - 2, endX, endY - 1);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = b.thickness * 0.25;
          ctx.stroke();
        }

        ctx.restore();
      });

      // 2. Draw Leaf & Blossom Canopy Clusters
      clusters.forEach((c) => {
        const b = branches[c.branchIdx] || branches[0];
        const sway = Math.sin(time + b.swayOffset) * b.swayAmount * 15 * windBoostRef.current * c.swayFactor;
        const cx = c.x + sway;
        const cy = c.y + sway * 0.3;

        ctx.save();
        ctx.translate(cx, cy);

        // Render leaf cluster petals with depth
        for (let i = 0; i < c.count; i++) {
          const angle = (i / c.count) * Math.PI * 2 + (i * 0.3);
          const dist = (Math.sin(i * 99) * 0.5 + 0.5) * c.radius;
          const lx = Math.cos(angle) * dist;
          const ly = Math.sin(angle) * dist * 0.75;
          const leafSize = 6 + (i % 5) * 2;
          const leafRot = angle + Math.sin(time * 0.8 + i) * 0.2;

          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(leafRot);

          const leafCol = p.leafColors[(c.colorIdx + i) % p.leafColors.length];

          if (activeSeason === "blossom") {
            // Cherry Blossom Petal (Notched heart-like petal)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-leafSize * 0.6, -leafSize * 0.5, -leafSize * 0.5, -leafSize * 1.2, 0, -leafSize * 1.1);
            ctx.bezierCurveTo(leafSize * 0.5, -leafSize * 1.2, leafSize * 0.6, -leafSize * 0.5, 0, 0);
            ctx.fillStyle = leafCol;
            ctx.fill();

            // Petal Center pistil highlight
            if (i % 4 === 0) {
              ctx.beginPath();
              ctx.arc(0, -leafSize * 0.2, leafSize * 0.15, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(255, 105, 180, 0.7)";
              ctx.fill();
            }
          } else {
            // Realistic Leaf Shape (oval with sharp tip & center rib)
            ctx.beginPath();
            ctx.moveTo(0, leafSize * 0.3);
            ctx.quadraticCurveTo(-leafSize * 0.5, 0, 0, -leafSize * 1.2);
            ctx.quadraticCurveTo(leafSize * 0.5, 0, 0, leafSize * 0.3);
            ctx.fillStyle = leafCol;
            ctx.fill();

            // Center vein
            ctx.beginPath();
            ctx.moveTo(0, leafSize * 0.2);
            ctx.lineTo(0, -leafSize * 1.0);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }

          ctx.restore();
        }

        ctx.restore();

        // Chance to detach leaf when wind or time passes
        const detachThreshold =
          (activeSeason === "autumn" ? 0.015 : activeSeason === "blossom" ? 0.01 : 0.006) *
          windBoostRef.current;
        if (Math.random() < detachThreshold) {
          spawnLeaf(c);
        }
      });

      // 3. Update and Render Detached Falling Leaves Particle Physics
      const maxParticles = leafRate === "flurry" ? 85 : leafRate === "breeze" ? 55 : 30;

      if (fallingLeaves.length < maxParticles && Math.random() < 0.25 * windBoostRef.current) {
        spawnLeaf();
      }

      for (let i = fallingLeaves.length - 1; i >= 0; i--) {
        const leaf = fallingLeaves[i];
        leaf.life++;

        // Rotations in 3D space
        leaf.pitch += leaf.dPitch * wind;
        leaf.yaw += leaf.dYaw * wind;
        leaf.roll += leaf.dRoll * wind;
        leaf.swayPhase += leaf.swaySpeed;

        // Aerodynamic horizontal sway and drift
        const swayDrift = Math.sin(leaf.swayPhase) * (1.2 + leaf.size * 0.1);
        const mouseDistX = leaf.x - m.x;
        const mouseDistY = leaf.y - m.y;
        const mouseDist = Math.sqrt(mouseDistX * mouseDistX + mouseDistY * mouseDistY);

        let mousePushX = 0;
        let mousePushY = 0;
        if (mouseDist < 120 && mouseDist > 0) {
          const force = (1 - mouseDist / 120) * 4;
          mousePushX = (mouseDistX / mouseDist) * force + m.vx * 0.2;
          mousePushY = (mouseDistY / mouseDist) * force + m.vy * 0.2;
        }

        leaf.x += leaf.vx * wind + swayDrift + mousePushX;
        leaf.y += leaf.vy + Math.cos(leaf.pitch) * 0.4 + mousePushY;

        // Depth perspective scale
        const scale = 300 / (300 + leaf.z);
        const drawSize = leaf.size * scale;
        const aspectYaw = Math.cos(leaf.yaw); // 3D flip effect

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.roll);
        ctx.scale(aspectYaw, 1);

        ctx.globalAlpha = leaf.opacity * Math.min(1, (leaf.maxLife - leaf.life) / 60);

        if (leaf.type === "blossom") {
          // Petal 3D render
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-drawSize * 0.6, -drawSize * 0.5, -drawSize * 0.5, -drawSize * 1.2, 0, -drawSize * 1.1);
          ctx.bezierCurveTo(drawSize * 0.5, -drawSize * 1.2, drawSize * 0.6, -drawSize * 0.5, 0, 0);
          ctx.fillStyle = leaf.color;
          ctx.fill();

          // Petal edge shade
          ctx.strokeStyle = leaf.accentColor;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        } else {
          // Leaf 3D render with center vein
          ctx.beginPath();
          ctx.moveTo(0, drawSize * 0.4);
          ctx.quadraticCurveTo(-drawSize * 0.5, 0, 0, -drawSize * 1.2);
          ctx.quadraticCurveTo(drawSize * 0.5, 0, 0, drawSize * 0.4);
          ctx.fillStyle = leaf.color;
          ctx.fill();

          // Stem
          ctx.beginPath();
          ctx.moveTo(0, drawSize * 0.4);
          ctx.lineTo(0, drawSize * 0.65);
          ctx.strokeStyle = leaf.stemColor;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Vein
          ctx.beginPath();
          ctx.moveTo(0, drawSize * 0.3);
          ctx.lineTo(0, -drawSize * 1.0);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }

        ctx.restore();

        // Remove leaves that fall off screen or expire
        if (leaf.y > curH + 40 || leaf.x > curW + 60 || leaf.life > leaf.maxLife) {
          fallingLeaves.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [activeSeason, leafRate]);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* HTML5 Canvas Tree & Foliage Backdrop */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Atmospheric Season Switcher Floating Widget */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/85 backdrop-blur-md border border-[#1a2a40]/15 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-[#1a2a40] uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span className="hidden sm:inline">Tree Atmosphere:</span>
        </div>

        {/* 1. Blossom */}
        <button
          onClick={() => handleSeasonChange("blossom")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            season === "blossom"
              ? "bg-pink-100 text-pink-800 border border-pink-300 font-semibold shadow-2xs"
              : "text-[#4a5e7a] hover:bg-pink-50/70"
          }`}
          title="Spring Cherry Blossom / Sakura"
        >
          <Flower2 className="w-3.5 h-3.5 text-pink-500" />
          <span>Blossom</span>
        </button>

        {/* 2. Green */}
        <button
          onClick={() => handleSeasonChange("green")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            season === "green"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold shadow-2xs"
              : "text-[#4a5e7a] hover:bg-emerald-50/70"
          }`}
          title="Lush Summer Green Canopy"
        >
          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          <span>Green</span>
        </button>

        {/* 3. Autumn */}
        <button
          onClick={() => handleSeasonChange("autumn")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            season === "autumn"
              ? "bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-2xs"
              : "text-[#4a5e7a] hover:bg-amber-50/70"
          }`}
          title="Autumn Golden Foliage"
        >
          <Sun className="w-3.5 h-3.5 text-amber-600" />
          <span>Autumn</span>
        </button>

        {/* 4. Sync with 260 Days Countdown */}
        <button
          onClick={() => handleSeasonChange("countdown")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            season === "countdown"
              ? "bg-[#003d80] text-white font-semibold shadow-2xs"
              : "text-[#4a5e7a] hover:bg-[#003d80]/10"
          }`}
          title={`Sync Season with 260 Days Countdown (${activeSeason.toUpperCase()})`}
        >
          <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: "8s" }} />
          <span className="hidden md:inline">260d Cycle</span>
        </button>

        {/* Wind Gust Trigger */}
        <button
          onClick={triggerWindGust}
          className={`p-1.5 rounded-xl text-xs transition-all cursor-pointer ml-1 border ${
            windActive
              ? "bg-sky-500 text-white border-sky-600 animate-pulse"
              : "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200"
          }`}
          title="Trigger a breeze & watch leaves flutter"
        >
          <Wind className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
