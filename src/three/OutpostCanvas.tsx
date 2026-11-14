import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { TEXTURES } from "./assets";
import { isSmallScreen } from "./capability";
import type { OutpostShot, OutpostVisual } from "./types";
import { damp, dampVec, fbm, loadOptionalTexture, makeNoise2D, seeded } from "./util";

// ---------------------------------------------------------------------------
// Scene B: the Mars outpost. Everything that moves or lights up here is game
// state (see OutpostVisual). Built from simple geometry with physically based
// materials, one Sun light with soft shadows and filmic tone mapping.
// ---------------------------------------------------------------------------

const DAYLIGHT_HOURS = 12; // matches DAYLIGHT_HOURS in data/constants.ts

// Colours taken from the design tokens (kept as numbers for three.js).
const C = {
  lifeSupport: new THREE.Color("#5fbf8f"),
  shielding: new THREE.Color("#6fa8dc"),
  science: new THREE.Color("#e3d5b8"),
  accent: new THREE.Color("#ffae1a"),
  danger: new THREE.Color("#e5533d"),
  hull: new THREE.Color("#d8d3ca"),
  hullDark: new THREE.Color("#8d8a85"),
  marsLight: new THREE.Color("#c2875c"),
  marsDark: new THREE.Color("#8c5638"),
  skyHorizon: new THREE.Color("#d9a877"),
  skyZenith: new THREE.Color("#8f6a4f"),
  skyNight: new THREE.Color("#0a0a0d"),
  dustSky: new THREE.Color("#a8693e"),
};

// Fixed places on the base.
const P = {
  shelter: new THREE.Vector3(-6.2, 0, 5.2),
  shelterDoor: new THREE.Vector3(-5.1, 0, 7.0),
  greenhouse: new THREE.Vector3(5.0, 0, 1.8),
  panels: new THREE.Vector3(1.5, 0, -7.5),
  batteryPost: new THREE.Vector3(1.9, 0, 3.6),
};

/** Shared, mutable values smoothed every frame. Read by all the parts. */
interface Live {
  lifeSupport: number;
  shielding: number;
  science: number;
  battery: number;
  greenhouse: number;
  storm: number;
  dust: number;
  day: number; // 1 = full day, 0 = night
  sunDir: THREE.Vector3; // direction TO the Sun
  stormDir: THREE.Vector3; // direction the particles come FROM
}

function sunDirectionForHour(hour: number, out: THREE.Vector3): number {
  // The Sun rises in the east (+x), passes through the south (+z), sets in the
  // west (-x). Returns how much daylight there is (0..1).
  const h = ((hour % 24) + 24) % 24;
  const f = (h + 0.7) / (DAYLIGHT_HOURS + 1.4); // 0..1 across the day
  if (f >= 0 && f <= 1) {
    const elevation = Math.sin(Math.PI * f) * THREE.MathUtils.degToRad(52);
    const azimuth = Math.PI * f; // 0 = east, PI = west
    out.set(
      Math.cos(azimuth) * Math.cos(elevation),
      Math.sin(elevation),
      Math.sin(azimuth) * Math.cos(elevation) * 0.75 + 0.25,
    ).normalize();
    return THREE.MathUtils.smoothstep(Math.sin(Math.PI * f), 0, 0.22);
  }
  out.set(-0.8, -0.3, 0.3).normalize();
  return 0;
}

// --- Sky -------------------------------------------------------------------

