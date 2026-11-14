import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { isSmallScreen } from "./capability";
import { GLSL_NOISE, damp, seeded } from "./util";

// ---------------------------------------------------------------------------
// Scene C: a message travelling from Earth to Mars. The planets are drawn
// close together and large so a child can see both; the real distance and
// delay are stated in words beside the scene.
// ---------------------------------------------------------------------------

const EARTH = new THREE.Vector3(-3.6, 0, 0);
const MARS = new THREE.Vector3(3.9, 0.2, 0);
const LIGHT = new THREE.Vector3(-0.5, 0.45, 0.75).normalize();

function Planet({ kind, position, radius }: { kind: 0 | 1; position: THREE.Vector3; radius: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({ uKind: { value: kind }, uLight: { value: LIGHT }, uTime: { value: 0 } }),
    [kind],
  );
  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    if (mesh.current) mesh.current.rotation.y += dt * (kind === 0 ? 0.08 : 0.06);
  });
  return (
    <mesh ref={mesh} position={position} rotation={[0.25, 0, kind === 0 ? 0.4 : 0.44]}>
      <sphereGeometry args={[radius, 64, 48]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec3 vPos; varying vec3 vWorldNormal; varying vec3 vViewDir;
          void main(){
            vPos = normalize(position);
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            vec4 world = modelMatrix * vec4(position,1.0);
            vViewDir = normalize(cameraPosition - world.xyz);
            gl_Position = projectionMatrix * viewMatrix * world;
          }`}
        fragmentShader={/* glsl */ `
          ${GLSL_NOISE}
          varying vec3 vPos; varying vec3 vWorldNormal; varying vec3 vViewDir;
          uniform float uKind; uniform vec3 uLight; uniform float uTime;
          void main(){
            vec3 n = normalize(vWorldNormal);
            float lit = max(dot(n, normalize(uLight)), 0.0);
            vec3 col;
            if(uKind < 0.5){
              // Earth: oceans, land, ice caps and drifting cloud.
              float land = fbm3(vPos * 2.3 + 4.0);
              vec3 ocean = vec3(0.03, 0.16, 0.36);
              vec3 green = vec3(0.16, 0.34, 0.14);
              vec3 tan = vec3(0.52, 0.42, 0.26);
              col = mix(ocean, mix(green, tan, smoothstep(0.1,0.5,land)), smoothstep(0.02, 0.1, land));
              col = mix(col, vec3(0.92), smoothstep(0.78, 0.92, abs(vPos.y)));
              float cloud = smoothstep(0.15, 0.6, fbm3(vPos * 3.4 + vec3(uTime*0.01, 0.0, 9.0)));
              col = mix(col, vec3(0.95), cloud * 0.65);
              float rim = pow(1.0 - max(dot(n, normalize(vViewDir)), 0.0), 3.0);
              col += vec3(0.25, 0.5, 0.95) * rim * 0.6 * lit;
            } else {
              // Mars: rust plains, darker regions and small polar caps.
              float f = fbm3(vPos * 2.8 + 11.0);
              col = mix(vec3(0.42, 0.18, 0.08), vec3(0.78, 0.42, 0.22), smoothstep(-0.4, 0.5, f));
              col = mix(col, vec3(0.9, 0.86, 0.82), smoothstep(0.9, 0.97, abs(vPos.y)));
            }
            col *= 0.04 + lit * 1.25;
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`}
      />
    </mesh>
  );
}

function Path() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([EARTH, MARS]);
    return g;
  }, []);
  const line = useMemo(() => {
    const m = new THREE.LineDashedMaterial({
      color: "#a9a59e",
      dashSize: 0.12,
      gapSize: 0.14,
      transparent: true,
      opacity: 0.6,
    });
    const l = new THREE.Line(geo, m);
    l.computeLineDistances();
    return l;
  }, [geo]);
  return <primitive object={line} />;
}

function Signal({ progress, loopSeconds }: { progress?: number; loopSeconds?: number }) {
  const head = useRef<THREE.Mesh>(null);
  const trail = useRef<THREE.Points>(null);
  const p = useRef(progress ?? 0);
  const n = 26;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return g;
  }, []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, dt) => {
    if (loopSeconds) p.current = (clock.elapsedTime % loopSeconds) / loopSeconds;
    else p.current = damp(p.current, THREE.MathUtils.clamp(progress ?? 0, 0, 1), 6, dt);
    const lo = 0.13;
    const hi = 0.93; // start and end at the planets' surfaces
    const at = lo + p.current * (hi - lo);
    tmp.lerpVectors(EARTH, MARS, at);
    head.current?.position.copy(tmp);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = geo.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < n; i++) {
      const back = Math.max(lo, at - i * 0.006);
      tmp.lerpVectors(EARTH, MARS, back);
      pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
      const f = 1 - i / n;
      col.setXYZ(i, 1.0 * f, 0.68 * f, 0.1 * f);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  return (
    <>
      <points ref={trail} geometry={geo}>
        <pointsMaterial size={0.09} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <mesh ref={head}>
        <sphereGeometry args={[0.085, 16, 12]} />
        <meshBasicMaterial color="#ffae1a" toneMapped={false} />
      </mesh>
    </>
  );
}

function Stars() {
  const geo = useMemo(() => {
    const rand = seeded(11);
    const n = 500;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rand() - 0.5) * 60;
      pos[i * 3 + 1] = (rand() - 0.5) * 30;
      pos[i * 3 + 2] = -12 - rand() * 20;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial size={1.3} sizeAttenuation={false} color="#f2efea" transparent opacity={0.65} depthWrite={false} />
    </points>
  );
}

interface Props {
  /** 0 = at Earth, 1 = arrived at Mars. */
  progress?: number;
  /** If set, the message loops on its own every this many seconds. */
  loopSeconds?: number;
  active: boolean;
}

export default function MessageCanvas({ progress, loopSeconds, active }: Props) {
  const maxDpr = Math.min(window.devicePixelRatio || 1, isSmallScreen() ? 1.5 : 2);
  return (
    <Canvas
      dpr={maxDpr}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 30, near: 0.1, far: 200, position: [0, 0.4, 13] }}
      gl={{ antialias: true }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        scene.background = new THREE.Color("#060607");
      }}
    >
      <Stars />
      <Planet kind={0} position={EARTH} radius={1.25} />
      <Planet kind={1} position={MARS} radius={0.7} />
      <Path />
      <Signal progress={progress} loopSeconds={loopSeconds} />
    </Canvas>
  );
}
