import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { TEXTURES } from "./assets";
import { isSmallScreen } from "./capability";
import type { SunVisual } from "./types";
import { GLSL_NOISE, damp, loadOptionalTexture, seeded } from "./util";

// ---------------------------------------------------------------------------
// Scene A: the Sun. Its activity matches the real storm data: calm for a quiet
// day, one bright active region for a medium storm, and an eruption for a
// strong one. The child can drag to turn it.
// ---------------------------------------------------------------------------

const R = 2.2;

function spotsFor(seed: number): THREE.Vector3[] {
  const rand = seeded(seed || 1);
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < 4; i++) {
    const lat = (rand() - 0.5) * 1.0; // active regions sit near the equator
    const lon = i === 0 ? (rand() - 0.5) * 0.9 : rand() * Math.PI * 2;
    out.push(
      new THREE.Vector3(
        Math.cos(lat) * Math.sin(lon),
        Math.sin(lat),
        Math.cos(lat) * Math.cos(lon),
      ),
    );
  }
  return out;
}

function SunBody({ visual }: { visual: SunVisual }) {
  const group = useRef<THREE.Group>(null);
  const { gl } = useThree();
  const [map, setMap] = useState<THREE.Texture | null>(null);
  const activity = useRef(visual.activity);
  const spin = useRef({ vy: 0, vx: 0, dragging: false, lastX: 0, lastY: 0 });

  useEffect(() => {
    if (!TEXTURES.sun) return;
    let alive = true;
    loadOptionalTexture(TEXTURES.sun).then((t) => alive && setMap(t));
    return () => {
      alive = false;
    };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: visual.activity },
      uSpots: { value: spotsFor(visual.seed) },
      uMap: { value: null as THREE.Texture | null },
      uUseMap: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    uniforms.uSpots.value = spotsFor(visual.seed);
    // Turn the Sun so the main active region faces the viewer.
    if (group.current) {
      const s = uniforms.uSpots.value[0];
      group.current.rotation.y = -Math.atan2(s.x, s.z);
    }
  }, [visual.seed, uniforms]);

  useEffect(() => {
    uniforms.uMap.value = map;
    uniforms.uUseMap.value = map ? 1 : 0;
  }, [map, uniforms]);

  // Drag sideways to turn the Sun. Vertical swipes still scroll the page.
  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "pan-y";
    el.style.cursor = "grab";
    const s = spin.current;
    const down = (e: PointerEvent) => {
      s.dragging = true;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!s.dragging) return;
      s.vy = (e.clientX - s.lastX) * 0.012;
      s.vx = (e.clientY - s.lastY) * 0.006;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
    };
    const up = () => {
      s.dragging = false;
      el.style.cursor = "grab";
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);
    uniforms.uTime.value += dt;
    activity.current = damp(activity.current, visual.activity, 2.5, dt);
    uniforms.uActivity.value = activity.current;
    const s = spin.current;
    if (group.current) {
      group.current.rotation.y += s.vy + dt * 0.03; // slow real-feeling rotation
      group.current.rotation.x = THREE.MathUtils.clamp(group.current.rotation.x + s.vx, -0.6, 0.6);
    }
    if (!s.dragging) {
      s.vy = damp(s.vy, 0, 3, dt);
      s.vx = damp(s.vx, 0, 6, dt);
    } else {
      s.vy *= 0.6;
      s.vx *= 0.6;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[R, 96, 64]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={/* glsl */ `
            varying vec3 vPos; varying vec3 vNormal; varying vec3 vView; varying vec2 vUv;
            void main(){
              vPos = normalize(position);
              vUv = uv;
              vec4 mv = modelViewMatrix * vec4(position,1.0);
              vNormal = normalize(normalMatrix * normal);
              vView = normalize(-mv.xyz);
              gl_Position = projectionMatrix * mv;
            }`}
          fragmentShader={/* glsl */ `
            ${GLSL_NOISE}
            varying vec3 vPos; varying vec3 vNormal; varying vec3 vView; varying vec2 vUv;
            uniform float uTime; uniform float uActivity; uniform vec3 uSpots[4];
            uniform sampler2D uMap; uniform float uUseMap;
            vec3 ramp(float b){
              vec3 c0=vec3(0.30,0.05,0.00);
              vec3 c1=vec3(0.95,0.36,0.03);
              vec3 c2=vec3(1.00,0.74,0.25);
              vec3 c3=vec3(1.00,0.97,0.86);
              vec3 c=mix(c0,c1,smoothstep(0.0,0.45,b));
              c=mix(c,c2,smoothstep(0.4,0.8,b));
              c=mix(c,c3,smoothstep(0.8,1.25,b));
              return c;
            }
            void main(){
              vec3 p = vPos;
              float t = uTime * 0.05;
              // Slow boiling surface plus fine granulation.
              float big = fbm3(p * 2.6 + vec3(0.0, t, t * 0.6));
              float fine = snoise(p * 22.0 + vec3(t * 5.0)) * 0.5 + snoise(p * 46.0 - vec3(t * 7.0)) * 0.25;
              float b = 0.40 + big * 0.30 + fine * 0.09;
              // Active regions: bright patches with a dark sunspot in the middle.
              for(int i=0;i<4;i++){
                float weight = i==0 ? 1.0 : smoothstep(0.55, 1.0, uActivity) * 0.7;
                float d = distance(p, uSpots[i]);
                float region = exp(-d*d*26.0) * (0.6 + 0.4 * snoise(p*9.0 + float(i)*3.0 + t*2.0));
                float core = exp(-d*d*380.0);
                float flash = 0.75 + 0.25 * sin(uTime * (1.5 + float(i)) + float(i));
                b += region * weight * uActivity * 1.05 * flash;
                b -= core * weight * smoothstep(0.15, 0.5, uActivity) * 0.55;
              }
              vec3 col = ramp(b);
              if(uUseMap > 0.5){
                vec3 tex = texture2D(uMap, vUv).rgb;
                col = mix(col, tex * 1.6, 0.6);
              }
              // The edge of the Sun looks darker than the middle (limb darkening).
              float mu = clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0);
              col *= 0.30 + 0.70 * pow(mu, 0.6);
              col *= 1.05;
              gl_FragColor = vec4(col, 1.0);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }`}
        />
      </mesh>
      <Eruption visual={visual} spot={uniforms.uSpots} />
    </group>
  );
}

