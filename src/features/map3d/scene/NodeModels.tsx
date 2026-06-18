"use client";

import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import * as THREE from "three";
import type { GridNode } from "@/game/network/networkTypes";
import { nodeKindColor } from "@/features/map3d/scene/visuals";

/* ================================================================== */
/* Shared looping-animation primitives.                                */
/* Every model leans on these so the whole grid breathes with one      */
/* coherent rhythm and easing — only the parameters change per kind.   */
/* ================================================================== */

type Vec3 = [number, number, number];

/** Deterministic 0..1 phase seed from a node id, so idle pulses never beat in unison. */
function seedFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return (hash % 997) / 997;
}

function asBasic(child: THREE.Object3D) {
  return (child as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
}

/** Soft puffs that rise, swell and fade on a loop — steam (nuclear) or smoke (factory). */
function RisingPuffs({
  origins,
  perOrigin,
  rise,
  radius,
  color,
  opacity,
  speed,
  drift = 0.04,
  seed = 0,
}: {
  origins: Vec3[];
  perOrigin: number;
  rise: number;
  radius: number;
  color: string;
  opacity: number;
  speed: number;
  drift?: number;
  seed?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const puffs = useMemo(
    () =>
      origins.flatMap((origin, o) =>
        Array.from({ length: perOrigin }, (_, i) => ({
          origin,
          offset: o * 0.41 + i / perOrigin,
        })),
      ),
    [origins, perOrigin],
  );

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const t = clock.elapsedTime * speed + seed;
    group.children.forEach((child, index) => {
      const puff = puffs[index];
      const phase = (t + puff.offset) % 1;
      const [ox, oy, oz] = puff.origin;
      child.position.set(
        ox + Math.sin(phase * Math.PI * 2 + index) * drift,
        oy + phase * rise,
        oz + Math.cos(phase * Math.PI * 1.6 + index) * drift * 0.6,
      );
      child.scale.setScalar(0.45 + phase * 1.15);
      const material = asBasic(child);
      if (material) material.opacity = opacity * Math.sin(phase * Math.PI);
    });
  });

  return (
    <group ref={groupRef}>
      {puffs.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[radius, 12, 10]} />
          <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Continuously rotates its children around one axis (fans, gyros, rotors). */
function Spinner({
  speed = 1,
  axis = "y",
  position,
  rotation,
  children,
}: {
  speed?: number;
  axis?: "x" | "y" | "z";
  position?: Vec3;
  rotation?: Vec3;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    if (axis === "x") g.rotation.x += delta * speed;
    else if (axis === "z") g.rotation.z += delta * speed;
    else g.rotation.y += delta * speed;
  });
  return (
    <group ref={ref} position={position} rotation={rotation}>
      {children}
    </group>
  );
}

/** Flickers each child mesh's opacity pseudo-randomly — windows, LEDs, status diodes. */
function Twinkle({
  speed = 1,
  min = 0.15,
  max = 0.9,
  seed = 0,
  position,
  children,
}: {
  speed?: number;
  min?: number;
  max?: number;
  seed?: number;
  position?: Vec3;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime * speed + seed * 6.2831;
    g.children.forEach((child, i) => {
      const wave = Math.sin(t * 1.9 + i * 1.7) * 0.6 + Math.sin(t * 0.7 + i * 4.1) * 0.4;
      const value = min + (max - min) * (0.5 + 0.5 * wave);
      const material = asBasic(child);
      if (material) material.opacity = value;
    });
  });
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

/** Single synchronized breath shared across children — opacity and/or scale. */
function Pulse({
  speed = 1,
  min = 0.3,
  max = 1,
  scale,
  seed = 0,
  position,
  rotation,
  children,
}: {
  speed?: number;
  min?: number;
  max?: number;
  scale?: [number, number];
  seed?: number;
  position?: Vec3;
  rotation?: Vec3;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const breath = 0.5 + 0.5 * Math.sin(clock.elapsedTime * speed + seed * 6.2831);
    g.children.forEach((child) => {
      const material = asBasic(child);
      if (material) material.opacity = min + (max - min) * breath;
      if (scale) child.scale.setScalar(scale[0] + (scale[1] - scale[0]) * breath);
    });
  });
  return (
    <group ref={ref} position={position} rotation={rotation}>
      {children}
    </group>
  );
}

