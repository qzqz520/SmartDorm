import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const camera = new THREE.Camera();
    camera.position.z = 1;
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
    };

    const vertexShader = `void main() { gl_Position = vec4(position, 1.0); }`;

    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float dist = length(uv);
        float angle = atan(uv.y, uv.x);
        float t = time * 0.03;
        float rings = sin(dist * 12.0 - t * 3.0) * 0.5 + 0.5;
        rings += sin(dist * 8.0 + t * 2.0) * 0.3;
        rings += sin(dist * 20.0 - t * 4.0) * 0.2;
        float spiral = sin(angle * 3.0 + dist * 10.0 - t * 2.0) * 0.5 + 0.5;
        float glow = exp(-dist * 1.5) * 0.8;
        float intensity = rings * 0.5 + spiral * 0.3 + glow;
        vec3 inner = vec3(0.8, 0.75, 1.0);
        vec3 mid   = vec3(0.4, 0.3, 1.0);
        vec3 outer = vec3(0.1, 0.15, 0.6);
        float mx = smoothstep(0.0, 1.2, dist);
        vec3 col = mix(inner, mid, mx);
        col = mix(col, outer, smoothstep(0.6, 1.8, dist));
        vec3 final = col * (0.15 + intensity * 1.2);
        final += inner * glow * 0.3 * (sin(t * 1.5) * 0.3 + 0.7);
        gl_FragColor = vec4(final, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    scene.add(new THREE.Mesh(geometry, material));

    function resize() {
      const w = canvas!.clientWidth || window.innerWidth / 2;
      const h = canvas!.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      uniforms.resolution.value.x = renderer.domElement.width;
      uniforms.resolution.value.y = renderer.domElement.height;
    }
    window.addEventListener("resize", resize);
    resize();

    let id: number;
    (function loop() {
      id = requestAnimationFrame(loop);
      uniforms.time.value += 0.05;
      renderer.render(scene, camera);
    })();

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed right-0 top-0 bottom-0 w-1/2 z-0 max-md:hidden"
    />
  );
}
