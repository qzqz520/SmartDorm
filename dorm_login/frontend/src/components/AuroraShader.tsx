import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function AuroraShader() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    container.appendChild(renderer.domElement);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2() }
      },
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float iTime;
        uniform vec2 iResolution;
        #define NUM_OCTAVES 3

        float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 ip = floor(p); vec2 u = fract(p); u = u*u*(3.0-2.0*u);
          return mix(mix(rand(ip), rand(ip+vec2(1,0)), u.x), mix(rand(ip+vec2(0,1)), rand(ip+vec2(1,1)), u.x), u.y) * 0.5 + 0.3;
        }
        float fbm(vec2 x) {
          float v = 0.0, a = 0.3;
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
          for (int i = 0; i < NUM_OCTAVES; ++i) { v += a*noise(x); x = rot*x*2.0+vec2(100); a*=0.4; }
          return v;
        }

        void main() {
          vec2 shake = vec2(sin(iTime*1.2)*0.005, cos(iTime*2.1)*0.005);
          vec2 p = ((gl_FragCoord.xy + shake*iResolution.xy) - iResolution.xy*0.5) / iResolution.y * mat2(6,-4,4,6);
          vec4 o = vec4(0.0);
          float f = 2.0 + fbm(p + vec2(iTime*5.0,0.0))*0.5;

          for (float i = 0.0; i < 35.0; i++) {
            vec2 v = p + cos(i*i + (iTime+p.x*0.08)*0.025 + i*vec2(13,11))*3.5 + vec2(sin(iTime*3.0+i)*0.003, cos(iTime*3.5-i)*0.003);
            float tail = fbm(v+vec2(iTime*0.5,i))*0.3*(1.0-(i/35.0));
            vec4 ac = vec4(0.1+0.3*sin(i*0.2+iTime*0.4), 0.3+0.5*cos(i*0.3+iTime*0.5), 0.7+0.3*sin(i*0.4+iTime*0.3), 1.0);
            vec4 cc = ac * exp(sin(i*i+iTime*0.8)) / length(max(v, vec2(v.x*f*0.015, v.y*1.5)));
            o += cc * (1.0+tail*0.8) * smoothstep(0.0,1.0,i/35.0)*0.6;
          }
          o = tanh(pow(o/100.0, vec4(1.6)));
          gl_FragColor = o * 1.5;
        }
      `
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));

    function resize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      renderer.setSize(w, h, false);
      material.uniforms.iResolution.value.set(w, h);
    }

    let frameId: number;
    (function loop() {
      frameId = requestAnimationFrame(loop);
      material.uniforms.iTime.value += 0.016;
      renderer.render(scene, camera);
    })();

    window.addEventListener("resize", resize);
    resize();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