/** A bright bead that travels along a vertical span and loops — transmission energy. */
function TravelingBead({
  from,
  to,
  radius,
  color,
  speed,
  seed = 0,
}: {
  from: Vec3;
  to: Vec3;
  radius: number;
  color: string;
  speed: number;
  seed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const phase = (clock.elapsedTime * speed + seed) % 1;
    mesh.position.set(
      from[0] + (to[0] - from[0]) * phase,
      from[1] + (to[1] - from[1]) * phase,
      from[2] + (to[2] - from[2]) * phase,
    );
    const env = Math.sin(phase * Math.PI);
    mesh.scale.setScalar(0.6 + env * 0.8);
    (mesh.material as THREE.MeshBasicMaterial).opacity = 0.2 + env * 0.7;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[radius, 10, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/** A bar that fills bottom-to-top on a sawtooth loop — battery / EV charging. */
function ChargeFill({
  width,
  height,
  depth,
  baseY,
  color,
  speed,
  seed = 0,
  position = [0, 0, 0],
}: {
  width: number;
  height: number;
  depth: number;
  baseY: number;
  color: string;
  speed: number;
  seed?: number;
  position?: Vec3;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const fill = (clock.elapsedTime * speed + seed) % 1;
    mesh.scale.y = Math.max(0.001, fill);
    mesh.position.y = baseY + (height * fill) / 2;
    (mesh.material as THREE.MeshBasicMaterial).opacity = 0.4 + (1 - Math.abs(fill - 0.5) * 2) * 0.5;
  });
  return (
    <mesh ref={ref} position={[position[0], baseY, position[2]]}>
      <boxGeometry args={[width, height, depth]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} depthWrite={false} />
    </mesh>
  );
}

/* ================================================================== */
/* Per-kind stylised infrastructure models (a few primitives each).    */
/* ================================================================== */

function CoolingTower({ color, seed }: { color: string; seed: number }) {
  return (
    <group>
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <boxGeometry args={[0.46, 0.05, 0.28]} />
        <meshStandardMaterial color="#071a18" emissive={color} emissiveIntensity={0.16} roughness={0.72} />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.105, 0.14, 0.36, 28, 1, true]} />
            <meshStandardMaterial
              color="#0b2e22"
              emissive={color}
              emissiveIntensity={0.48}
              side={THREE.DoubleSide}
              roughness={0.62}
              metalness={0.08}
            />
          </mesh>
        </group>
      ))}
      {/* Reactor rims softly breathe to read as an active core. */}
      <Pulse speed={1.4} min={0.4} max={0.85} seed={seed}>
        {[-0.12, 0.12].map((x) => (
          <mesh key={x} position={[x, 0.39, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.103, 0.008, 8, 28]} />
            <meshBasicMaterial color={color} transparent opacity={0.7} />
          </mesh>
        ))}
      </Pulse>
      {/* Looping steam plumes rising from each tower. */}
      <RisingPuffs
        origins={[
          [-0.12, 0.42, 0],
          [0.12, 0.42, 0],
        ]}
        perOrigin={3}
        rise={0.34}
        radius={0.058}
        color="#dfffee"
        opacity={0.34}
        speed={0.22}
        seed={seed}
      />
      <mesh position={[0, 0.12, -0.12]} castShadow>
        <boxGeometry args={[0.22, 0.18, 0.12]} />
        <meshStandardMaterial color="#0a241f" emissive={color} emissiveIntensity={0.38} roughness={0.55} />
      </mesh>
    </group>
  );
}

