import { useEffect, useRef } from "react";

/**
 * Subtle dark orbital background inspired by the Radial Orbital Timeline aesthetic.
 * Features: animated concentric orbital rings, central gradient glow, ambient particles.
 * Pure CSS + minimal JS — zero dependencies beyond React.
 */
export default function OrbitalBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Subtle rotation animation for orbital rings via CSS custom property
    let angle = 0;
    let id: number;
    const tick = () => {
      angle = (angle + 0.015) % 360;
      container.style.setProperty("--orbit-angle", `${angle}deg`);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-black"
      aria-hidden="true"
      style={{ "--orbit-angle": "0deg" } as React.CSSProperties}
    >
      {/* Central gradient glow — purple → blue → teal */}
      <div
        className="absolute top-1/2 left-[calc(50%-240px)] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(59,130,246,0.25) 35%, rgba(20,184,166,0.1) 60%, transparent 80%)",
        }}
      />

      {/* Secondary glow — top-right accent */}
      <div
        className="absolute top-[15%] right-[10%] w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)",
        }}
      />

      {/* Orbital ring 1 — large */}
      <div
        className="absolute top-1/2 left-[calc(50%-240px)] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/[0.04]"
        style={{ transform: `translate(-50%, -50%) rotate(var(--orbit-angle))` }}
      />

      {/* Orbital ring 2 — medium, counter-rotating */}
      <div
        className="absolute top-1/2 left-[calc(50%-240px)] -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full border border-white/[0.05]"
        style={{ transform: `translate(-50%, -50%) rotate(calc(var(--orbit-angle) * -0.7))` }}
      />

      {/* Orbital ring 3 — small accent ring */}
      <div
        className="absolute top-1/2 left-[calc(50%-120px)] -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full border border-white/[0.06]"
        style={{ transform: `translate(-50%, -50%) rotate(calc(var(--orbit-angle) * 1.3))` }}
      />

      {/* Subtle dot grid overlay for texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(255,255,255) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}