function Sky({ live }: { live: Live }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uDay: { value: 1 },
      uDust: { value: 0 },
      uHorizon: { value: C.skyHorizon.clone() },
      uZenith: { value: C.skyZenith.clone() },
      uNight: { value: C.skyNight.clone() },
      uDustCol: { value: C.dustSky.clone() },
    }),
    [],
  );
  useFrame(() => {
    uniforms.uSunDir.value.copy(live.sunDir);
    uniforms.uDay.value = live.day;
    uniforms.uDust.value = live.dust;
  });
  return (
    <mesh scale={400} renderOrder={-10}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
        ref={mat}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec3 vDir;
          void main(){
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }`}
        fragmentShader={/* glsl */ `
          varying vec3 vDir;
          uniform vec3 uSunDir; uniform float uDay; uniform float uDust;
          uniform vec3 uHorizon; uniform vec3 uZenith; uniform vec3 uNight; uniform vec3 uDustCol;
          void main(){
            vec3 d = normalize(vDir);
            float up = clamp(d.y, 0.0, 1.0);
            // Mars daytime sky: dusty butterscotch, lighter at the horizon.
            vec3 day = mix(uHorizon, uZenith, pow(up, 0.55));
            day = mix(day, uDustCol, uDust * 0.75);
            // Near a low Sun the Martian sky turns cool blue (a real effect).
            float sunAmt = max(dot(d, normalize(uSunDir)), 0.0);
            float low = 1.0 - smoothstep(0.05, 0.55, uSunDir.y);
            vec3 blue = vec3(0.56, 0.72, 0.9);
            day = mix(day, blue, pow(sunAmt, 6.0) * low * 0.75 * (1.0 - uDust));
            // The Sun's disc. From Mars it looks about two thirds as wide as from Earth.
            float disc = smoothstep(0.99975, 0.99992, sunAmt);
            float halo = pow(sunAmt, 220.0) * 0.6;
            day += vec3(1.0, 0.96, 0.88) * (disc * 3.0 + halo) * (1.0 - uDust * 0.7);
            vec3 night = uNight + vec3(0.03,0.025,0.03) * (1.0 - up);
            vec3 col = mix(night, day, uDay);
            // Below the horizon fades to ground haze.
            col = mix(col, mix(uNight, uHorizon * 0.8, uDay), smoothstep(0.0, -0.15, d.y));
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`}
      />
    </mesh>
  );
}

function NightStars({ live }: { live: Live }) {
  const mat = useRef<THREE.PointsMaterial>(null);
  const geo = useMemo(() => {
    const rand = seeded(7);
    const n = 900;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rand();
      const v = rand() * 0.95 + 0.05;
      const theta = u * Math.PI * 2;
      const phi = Math.acos(v);
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * 380;
      pos[i * 3 + 1] = Math.cos(phi) * 380;
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * 380;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame(() => {
    if (mat.current) mat.current.opacity = (1 - live.day) * (1 - live.dust * 0.8);
  });
  return (
    <points geometry={geo} renderOrder={-9}>
      <pointsMaterial
        ref={mat}
        size={1.6}
        sizeAttenuation={false}
        color="#f2efea"
        transparent
        depthWrite={false}
        fog={false}
      />
    </points>
  );
}

// --- Ground ----------------------------------------------------------------

function Ground() {
  const [map, setMap] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!TEXTURES.marsGround) return;
    let alive = true;
    loadOptionalTexture(TEXTURES.marsGround).then((t) => {
      if (!alive || !t) return;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(24, 24);
      setMap(t);
    });
    return () => {
      alive = false;
    };
  }, []);

  const geometry = useMemo(() => {
    const noise = makeNoise2D(42);
    const segs = isSmallScreen() ? 110 : 180;
    const g = new THREE.PlaneGeometry(320, 320, segs, segs);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const col = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r = Math.hypot(x, z);
      // Flat pad under the base, low dunes nearby, hills and mesas far away.
      const flat = THREE.MathUtils.smoothstep(r, 11, 30);
      const far = THREE.MathUtils.smoothstep(r, 45, 150);
      const dunes = (fbm(noise, x * 0.06, z * 0.06, 4) - 0.5) * 2.4;
      const ripples = (fbm(noise, x * 0.5 + 40, z * 0.5, 2) - 0.5) * 0.22;
      const hills = Math.pow(fbm(noise, x * 0.012 + 9, z * 0.012 + 3, 5), 2.2) * 46;
      const y = (dunes + ripples) * flat + hills * far;
      pos.setY(i, y);
      const shade = fbm(noise, x * 0.09 + 70, z * 0.09 + 20, 3);
      col.copy(C.marsDark).lerp(C.marsLight, shade * 0.9 + 0.1);
      col.multiplyScalar(0.85 + far * 0.25);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors={!map} map={map ?? undefined} roughness={1} metalness={0} />
    </mesh>
  );
}

function Rocks() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = isSmallScreen() ? 90 : 220;
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const rand = seeded(99);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 12 + Math.pow(rand(), 1.6) * 60;
      const size = 0.1 + Math.pow(rand(), 3) * 0.75;
      p.set(Math.cos(angle) * dist, size * 0.25, Math.sin(angle) * dist);
      q.setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, rand() * 3));
      s.set(size, size * (0.5 + rand() * 0.5), size * (0.7 + rand() * 0.6));
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#7d4e36" roughness={1} flatShading />
    </instancedMesh>
  );
}

// --- Habitat (Life Support) -------------------------------------------------

function Habitat({ live }: { live: Live }) {
  const windowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a1c1f",
        emissive: "#ffd9a3",
        emissiveIntensity: 1,
        roughness: 0.3,
      }),
    [],
  );
  const glow = useRef<THREE.PointLight>(null);
  const beacon = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const powered = live.battery > 0.5 ? 1 : 0;
    const level = live.lifeSupport * powered;
    windowMat.emissiveIntensity = 0.08 + level * 3.2;
    if (glow.current) glow.current.intensity = level * (1 - live.day * 0.85) * 14;
    if (beacon.current) {
      // The mast beacon flashes red while a storm is hitting the base.
      const blink = live.storm > 0.05 ? (Math.sin(clock.elapsedTime * 6) > 0 ? 1 : 0.15) : 0;
      beacon.current.emissiveIntensity = blink * 4;
    }
  });

  const windowX = [-2.1, -1.05, 0, 1.05, 2.1];

  return (
    <group position={[0, 0, 0]}>
      {/* Main pressurised module on short legs */}
      <group position={[0, 1.75, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <capsuleGeometry args={[1.45, 4.6, 12, 28]} />
          <meshStandardMaterial color={C.hull} roughness={0.55} metalness={0.15} />
        </mesh>
        {/* Panel seams */}
        {[-1.6, 0, 1.6].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[1.46, 0.035, 8, 40]} />
            <meshStandardMaterial color={C.hullDark} roughness={0.7} metalness={0.3} />
          </mesh>
        ))}
        {/* Windows: brightness = Life Support share */}
        {windowX.map((x) => (
          <mesh key={x} position={[x, 0.2, 1.4]} material={windowMat}>
            <boxGeometry args={[0.62, 0.42, 0.14]} />
          </mesh>
        ))}
        <pointLight ref={glow} position={[0, 0.2, 2.6]} color="#ffd9a3" distance={12} decay={2} />
        {/* Airlock */}
        <mesh position={[3.9, -0.35, 0]} castShadow>
          <boxGeometry args={[1.2, 1.8, 1.6]} />
          <meshStandardMaterial color={C.hullDark} roughness={0.6} metalness={0.25} />
        </mesh>
      </group>
      {/* Legs */}
      {[-2, 2].flatMap((x) =>
        [-0.8, 0.8].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.3, z]} castShadow>
            <cylinderGeometry args={[0.12, 0.2, 0.7, 10]} />
            <meshStandardMaterial color={C.hullDark} roughness={0.6} metalness={0.4} />
          </mesh>
        )),
      )}
      {/* Dome module and connecting tube */}
      <mesh position={[-5.0, 0, -0.6]} castShadow receiveShadow>
        <sphereGeometry args={[2.1, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={C.hull} roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[-3.2, 1.2, -0.3]} rotation={[0, 0.16, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 1.6, 16]} />
        <meshStandardMaterial color={C.hullDark} roughness={0.65} metalness={0.2} />
      </mesh>
      {/* Comms mast, dish and storm beacon */}
      <group position={[-5.0, 2.1, -0.6]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, 2.4, 8]} />
          <meshStandardMaterial color={C.hullDark} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0.25, 1.9, 0.15]} rotation={[-0.9, 0.4, 0]} castShadow>
          <sphereGeometry args={[0.55, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
          <meshStandardMaterial color={C.hull} side={THREE.DoubleSide} roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.09, 12, 8]} />
          <meshStandardMaterial ref={beacon} color="#2a1410" emissive={C.danger} emissiveIntensity={0} />
        </mesh>
      </group>
    </group>
  );
}

// --- Greenhouse (food, part of Life Support) --------------------------------

function Greenhouse({ live }: { live: Live }) {
  const plants = useRef<THREE.InstancedMesh>(null);
  const leaf = useRef<THREE.MeshStandardMaterial>(null);
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  const shown = useRef(-1);
  const count = 54;
  const layout = useMemo(() => {
    const rand = seeded(5);
    return Array.from({ length: count }, (_, i) => {
      const row = i % 3;
      const col = Math.floor(i / 3);
      return {
        x: (row - 1) * 0.72 + (rand() - 0.5) * 0.12,
        z: (col / (count / 3 - 1) - 0.5) * 4.0,
        h: 0.5 + rand() * 0.35,
        lean: rand() * Math.PI * 2,
      };
    });
  }, []);
  const healthy = useMemo(() => new THREE.Color("#4f9e4a"), []);
  const wilted = useMemo(() => new THREE.Color("#7d6a3a"), []);

  useFrame(() => {
    const health = THREE.MathUtils.clamp(live.greenhouse / 100, 0, 1);
    if (lamp.current) lamp.current.emissiveIntensity = live.battery > 0.5 ? 0.2 + live.lifeSupport * 2.6 : 0;
    if (leaf.current) leaf.current.color.copy(wilted).lerp(healthy, health);
    if (Math.abs(health - shown.current) < 0.004 || !plants.current) return;
    shown.current = health;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const droop = (1 - health) * 1.15;
    layout.forEach((pl, i) => {
      e.set(Math.cos(pl.lean) * droop, 0, Math.sin(pl.lean) * droop);
      q.setFromEuler(e);
      const hgt = pl.h * (0.55 + health * 0.45);
      s.set(1, hgt, 1);
      p.set(pl.x, 0.34 + hgt * 0.5 * Math.cos(droop), pl.z);
      m.compose(p, q, s);
      plants.current!.setMatrixAt(i, m);
    });
    plants.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={P.greenhouse} rotation={[0, -0.25, 0]}>
      {/* Planter beds */}
      {[-0.72, 0, 0.72].map((x) => (
        <mesh key={x} position={[x, 0.17, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.34, 4.4]} />
          <meshStandardMaterial color="#3a3531" roughness={0.9} />
        </mesh>
      ))}
      <instancedMesh ref={plants} args={[undefined, undefined, count]}>
        <coneGeometry args={[0.17, 1, 7]} />
        <meshStandardMaterial ref={leaf} color={healthy} roughness={0.8} />
      </instancedMesh>
      {/* Grow light strip */}
      <mesh position={[0, 1.62, 0]}>
        <boxGeometry args={[0.16, 0.06, 4.2]} />
        <meshStandardMaterial ref={lamp} color="#222" emissive="#fff1d6" emissiveIntensity={1} />
      </mesh>
      {/* Clear half-cylinder shell */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[1.75, 1.75, 4.8, 28, 1, true, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial
          color="#cfe3df"
          transparent
          opacity={0.3}
          roughness={0.08}
          metalness={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Ribs and end walls */}
      {[-2.4, -1.2, 0, 1.2, 2.4].map((z) => (
        <mesh key={z} position={[0, 0, z]} rotation={[0, 0, 0]}>
          <torusGeometry args={[1.75, 0.04, 6, 28, Math.PI]} />
          <meshStandardMaterial color={C.hull} roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// --- Storm shelter (Shielding) ---------------------------------------------

function Shelter({ live }: { live: Live }) {
  const doorL = useRef<THREE.Mesh>(null);
  const doorR = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.PointLight>(null);
  const frame = useRef<THREE.MeshStandardMaterial>(null);
  const tanks = useRef<THREE.Group>(null);
  const open = useRef(0);

  useFrame((_, dt) => {
    const powered = live.battery > 0.5 ? 1 : 0;
    const share = live.shielding * powered;
    open.current = damp(open.current, share > 0.05 ? Math.min(1, share * 1.6) : 0, 4, dt);
    if (doorL.current) doorL.current.position.x = -0.42 - open.current * 0.72;
    if (doorR.current) doorR.current.position.x = 0.42 + open.current * 0.72;
    if (inner.current) inner.current.intensity = share * 22;
    if (frame.current) frame.current.emissiveIntensity = 0.1 + share * 2.4;
    // The water wall: more Shielding power moves more water tanks into place.
    if (tanks.current) {
      const want = Math.round(share * 6);
      tanks.current.children.forEach((t, i) => {
        const target = i < want ? 1 : 0.001;
        t.scale.y = damp(t.scale.y, target, 5, dt);
        t.visible = t.scale.y > 0.02;
      });
    }
  });

  return (
    <group position={P.shelter} rotation={[0, 0.55, 0]}>
      {/* Mound of Mars soil piled over the shelter: thick walls stop particles */}
      <mesh scale={[3.6, 2.1, 3.2]} castShadow receiveShadow>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#9a6242" roughness={1} />
      </mesh>
      {/* Entrance tunnel */}
      <group position={[0, 0, 2.7]}>
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[2.3, 1.9, 1.5]} />
          <meshStandardMaterial color={C.hullDark} roughness={0.7} metalness={0.25} />
        </mesh>
        {/* Door frame light: brightness = Shielding share */}
        <mesh position={[0, 0.95, 0.76]}>
          <boxGeometry args={[1.95, 1.7, 0.06]} />
          <meshStandardMaterial ref={frame} color="#15181c" emissive={C.shielding} emissiveIntensity={0.1} />
        </mesh>
        <mesh ref={doorL} position={[-0.42, 0.9, 0.82]} castShadow>
          <boxGeometry args={[0.84, 1.55, 0.08]} />
          <meshStandardMaterial color={C.hull} roughness={0.5} metalness={0.35} />
        </mesh>
        <mesh ref={doorR} position={[0.42, 0.9, 0.82]} castShadow>
          <boxGeometry args={[0.84, 1.55, 0.08]} />
          <meshStandardMaterial color={C.hull} roughness={0.5} metalness={0.35} />
        </mesh>
        <pointLight ref={inner} position={[0, 1, 1.6]} color={C.shielding} distance={9} decay={2} />
      </group>
      {/* Water tanks stacked beside the entrance */}
      <group ref={tanks} position={[2.0, 0, 2.5]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh
            key={i}
            position={[(i % 3) * 0.62, 0.45 + Math.floor(i / 3) * 0.92, 0]}
            scale={[1, 0.001, 1]}
            castShadow
          >
            <cylinderGeometry args={[0.28, 0.28, 0.86, 14]} />
            <meshStandardMaterial color="#4f86b8" roughness={0.35} metalness={0.2} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// --- Solar panels and battery post ------------------------------------------

function SolarArray({ live }: { live: Live }) {
  const clean = useMemo(() => new THREE.Color("#16233f"), []);
  const cells = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#16233f", roughness: 0.25, metalness: 0.7 }),
    [],
  );
  const dusty = useMemo(() => new THREE.Color("#8a5a3a"), []);
  useFrame(() => {
    cells.color.copy(clean).lerp(dusty, live.dust * 0.85);
    cells.roughness = 0.25 + live.dust * 0.65;
    cells.metalness = 0.7 - live.dust * 0.6;
  });
  return (
    <group position={P.panels} rotation={[0, 0.15, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[(i - 1.5) * 2.5, 0, 0]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 1.1, 8]} />
            <meshStandardMaterial color={C.hullDark} metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.2, 0]} rotation={[0.62, 0, 0]} material={cells} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.06, 1.5]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BatteryPost({ live }: { live: Live }) {
  const segs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame(() => {
    const lit = Math.ceil((live.battery / 100) * 5 - 0.001);
    segs.current.forEach((m, i) => {
      if (!m) return;
      const on = i < lit;
      const low = lit <= 1;
      m.emissive.copy(low ? C.danger : C.accent);
      m.emissiveIntensity = on ? 2.4 : 0.03;
    });
  });
  return (
    <group position={P.batteryPost}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.34, 1.8, 0.28]} />
        <meshStandardMaterial color="#26282c" roughness={0.6} metalness={0.4} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 0.35 + i * 0.28, 0.15]}>
          <boxGeometry args={[0.24, 0.2, 0.03]} />
          <meshStandardMaterial
            ref={(m) => {
              segs.current[i] = m;
            }}
            color="#111"
            emissive={C.accent}
            emissiveIntensity={0.03}
          />
        </mesh>
      ))}
    </group>
  );
}

// --- Rover (Science) --------------------------------------------------------

const ROVER_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(4.2, 0, 6.2),
  new THREE.Vector3(8, 0, 8.5),
  new THREE.Vector3(13, 0, 8.0),
  new THREE.Vector3(18, 0, 10.5),
  new THREE.Vector3(24, 0, 9.0),
  new THREE.Vector3(30, 0, 12),
]);

function Rover({ live, roverOut }: { live: Live; roverOut?: number }) {
  const group = useRef<THREE.Group>(null);
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  const wheels = useRef<THREE.Group>(null);
  const u = useRef(0.05);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const ahead = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, dt) => {
    const powered = live.battery > 0.5 ? 1 : 0;
    let target: number;
    if (roverOut !== undefined) {
      target = 0.04 + roverOut * 0.9; // the child's rover-run choice
    } else if (live.storm > 0.05) {
      target = 0.03; // storm: drive home
    } else {
      // More Science power = the rover works farther out.
      const reach = live.science * powered;
      target = 0.04 + reach * 0.8 * (0.6 + 0.4 * Math.sin(clock.elapsedTime * 0.22));
    }
    const before = u.current;
    u.current = damp(u.current, target, 1.1, dt);
    const speed = (u.current - before) / Math.max(dt, 0.001);
    ROVER_PATH.getPointAt(THREE.MathUtils.clamp(u.current, 0, 1), pos);
    ROVER_PATH.getPointAt(THREE.MathUtils.clamp(u.current + 0.01, 0, 1), ahead);
    if (group.current) {
      group.current.position.copy(pos);
      group.current.lookAt(ahead.x, pos.y, ahead.z);
    }
    if (wheels.current) wheels.current.children.forEach((w) => (w.rotation.x += speed * 40 * dt));
    if (lamp.current) lamp.current.emissiveIntensity = 0.2 + live.science * powered * 3.5;
  });

  return (
    <group ref={group}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[1.0, 0.34, 1.6]} />
        <meshStandardMaterial color={C.hull} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.84, -0.2]} castShadow>
        <boxGeometry args={[0.8, 0.12, 0.9]} />
        <meshStandardMaterial color="#16233f" roughness={0.3} metalness={0.7} />
      </mesh>
      <group ref={wheels}>
        {[-0.6, 0.6].flatMap((x) =>
          [-0.62, 0, 0.62].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.26, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.26, 0.26, 0.2, 14]} />
              <meshStandardMaterial color="#2b2b2e" roughness={0.9} />
            </mesh>
          )),
        )}
      </group>
      {/* Mast and science camera: brightness = Science share */}
      <mesh position={[0.25, 1.2, 0.5]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.9, 8]} />
        <meshStandardMaterial color={C.hullDark} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.25, 1.68, 0.55]}>
        <boxGeometry args={[0.32, 0.16, 0.2]} />
        <meshStandardMaterial ref={lamp} color="#222" emissive={C.science} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function RoverTrackMarks() {
  const geo = useMemo(() => {
    const pts = ROVER_PATH.getSpacedPoints(80);
    const g = new THREE.BufferGeometry();
    const verts: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      side.subVectors(b, a).cross(up).normalize().multiplyScalar(0.5);
      for (const s of [-1, 1]) {
        const w = 0.11;
        const ax = a.x + side.x * s;
        const az = a.z + side.z * s;
        const bx = b.x + side.x * s;
        const bz = b.z + side.z * s;
        const nx = (side.x / 0.5) * w;
        const nz = (side.z / 0.5) * w;
        verts.push(ax - nx, 0.02, az - nz, ax + nx, 0.02, az + nz, bx + nx, 0.02, bz + nz);
        verts.push(ax - nx, 0.02, az - nz, bx + nx, 0.02, bz + nz, bx - nx, 0.02, bz - nz);
      }
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color="#6e4630" roughness={1} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Dragging the rover in the scene: an invisible plane over the ground catches
// the pointer, we find the nearest point on the track, and report it back as a
// 0..1 distance (the same value the RoverTrack slider uses). Only mounted in
// the rover phase, when a drag handler is given.
const ROVER_SAMPLES = ROVER_PATH.getSpacedPoints(60);

function nearestRoverDistance(point: THREE.Vector3): number {
  let bestI = 0;
  let bestD = Infinity;
  for (let i = 0; i < ROVER_SAMPLES.length; i++) {
    const p = ROVER_SAMPLES[i];
    const dx = p.x - point.x;
    const dz = p.z - point.z;
    const d = dx * dx + dz * dz;
    if (d < bestD) {
      bestD = d;
      bestI = i;
    }
  }
  const u = bestI / (ROVER_SAMPLES.length - 1); // position along the track
  // The Rover maps roverOut 0..1 to u = 0.04 + roverOut*0.9; invert that.
  return THREE.MathUtils.clamp((u - 0.04) / 0.9, 0, 1);
}

function RoverDragPlane({ onRoverDrag }: { onRoverDrag: (v: number) => void }) {
  const dragging = useRef(false);
  const handle = (e: { point: THREE.Vector3; stopPropagation: () => void }) => {
    e.stopPropagation();
    onRoverDrag(nearestRoverDistance(e.point));
  };
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[16, 0.03, 8]}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element)?.setPointerCapture?.(e.pointerId);
        handle(e);
      }}
      onPointerMove={(e) => dragging.current && handle(e)}
      onPointerUp={(e) => {
        dragging.current = false;
        (e.target as Element)?.releasePointerCapture?.(e.pointerId);
      }}
    >
      {/* Covers the whole track area; invisible but still hit-tested. */}
      <planeGeometry args={[40, 20]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

// --- Crew -------------------------------------------------------------------

const CREW_HOME = [
  { home: new THREE.Vector3(-2.6, 0, 3.0), band: C.shielding }, // doctor
  { home: new THREE.Vector3(2.6, 0, 4.4), band: C.lifeSupport }, // engineer
  { home: new THREE.Vector3(5.2, 0, 6.4), band: C.science }, // scientist
];

function Crew({ live, crewSheltered }: { live: Live; crewSheltered: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }, dt) => {
    refs.current.forEach((g, i) => {
      if (!g) return;
      const goIn = live.storm > 0.05 && crewSheltered;
      if (goIn) target.copy(P.shelterDoor).add(new THREE.Vector3((i - 1) * 0.5, 0, 0.2));
      else target.copy(CREW_HOME[i].home);
      const before = g.position.clone();
      dampVec(g.position, target, goIn ? 1.6 : 1.0, dt);
      const moving = before.distanceTo(g.position) / Math.max(dt, 0.001) > 0.15;
      g.position.y = moving ? Math.abs(Math.sin(clock.elapsedTime * 9 + i)) * 0.07 : 0;
      if (moving) g.lookAt(target.x, g.position.y, target.z);
      // Once at the door they step inside (shrink away).
      const inside = goIn && g.position.distanceTo(target) < 0.5;
      const s = damp(g.scale.x, inside ? 0.001 : 1, 6, dt);
      g.scale.setScalar(s);
    });
  });
  return (
    <>
      {CREW_HOME.map((c, i) => (
        <group
          key={i}
          ref={(g) => {
            refs.current[i] = g;
          }}
          position={c.home}
        >
          <mesh position={[0, 0.62, 0]} castShadow>
            <capsuleGeometry args={[0.2, 0.55, 6, 12]} />
            <meshStandardMaterial color="#e9e6e0" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <cylinderGeometry args={[0.215, 0.215, 0.12, 14]} />
            <meshStandardMaterial color={c.band} roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.22, 0]} castShadow>
            <sphereGeometry args={[0.2, 16, 12]} />
            <meshStandardMaterial color="#f1eee8" roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.22, 0.1]}>
            <sphereGeometry args={[0.15, 14, 10]} />
            <meshStandardMaterial color="#c9952f" roughness={0.15} metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.72, -0.2]} castShadow>
            <boxGeometry args={[0.3, 0.42, 0.16]} />
            <meshStandardMaterial color="#cfcbc4" roughness={0.7} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// --- Weather: dust and the solar storm --------------------------------------

function Dust({ live }: { live: Live }) {
  const mat = useRef<THREE.PointsMaterial>(null);
  const pts = useRef<THREE.Points>(null);
  const n = isSmallScreen() ? 500 : 1400;
  const geo = useMemo(() => {
    const rand = seeded(21);
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rand() - 0.5) * 70;
      pos[i * 3 + 1] = rand() * 9;
      pos[i * 3 + 2] = (rand() - 0.5) * 70;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [n]);
  useFrame((_, dt) => {
    if (mat.current) mat.current.opacity = 0.04 + live.dust * 0.5;
    const attr = geo.attributes.position as THREE.BufferAttribute;
    const speed = (1.2 + live.dust * 9) * dt;
    for (let i = 0; i < n; i++) {
      let x = attr.getX(i) + speed;
      if (x > 35) x -= 70;
      attr.setX(i, x);
    }
    attr.needsUpdate = true;
  });
  return (
    <points ref={pts} geometry={geo}>
      <pointsMaterial ref={mat} size={0.09} color="#d9a877" transparent depthWrite={false} />
    </points>
  );
}

/**
 * The solar storm: streaks of particles arriving from the Sun's direction.
 * Real particles are invisible; the game draws them so the child can see the
 * danger (this is listed on the "What we simplified" page).
 */
function StormParticles({ live }: { live: Live }) {
  const n = isSmallScreen() ? 350 : 900;
  const mat = useRef<THREE.LineBasicMaterial>(null);
  const seeds = useMemo(() => {
    const rand = seeded(63);
    return Array.from({ length: n }, () => ({
      a: rand() * Math.PI * 2,
      r: Math.sqrt(rand()) * 34,
      t: rand(),
      v: 0.55 + rand() * 0.7,
    }));
  }, [n]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 6), 3));
    return g;
  }, [n]);
  const basisA = useMemo(() => new THREE.Vector3(), []);
  const basisB = useMemo(() => new THREE.Vector3(), []);
  const flow = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const strength = THREE.MathUtils.clamp(live.storm / 3, 0, 1);
    const on = live.storm > 0.02;
    if (mat.current) mat.current.opacity = Math.min(1, live.storm / 0.6) * (0.35 + strength * 0.55);
    if (!on) return;
    flow.copy(live.stormDir).multiplyScalar(-1); // from the Sun, toward the base
    basisA.set(0, 1, 0).cross(flow).normalize();
    basisB.copy(flow).cross(basisA).normalize();
    const attr = geo.attributes.position as THREE.BufferAttribute;
    const len = 1.2 + strength * 2.6;
    const time = clock.elapsedTime;
    const shown = Math.floor(n * (0.35 + strength * 0.65));
    for (let i = 0; i < n; i++) {
      const s = seeds[i];
      if (i >= shown) {
        attr.setXYZ(i * 2, 0, -100, 0);
        attr.setXYZ(i * 2 + 1, 0, -100, 0);
        continue;
      }
      const along = (((s.t + time * s.v * 0.5) % 1) - 0.5) * 90;
      const ox = Math.cos(s.a) * s.r;
      const oy = Math.sin(s.a) * s.r;
      const x = basisA.x * ox + basisB.x * oy + flow.x * along;
      const y = basisA.y * ox + basisB.y * oy + flow.y * along + 6;
      const z = basisA.z * ox + basisB.z * oy + flow.z * along;
      attr.setXYZ(i * 2, x, y, z);
      attr.setXYZ(i * 2 + 1, x + flow.x * len, y + flow.y * len, z + flow.z * len);
    }
    attr.needsUpdate = true;
  });

  return (
    <lineSegments geometry={geo} frustumCulled={false}>
      <lineBasicMaterial
        ref={mat}
        color="#ffe1b0"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

// --- Light ------------------------------------------------------------------

function Lighting({ live, shadows }: { live: Live; shadows: boolean }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const { scene } = useThree();
  const fogDay = useMemo(() => new THREE.Color("#c99468"), []);
  const fogNight = useMemo(() => new THREE.Color("#0b0b0e"), []);
  const fogDust = useMemo(() => new THREE.Color("#9a5f38"), []);
  const warm = useMemo(() => new THREE.Color("#ffd2a1"), []);
  const white = useMemo(() => new THREE.Color("#fff3e0"), []);

  useEffect(() => {
    scene.fog = new THREE.FogExp2(fogDay.getHex(), 0.011);
    return () => {
      scene.fog = null;
    };
  }, [scene, fogDay]);

  useFrame(() => {
    if (sun.current) {
      sun.current.position.copy(live.sunDir).multiplyScalar(60);
      const lowSun = 1 - THREE.MathUtils.smoothstep(live.sunDir.y, 0.05, 0.5);
      sun.current.color.copy(white).lerp(warm, lowSun);
      sun.current.intensity = live.day * (3.4 - live.dust * 2.3);
    }
    if (hemi.current) hemi.current.intensity = 0.1 + live.day * (0.75 - live.dust * 0.25);
    const fog = scene.fog as THREE.FogExp2 | null;
    if (fog) {
      fog.color.copy(fogNight).lerp(fogDay, live.day).lerp(fogDust, live.dust * live.day);
      fog.density = 0.011 + live.dust * 0.03;
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#e2b48a", "#5a2f1c", 0.8]} />
      <directionalLight
        ref={sun}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      >
        <orthographicCamera attach="shadow-camera" args={[-24, 24, 24, -24, 1, 140]} />
      </directionalLight>
    </>
  );
}

// --- Camera -----------------------------------------------------------------

const SHOTS: Record<Exclude<OutpostShot, "intro">, { pos: THREE.Vector3; look: THREE.Vector3 }> = {
  wide: { pos: new THREE.Vector3(13.5, 4.8, 16.5), look: new THREE.Vector3(-0.4, 1.3, 0.8) },
  shelter: { pos: new THREE.Vector3(-2.0, 2.8, 16.0), look: new THREE.Vector3(-5.2, 1.1, 6.4) },
  rover: { pos: new THREE.Vector3(11, 3.4, 17), look: new THREE.Vector3(11, 0.6, 8.4) },
  habitat: { pos: new THREE.Vector3(8.5, 2.6, 10), look: new THREE.Vector3(2.6, 1.3, 1.2) },
  result: { pos: new THREE.Vector3(18, 9, 20), look: new THREE.Vector3(0, 1, 1) },
};

function CameraRig({ shot, live }: { shot: OutpostShot; live: Live }) {
  const { camera, size, pointer } = useThree();
  const look = useRef(new THREE.Vector3(0, 30, 0));
  const introT = useRef(0);
  const goalPos = useMemo(() => new THREE.Vector3(), []);
  const goalLook = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    // Start by looking up at the Sun, then tilt down to the base.
    camera.position.set(16, 5.5, 20);
    look.current.copy(live.sunDir).multiplyScalar(60).add(camera.position);
    camera.lookAt(look.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(({ clock }, dt) => {
    introT.current += dt;
    const key = shot === "intro" ? "wide" : shot;
    const s = SHOTS[key];
    goalPos.copy(s.pos);
    goalLook.copy(s.look);
    if (key === "result") {
      const a = clock.elapsedTime * 0.07;
      goalPos.set(Math.cos(a + 0.9) * 20, 7, Math.sin(a + 0.9) * 20);
    }
    // Phones are tall: step back so the whole base fits.
    const aspect = size.width / size.height;
    if (aspect < 1.15) {
      const back = THREE.MathUtils.mapLinear(Math.max(aspect, 0.45), 0.45, 1.15, 1.7, 1.0);
      goalPos.sub(goalLook).multiplyScalar(back).add(goalLook);
    }
    // A little movement with the pointer so the scene feels like a place.
    goalPos.x += pointer.x * 0.9;
    goalPos.y += pointer.y * 0.35;
    const holdOnSun = shot === "intro" && introT.current < 0.9;
    const ease = introT.current < 4 ? 1.3 : 2.4;
    if (!holdOnSun) {
      dampVec(camera.position, goalPos, ease, dt);
      dampVec(look.current, goalLook, ease, dt);
    }
    camera.lookAt(look.current);
  });
  return null;
}

// --- Putting it together ----------------------------------------------------

function World({
  visual,
  shadows,
  onRoverDrag,
}: {
  visual: OutpostVisual;
  shadows: boolean;
  onRoverDrag?: (v: number) => void;
}) {
  const live = useMemo<Live>(() => {
    const sunDir = new THREE.Vector3();
    const day = sunDirectionForHour(visual.hour, sunDir);
    return {
      lifeSupport: visual.lifeSupport,
      shielding: visual.shielding,
      science: visual.science,
      battery: visual.battery,
      greenhouse: visual.greenhouse,
      storm: 0,
      dust: visual.dust ? 1 : 0,
      day,
      sunDir,
      stormDir: sunDir.clone().setY(Math.max(sunDir.y, 0.25)).normalize(),
    };
    // Initial values only; later changes are smoothed in useFrame below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const targetSun = useMemo(() => new THREE.Vector3(), []);
  const v = useRef(visual);
  v.current = visual;

  // Smooth every value so the scene eases to new game state and never jumps.
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);
    const t = v.current;
    live.lifeSupport = damp(live.lifeSupport, t.lifeSupport, 6, dt);
    live.shielding = damp(live.shielding, t.shielding, 6, dt);
    live.science = damp(live.science, t.science, 6, dt);
    live.battery = damp(live.battery, t.battery, 4, dt);
    live.greenhouse = damp(live.greenhouse, t.greenhouse, 3, dt);
    live.storm = damp(live.storm, t.storm, 3, dt);
    live.dust = damp(live.dust, t.dust ? 1 : 0, 2, dt);
    const day = sunDirectionForHour(t.hour, targetSun);
    live.day = damp(live.day, day, 2.5, dt);
    dampVec(live.sunDir, targetSun, 2.5, dt);
    live.sunDir.normalize();
    if (live.day > 0.2) {
      live.stormDir.copy(live.sunDir).setY(Math.max(live.sunDir.y, 0.25)).normalize();
    }
  });

  return (
    <>
      <Sky live={live} />
      <NightStars live={live} />
      <Lighting live={live} shadows={shadows} />
      <Ground />
      <Rocks />
      <RoverTrackMarks />
      <Habitat live={live} />
      <Greenhouse live={live} />
      <Shelter live={live} />
      <SolarArray live={live} />
      <BatteryPost live={live} />
      <Rover live={live} roverOut={visual.roverOut} />
      {onRoverDrag && <RoverDragPlane onRoverDrag={onRoverDrag} />}
      <Crew live={live} crewSheltered={visual.crewSheltered} />
      <Dust live={live} />
      <StormParticles live={live} />
      <CameraRig shot={visual.shot} live={live} />
    </>
  );
}

/** Lowers the pixel ratio when the frame rate stays low. */
function AdaptiveQuality({ max }: { max: number }) {
  const { gl } = useThree();
  const acc = useRef({ frames: 0, time: 0, dpr: max });
  useFrame((_, dt) => {
    const a = acc.current;
    a.frames++;
    a.time += dt;
    if (a.time < 2) return;
    const fps = a.frames / a.time;
    a.frames = 0;
    a.time = 0;
    if (fps < 28 && a.dpr > 0.75) a.dpr = Math.max(0.75, a.dpr - 0.25);
    else if (fps > 55 && a.dpr < max) a.dpr = Math.min(max, a.dpr + 0.25);
    else return;
    gl.setPixelRatio(a.dpr);
  });
  return null;
}

interface Props {
  visual: OutpostVisual;
  /** False when the scene is off screen or the tab is hidden. */
  active: boolean;
  /** Rover phase: drag the rover in the scene; reports a 0..1 distance. */
  onRoverDrag?: (v: number) => void;
}

export default function OutpostCanvas({ visual, active, onRoverDrag }: Props) {
  const small = isSmallScreen();
  const maxDpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
  return (
    <Canvas
      shadows={!small ? "soft" : true}
      dpr={maxDpr}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 40, near: 0.1, far: 900, position: [16, 5.5, 20] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.95;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <World visual={visual} shadows onRoverDrag={onRoverDrag} />
      <AdaptiveQuality max={maxDpr} />
    </Canvas>
  );
}