function DataCenter({ color, compact, seed }: { color: string; compact: boolean; seed: number }) {
  if (compact) {
    return (
      <group>
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <boxGeometry args={[0.25, 0.04, 0.18]} />
          <meshStandardMaterial color="#04141d" emissive={color} emissiveIntensity={0.14} metalness={0.35} roughness={0.48} />
        </mesh>
        <mesh position={[-0.03, 0.12, 0]} castShadow>
          <boxGeometry args={[0.14, 0.16, 0.12]} />
          <meshStandardMaterial color="#05212d" emissive={color} emissiveIntensity={0.42} metalness={0.55} roughness={0.28} />
        </mesh>
        <mesh position={[0.08, 0.09, 0.01]} castShadow>
          <boxGeometry args={[0.08, 0.1, 0.1]} />
          <meshStandardMaterial color="#061923" emissive={color} emissiveIntensity={0.26} metalness={0.48} roughness={0.35} />
        </mesh>
        {/* Server diodes flicker like live compute. */}
        <Twinkle speed={2.2} min={0.2} max={0.95} seed={seed}>
          {[0.075, 0.11, 0.145].map((y) => (
            <mesh key={y} position={[-0.03, y, 0.064]}>
              <boxGeometry args={[0.09, 0.01, 0.008]} />
              <meshBasicMaterial color={color} transparent opacity={0.68} />
            </mesh>
          ))}
        </Twinkle>
        <mesh position={[0.075, 0.16, -0.02]} rotation={[0, 0, -0.18]}>
          <cylinderGeometry args={[0.004, 0.006, 0.11, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.75} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <boxGeometry args={[0.42, 0.05, 0.28]} />
        <meshStandardMaterial color="#04141d" emissive={color} emissiveIntensity={0.13} metalness={0.35} roughness={0.48} />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.105, 0.01]} castShadow>
          <boxGeometry args={[0.16, 0.16, 0.2]} />
          <meshStandardMaterial color="#04222e" emissive={color} emissiveIntensity={0.34} metalness={0.58} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.14, -0.05]} castShadow>
        <boxGeometry args={[0.12, 0.22, 0.14]} />
        <meshStandardMaterial color="#061923" emissive={color} emissiveIntensity={0.26} metalness={0.55} roughness={0.31} />
      </mesh>
      {[-0.16, -0.06, 0.06, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.195, 0.01]}>
          <boxGeometry args={[0.04, 0.016, 0.09]} />
          <meshBasicMaterial color={color} transparent opacity={0.36} />
        </mesh>
      ))}
      {/* Rack status LEDs scan to read as live compute load. */}
      <Twinkle speed={2}  min={0.16} max={0.85} seed={seed}>
        {[-0.12, 0, 0.12].flatMap((x) =>
          [0.08, 0.12, 0.16].map((y) => (
            <mesh key={`${x}-${y}`} position={[x, y, 0.112]}>
              <boxGeometry args={[0.04, 0.011, 0.008]} />
              <meshBasicMaterial color={color} transparent opacity={0.56} />
            </mesh>
          )),
        )}
      </Twinkle>
      {/* Slow rooftop cooling fan — parent lays it flat, Spinner turns it
          around the disc normal (Z) so the blades sweep in-plane. */}
      <group position={[0, 0.247, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <Spinner speed={1.6} axis="z">
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation={[0, 0, (i / 3) * Math.PI * 2]}>
              <boxGeometry args={[0.09, 0.014, 0.004]} />
              <meshBasicMaterial color={color} transparent opacity={0.5} />
            </mesh>
          ))}
        </Spinner>
      </group>
      <mesh position={[0, 0.245, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.055, 0.005, 8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.52} />
      </mesh>
    </group>
  );
}