/** A looping burst of hot gas from the main active region on strong days. */
function Eruption({
  visual,
  spot,
}: {
  visual: SunVisual;
  spot: { value: THREE.Vector3[] };
}) {
  const n = isSmallScreen() ? 260 : 600;
  const mat = useRef<THREE.PointsMaterial>(null);
  const level = useRef(0);
  const seeds = useMemo(() => {
    const rand = seeded(17);
    return Array.from({ length: n }, () => ({
      a: rand() * Math.PI * 2,
      spread: Math.pow(rand(), 0.7) * 0.55,
      phase: rand(),
      speed: 0.35 + rand() * 0.5,
    }));
  }, [n]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return g;
  }, [n]);
  const tA = useMemo(() => new THREE.Vector3(), []);
  const tB = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, dt) => {
    const want = THREE.MathUtils.smoothstep(visual.activity, 0.5, 0.95);
    level.current = damp(level.current, want, 2, dt);
    if (mat.current) mat.current.opacity = level.current;
    if (level.current < 0.01) return;
    const s = spot.value[0];
    tA.set(0, 1, 0).cross(s).normalize();
    tB.copy(s).cross(tA).normalize();
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = geo.attributes.color as THREE.BufferAttribute;
    const reach = 1.1 + level.current * 2.4;
    for (let i = 0; i < n; i++) {
      const q = seeds[i];
      const prog = (q.phase + clock.elapsedTime * q.speed * 0.25) % 1;
      dir
        .copy(s)
        .addScaledVector(tA, Math.cos(q.a) * q.spread)
        .addScaledVector(tB, Math.sin(q.a) * q.spread)
        .normalize();
      const dist = R * 1.01 + prog * reach;
      pos.setXYZ(i, dir.x * dist, dir.y * dist, dir.z * dist);
      const fade = (1 - prog) * (1 - prog);
      col.setXYZ(i, 1.0 * fade, 0.62 * fade, 0.22 * fade);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial
        ref={mat}
        size={0.07}
        vertexColors
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** The Sun's soft outer glow. This is the only glow in the whole game. */
function Corona({ visual }: { visual: SunVisual }) {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uActivity: { value: visual.activity } }), []); // eslint-disable-line
  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    uniforms.uActivity.value = damp(uniforms.uActivity.value, visual.activity, 2.5, dt);
    mesh.current?.quaternion.copy(camera.quaternion);
  });
  return (
    <mesh ref={mesh} renderOrder={-1}>
      <planeGeometry args={[R * 5.2, R * 5.2]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={/* glsl */ `
          ${GLSL_NOISE}
          varying vec2 vUv; uniform float uTime; uniform float uActivity;
          void main(){
            vec2 c = vUv - 0.5;
            float r = length(c) * 5.2;           // in Sun radii
            float ang = atan(c.y, c.x);
            float rays = 0.75 + 0.25 * snoise(vec3(cos(ang)*2.0, sin(ang)*2.0, uTime*0.08));
            float fall = exp(-(r - 1.0) * (2.6 - uActivity * 0.9));
            float glow = step(0.98, r) * fall * rays;
            vec3 col = mix(vec3(1.0,0.55,0.18), vec3(1.0,0.86,0.6), fall);
            gl_FragColor = vec4(col * glow * (0.35 + uActivity * 0.5), glow);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`}
      />
    </mesh>
  );
}

function Starfield() {
  const geo = useMemo(() => {
    const rand = seeded(3);
    const n = 700;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize().multiplyScalar(90);
      pos.set([v.x, v.y, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial size={1.4} sizeAttenuation={false} color="#f2efea" transparent opacity={0.7} depthWrite={false} />
    </points>
  );
}

/** Keeps the whole Sun in view on wide and tall screens. */
function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    cam.position.set(0, 0, aspect < 0.9 ? 8.4 / Math.max(aspect, 0.5) * 0.82 : 8.4);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

interface Props {
  visual: SunVisual;
  active: boolean;
}

export default function SunCanvas({ visual, active }: Props) {
  const maxDpr = Math.min(window.devicePixelRatio || 1, isSmallScreen() ? 1.5 : 2);
  return (
    <Canvas
      dpr={maxDpr}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 36, near: 0.1, far: 300, position: [0, 0, 8.4] }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        scene.background = new THREE.Color("#060607");
      }}
    >
      <FitCamera />
      <Starfield />
      <Corona visual={visual} />
      <SunBody visual={visual} />
    </Canvas>
  );
}
