import { useMemo } from "react";

interface DottedVignetteBackgroundProps {
  /** Dot color — defaults to primary indigo */
  dotColor?: string;
  /** Dot radius in px (default 1.5) */
  dotSize?: number;
  /** Spacing between dots in px (default 24) */
  dotSpacing?: number;
  /** Dot opacity (default 0.18) */
  dotOpacity?: number;
  /** Vignette intensity — higher = darker edges (default 0.5) */
  vignetteIntensity?: number;
  /** Inner glow intensity at center (default 0.15) */
  glowIntensity?: number;
  /** Glow color — defaults to primary */
  glowColor?: string;
  /** Background base color (default matches slate-50) */
  baseColor?: string;
  className?: string;
}

export default function DottedVignetteBackground({
  dotColor = "#6366f1",
  dotSize = 1.5,
  dotSpacing = 24,
  dotOpacity = 0.18,
  vignetteIntensity = 0.5,
  glowIntensity = 0.15,
  glowColor = "#6366f1",
  baseColor = "#f8fafc",
  className = "",
}: DottedVignetteBackgroundProps) {
  const bgStyle = useMemo(() => {
    // Dot pattern via repeating radial-gradient
    const dotPattern = `radial-gradient(circle at center, ${dotColor} ${dotSize}px, transparent ${dotSize + 0.5}px)`;

    // Vignette overlay (darker at edges)
    const vignette = `radial-gradient(ellipse 60% 50% at 50% 40%, transparent 30%, ${baseColor} ${70 + vignetteIntensity * 40}%)`;

    // Inner glow at center
    const glow = `radial-gradient(ellipse 50% 30% at 50% 40%, ${glowColor}${Math.round(glowIntensity * 100).toString(16).padStart(2, "0")} 0%, transparent 60%)`;

    return {
      backgroundImage: [glow, dotPattern, vignette].join(", "),
      backgroundSize: `100% 100%, ${dotSpacing}px ${dotSpacing}px, 100% 100%`,
      backgroundPosition: "center",
      backgroundColor: baseColor,
    };
  }, [dotColor, dotSize, dotSpacing, dotOpacity, vignetteIntensity, glowIntensity, glowColor, baseColor]);

  return (
    <div
      className={`fixed inset-0 -z-10 pointer-events-none ${className}`}
      style={bgStyle}
      aria-hidden="true"
    />
  );
}