function BatteryStack({ color, seed }: { color: string; seed: number }) {
  const cells: number[] = [-0.15, 0, 0.15];
  return (
    <group>
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[0.44, 0.05, 0.24]} />
        <meshStandardMaterial color="#120b25" emissive={color} emissiveIntensity={0.16} roughness={0.5} />
      </mesh>
      {cells.map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.16, 0]} castShadow>
            <boxGeometry args={[0.11, 0.26, 0.17]} />
            <meshStandardMaterial color="#1e1140" emissive={color} emissiveIntensity={0.55} metalness={0.42} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.305, 0]}>
            <boxGeometry args={[0.075, 0.018, 0.12]} />
            <meshBasicMaterial color={color} transparent opacity={0.75 - i * 0.08} />
          </mesh>
          {/* Charge level climbing on the front face of each cell. */}
          <ChargeFill
            width={0.07}
            height={0.2}
            depth={0.006}
            baseY={0.06}
            color={color}
            speed={0.16}
            seed={seed + i * 0.22}
            position={[0, 0, 0.088]}
          />
        </group>
      ))}
      <mesh position={[0, 0.12, 0.102]}>
        <boxGeometry args={[0.36, 0.022, 0.012]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function SolarArray({ color, seed }: { color: string; seed: number }) {
  const trackerRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (trackerRef.current) {
      // Gentle sun-tracking sway shared by every panel.
      trackerRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.32 + seed * 6.2831) * 0.16;
    }
  });
  return (
    <group>
      <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.24, 0.25, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} />
      </mesh>
      <group ref={trackerRef}>
        {[-0.16, 0, 0.16].map((x) => (
          <group key={x} position={[x, 0.1, 0]} rotation={[-Math.PI / 5, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.13, 0.014, 0.2]} />
              <meshStandardMaterial color="#171307" emissive={color} emissiveIntensity={0.48} metalness={0.5} roughness={0.28} />
            </mesh>
            <mesh position={[0, 0.009, 0]}>
              <boxGeometry args={[0.012, 0.006, 0.19]} />
              <meshBasicMaterial color={color} transparent opacity={0.42} />
            </mesh>
            <mesh position={[0, -0.06, 0.05]} rotation={[Math.PI / 5, 0, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.13, 6]} />
              <meshStandardMaterial color="#3f3513" emissive={color} emissiveIntensity={0.18} roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function WindTurbine({ color, seed }: { color: string; seed: number }) {
  const bladesRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (bladesRef.current) bladesRef.current.rotation.z += delta * 1.05;
  });

  return (
    <group>
      <mesh position={[0, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.032, 0.52, 12]} />
        <meshStandardMaterial color="#dbeafe" emissive={color} emissiveIntensity={0.25} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.52, 0.035]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.038, 0.046, 0.11, 12]} />
        <meshStandardMaterial color="#e5f7ff" emissive={color} emissiveIntensity={0.32} roughness={0.3} />
      </mesh>
      {/* Aviation warning light blinking at the nacelle. */}
      <Pulse speed={3.4} min={0.1} max={1} scale={[0.7, 1.25]} seed={seed} position={[0, 0.57, 0.01]}>
        <mesh>
          <sphereGeometry args={[0.016, 8, 8]} />
          <meshBasicMaterial color="#ff4d5e" transparent opacity={0.8} />
        </mesh>
      </Pulse>
      <group ref={bladesRef} position={[0, 0.52, 0.096]}>
        <mesh castShadow>
          <sphereGeometry args={[0.035, 14, 10]} />
          <meshStandardMaterial color="#f8feff" emissive={color} emissiveIntensity={0.45} roughness={0.22} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, 0, (i / 3) * Math.PI * 2]}>
            <mesh position={[0, 0.13, 0]} rotation={[0, 0, -0.08]} castShadow>
              <coneGeometry args={[0.032, 0.24, 3, 1, false]} />
              <meshStandardMaterial color="#e7fbff" emissive={color} emissiveIntensity={0.42} roughness={0.26} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function Hospital({ color, seed }: { color: string; seed: number }) {
  return (
    <group>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.4, 0.06, 0.34]} />
        <meshStandardMaterial color="#190709" emissive={color} emissiveIntensity={0.18} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.28, 0.3, 0.22]} />
        <meshStandardMaterial color="#2a0a0a" emissive={color} emissiveIntensity={0.36} roughness={0.42} />
      </mesh>
      <mesh position={[0.16, 0.13, 0]} castShadow>
        <boxGeometry args={[0.12, 0.2, 0.18]} />
        <meshStandardMaterial color="#22080a" emissive={color} emissiveIntensity={0.26} roughness={0.48} />
      </mesh>
      {/* The emergency cross gently glows. */}
      <Pulse speed={1.8} min={0.55} max={1} seed={seed}>
        <mesh position={[0, 0.33, 0.112]}>
          <boxGeometry args={[0.13, 0.04, 0.012]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={1} />
        </mesh>
        <mesh position={[0, 0.33, 0.112]}>
          <boxGeometry args={[0.04, 0.13, 0.012]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={1} />
        </mesh>
      </Pulse>
      {/* Rooftop helipad beacon blink. */}
      <Pulse speed={4.6} min={0.1} max={1} scale={[0.6, 1.3]} seed={seed + 0.3} position={[-0.1, 0.345, 0.06]}>
        <mesh>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color="#ff5d6c" transparent opacity={0.85} />
        </mesh>
      </Pulse>
    </group>
  );
}

function CityCluster({ color, seed }: { color: string; seed: number }) {
  const buildings = [
    { h: 0.34, x: -0.15, z: 0.05, w: 0.09 },
    { h: 0.24, x: -0.03, z: -0.1, w: 0.08 },
    { h: 0.44, x: 0.11, z: 0.02, w: 0.1 },
    { h: 0.28, x: 0.03, z: 0.14, w: 0.075 },
    { h: 0.18, x: 0.18, z: -0.1, w: 0.07 },
  ];
  // A handful of lit windows per building, twinkling on a loop.
  const windows = useMemo(
    () =>
      buildings.flatMap((b, bi) =>
        [0.3, 0.55, 0.8].map((ratio, wi) => ({
          key: `${bi}-${wi}`,
          x: b.x + (wi - 1) * b.w * 0.28,
          y: b.h * ratio,
          z: b.z + b.w / 2 + 0.001,
          w: b.w * 0.22,
        })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    <group>
      <mesh position={[0.02, 0.015, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.27, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
      {buildings.map((building, i) => (
        <mesh key={i} position={[building.x, building.h / 2, building.z]} castShadow>
          <boxGeometry args={[building.w, building.h, building.w]} />
          <meshStandardMaterial color="#0a1830" emissive={color} emissiveIntensity={0.34} roughness={0.52} />
        </mesh>
      ))}
      <Twinkle speed={1.5} min={0.08} max={0.95} seed={seed}>
        {windows.map((win) => (
          <mesh key={win.key} position={[win.x, win.y, win.z]}>
            <boxGeometry args={[win.w, win.w * 0.7, 0.006]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
          </mesh>
        ))}
      </Twinkle>
      {buildings.slice(0, 3).map((building, i) => (
        <mesh key={`roof-${i}`} position={[building.x, building.h + 0.012, building.z]}>
          <boxGeometry args={[building.w * 0.72, 0.012, building.w * 0.72]} />
          <meshBasicMaterial color={color} transparent opacity={0.38} />
        </mesh>
      ))}
    </group>
  );
}

function Factory({ color, seed }: { color: string; seed: number }) {
  return (
    <group>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.44, 0.06, 0.28]} />
        <meshStandardMaterial color="#090e14" emissive={color} emissiveIntensity={0.12} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.34, 0.24, 0.22]} />
        <meshStandardMaterial color="#11161f" emissive={color} emissiveIntensity={0.26} roughness={0.58} />
      </mesh>
      <mesh position={[-0.08, 0.29, 0]} rotation={[0, 0, -0.28]} castShadow>
        <boxGeometry args={[0.18, 0.08, 0.22]} />
        <meshStandardMaterial color="#161e28" emissive={color} emissiveIntensity={0.22} roughness={0.55} />
      </mesh>
      {/* Furnace vent glowing through the wall. */}
      <Pulse speed={1.1} min={0.25} max={0.7} seed={seed} position={[0.1, 0.12, 0.111]}>
        <mesh>
          <boxGeometry args={[0.08, 0.08, 0.006]} />
          <meshBasicMaterial color="#ff8a3a" transparent opacity={0.5} />
        </mesh>
      </Pulse>
      {[-0.08, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.35, -0.05]} castShadow>
          <cylinderGeometry args={[0.025, 0.033, 0.28, 12]} />
          <meshStandardMaterial color="#1b222c" emissive={color} emissiveIntensity={0.32} roughness={0.42} />
        </mesh>
      ))}
      {/* Smoke drifting up from both stacks. */}
      <RisingPuffs
        origins={[
          [-0.08, 0.5, -0.05],
          [0.06, 0.5, -0.05],
        ]}
        perOrigin={3}
        rise={0.3}
        radius={0.045}
        color="#9fb0bd"
        opacity={0.26}
        speed={0.2}
        seed={seed}
      />
    </group>
  );
}

function Pylon({ color, seed }: { color: string; seed: number }) {
  return (
    <group>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.06, 8]} />
        <meshStandardMaterial color="#281a06" emissive={color} emissiveIntensity={0.22} metalness={0.35} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.016, 0.035, 0.34, 8]} />
        <meshStandardMaterial color="#3a2606" emissive={color} emissiveIntensity={0.45} metalness={0.55} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.34, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.34, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.78} />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.31, 0]} rotation={[0.45, 0, 0]}>
          <sphereGeometry args={[0.026, 10, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.58} />
        </mesh>
      ))}
      {/* Slowly turning interconnect gyro ring. */}
      <Spinner speed={0.6} axis="y" position={[0, 0.18, 0]} rotation={[0, 0, Math.PI / 4]}>
        <mesh>
          <torusGeometry args={[0.12, 0.01, 8, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.32} />
        </mesh>
      </Spinner>
      {/* Energy bead climbing the mast — power moving across the interconnect. */}
      <TravelingBead from={[0, 0.06, 0]} to={[0, 0.34, 0]} radius={0.02} color={color} speed={0.5} seed={seed} />
    </group>
  );
}

function ChargeStation({ color, seed }: { color: string; seed: number }) {
  const segments = [0.252, 0.266, 0.28, 0.294];
  const fillRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = fillRef.current;
    if (!g) return;
    const fill = (clock.elapsedTime * 0.35 + seed) % 1;
    g.children.forEach((child, i) => {
      const lit = fill > i / segments.length ? 1 : 0.12;
      const material = asBasic(child);
      if (material) material.opacity = lit;
    });
  });
  return (
    <group>
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[0.24, 0.05, 0.18]} />
        <meshStandardMaterial color="#1d1705" emissive={color} emissiveIntensity={0.16} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.12, 0.32, 0.1]} />
        <meshStandardMaterial color="#2a2206" emissive={color} emissiveIntensity={0.42} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.27, 0.055]}>
        <boxGeometry args={[0.078, 0.055, 0.012]} />
        <meshBasicMaterial color="#0c0a02" />
      </mesh>
      {/* Charge meter filling segment by segment. */}
      <group ref={fillRef}>
        {segments.map((y) => (
          <mesh key={y} position={[0, y, 0.062]}>
            <boxGeometry args={[0.06, 0.009, 0.006]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} />
          </mesh>
        ))}
      </group>
      <mesh position={[0.08, 0.22, 0.02]} rotation={[0, 0, -0.48]}>
        <torusGeometry args={[0.055, 0.006, 8, 20]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      {/* Connector plug pulses while charging. */}
      <Pulse speed={2.6} min={0.4} max={0.95} seed={seed} position={[0.11, 0.155, 0.02]}>
        <mesh>
          <boxGeometry args={[0.034, 0.07, 0.018]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
      </Pulse>
    </group>
  );
}

function NodeStructure({ node }: { node: GridNode }) {
  const color = nodeKindColor(node.kind);
  const seed = seedFromId(node.id);
  switch (node.kind) {
    case "nuclear":
      return <CoolingTower color={color} seed={seed} />;
    case "datacenter":
      return (
        <group scale={node.id === "grenoble-ai-edge" ? 0.86 : 0.9}>
          <DataCenter color={color} compact={node.id === "grenoble-ai-edge"} seed={seed} />
        </group>
      );
    case "battery":
      return <BatteryStack color={color} seed={seed} />;
    case "solar":
      return <SolarArray color={color} seed={seed} />;
    case "wind":
      return <WindTurbine color={color} seed={seed} />;
    case "hospital":
      return <Hospital color={color} seed={seed} />;
    case "city":
      return <CityCluster color={color} seed={seed} />;
    case "industry":
      return <Factory color={color} seed={seed} />;
    case "interconnect":
      return <Pylon color={color} seed={seed} />;
    case "ev":
      return <ChargeStation color={color} seed={seed} />;
    default:
      return <CityCluster color={color} seed={seed} />;
  }
}

export const MemoNodeStructure = memo(
  NodeStructure,
  (prev, next) => prev.node.id === next.node.id && prev.node.kind === next.node.kind,
);

MemoNodeStructure.displayName = "MemoNodeStructure";
