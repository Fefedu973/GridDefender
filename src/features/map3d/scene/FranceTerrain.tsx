"use client";

import { Grid, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  CORSICA_OUTLINE,
  FRANCE_BOUNDS,
  FRANCE_OUTLINE,
  outlineToWorld,
  projectLonLat,
  type LonLat,
} from "@/features/map3d/geo/franceGeo";
import { EUROPE_NEIGHBOURS } from "@/features/map3d/geo/europeGeo";
import type { MapDefinition } from "@/game/domain/mapDefinition";

const LAND_DEPTH = 0.22;

function buildShape(world: Array<[number, number]>) {
  const shape = new THREE.Shape();
  world.forEach(([x, z], index) => {
    if (index === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  });
  shape.closePath();
  return shape;
}

interface LandmassProps {
  outline: Array<[number, number]>;
  depth?: number;
  bevel?: boolean;
  fill?: string;
  emissive?: string;
  emissiveIntensity?: number;
  fillOpacity?: number;
  rimColor?: string;
  rimWidth?: number;
  rimOpacity?: number;
  haloColor?: string;
  haloWidth?: number;
  haloOpacity?: number;
  rimY?: number;
  meshY?: number;
  shadows?: boolean;
}

function Landmass({
  outline,
  depth = LAND_DEPTH,
  bevel = true,
  fill = "#0a1c26",
  emissive = "#06141c",
  emissiveIntensity = 0.6,
  fillOpacity = 1,
  rimColor = "#7df9ff",
  rimWidth = 2.4,
  rimOpacity = 0.95,
  haloColor = "#22d3ee",
  haloWidth = 9,
  haloOpacity = 0.16,
  rimY = 0.04,
  meshY = 0,
  shadows = true,
}: LandmassProps) {
  const geometry = useMemo(() => {
    const shape = buildShape(outline);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevel,
      bevelSize: 0.03,
      bevelThickness: 0.05,
      bevelSegments: 2,
    });
    geo.computeVertexNormals();
    return geo;
  }, [outline, depth, bevel]);

  const rim = useMemo(
    () => outline.map(([x, z]) => [x, rimY, z] as [number, number, number]),
    [outline, rimY],
  );

  return (
    <group>
      <group rotation={[Math.PI / 2, 0, 0]} position={[0, meshY, 0]}>
        <mesh geometry={geometry} receiveShadow={shadows} castShadow={shadows}>
          <meshStandardMaterial
            color={fill}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            metalness={0.2}
            roughness={0.82}
            transparent={fillOpacity < 1}
            opacity={fillOpacity}
          />
        </mesh>
      </group>

      {rimOpacity > 0 && (
        <Line points={rim} color={rimColor} lineWidth={rimWidth} transparent opacity={rimOpacity} />
      )}
      {haloOpacity > 0 && (
        <Line points={rim} color={haloColor} lineWidth={haloWidth} transparent opacity={haloOpacity} />
      )}
    </group>
  );
}

function CommandFloor({ fadeDistance = 17 }: { fadeDistance?: number }) {
  return (
    <>
      <Grid
        position={[FRANCE_BOUNDS.centerX, -0.28, FRANCE_BOUNDS.centerZ]}
        args={[40, 40]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#0e3a44"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#12586a"
        fadeDistance={fadeDistance}
        fadeStrength={2.6}
        infiniteGrid
        followCamera={false}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[FRANCE_BOUNDS.centerX, -0.3, FRANCE_BOUNDS.centerZ]}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial color="#020a0f" transparent opacity={0.92} />
      </mesh>
    </>
  );
}

// Soft pool of lit sea around the French hero shape — gives the coast some depth
// without adding any clutter that would fight the grid infrastructure.
function SeaGlow({ radius = 6.4, color = "#0c3744" }: { radius?: number; color?: string }) {
  return (
    <group position={[FRANCE_BOUNDS.centerX, -0.255, FRANCE_BOUNDS.centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <circleGeometry args={[radius, 72]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[radius * 0.62, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

function FranceHero() {
  const france = useMemo(() => outlineToWorld(FRANCE_OUTLINE), []);
  const corsica = useMemo(() => outlineToWorld(CORSICA_OUTLINE), []);
  return (
    <group>
      <Landmass outline={france} />
      <Landmass outline={corsica} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Europe finale: real (Natural Earth) neighbour silhouettes ghosted behind the
// raised French hero, plus glowing cross-border interconnectors.
// ---------------------------------------------------------------------------

function GhostNeighbours() {
  const rings = useMemo(
    () =>
      EUROPE_NEIGHBOURS.flatMap((country) =>
        country.rings.map((ring, index) => ({
          key: `${country.name}-${index}`,
          world: outlineToWorld(ring),
        })),
      ),
    [],
  );

  return (
    <group>
      {rings.map((ring) => (
        <Landmass
          key={ring.key}
          outline={ring.world}
          depth={0.08}
          bevel={false}
          fill="#08161e"
          emissive="#0a2a36"
          emissiveIntensity={0.32}
          fillOpacity={0.86}
          rimColor="#2f6f82"
          rimWidth={1.2}
          rimOpacity={0.42}
          haloOpacity={0}
          rimY={0.01}
          meshY={-0.06}
          shadows={false}
        />
      ))}
    </group>
  );
}

interface EuropeLink {
  id: string;
  from: LonLat;
  to: LonLat;
  color: string;
}

// French border anchor -> neighbour hub. Reads as European solidarity / imports.
const EUROPE_LINKS: EuropeLink[] = [
  { id: "uk", from: [1.85, 50.95], to: [0.0, 51.3], color: "#7dd3fc" },
  { id: "benelux", from: [3.1, 50.5], to: [4.9, 52.0], color: "#34f5b0" },
  { id: "germany", from: [7.7, 48.6], to: [8.68, 50.11], color: "#9bdcff" },
  { id: "alpine", from: [6.1, 45.9], to: [9.19, 45.46], color: "#2dd4bf" },
  { id: "italy", from: [7.5, 43.7], to: [8.95, 44.4], color: "#38bdf8" },
  { id: "iberia", from: [-1.78, 43.35], to: [-2.93, 43.26], color: "#ffd447" },
];

function FlowPulse({ curve, color, phase }: { curve: THREE.QuadraticBezierCurve3; color: string; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = (state.clock.elapsedTime * 0.16 + phase) % 1;
    ref.current.position.copy(curve.getPoint(t));
    const scale = 0.7 + Math.sin(t * Math.PI) * 0.6;
    ref.current.scale.setScalar(scale);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.05, 12, 10]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

function EuropeInterconnectors() {
  const links = useMemo(
    () =>
      EUROPE_LINKS.map((link, index) => {
        const [ax, az] = projectLonLat(link.from);
        const [bx, bz] = projectLonLat(link.to);
        const start = new THREE.Vector3(ax, 0.12, az);
        const end = new THREE.Vector3(bx, 0.12, bz);
        const lift = Math.min(1.05, 0.32 + start.distanceTo(end) * 0.2);
        const mid = new THREE.Vector3((ax + bx) / 2, 0.12 + lift, (az + bz) / 2);
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        return {
          ...link,
          curve,
          points: curve.getPoints(30),
          terminal: [bx, 0.02, bz] as [number, number, number],
          phase: index / EUROPE_LINKS.length,
        };
      }),
    [],
  );

  return (
    <group>
      {links.map((link) => (
        <group key={link.id}>
          <Line points={link.points} color={link.color} lineWidth={7} transparent opacity={0.12} />
          <Line points={link.points} color={link.color} lineWidth={2.2} transparent opacity={0.7} />
          <FlowPulse curve={link.curve} color={link.color} phase={link.phase} />
          <group position={link.terminal} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh>
              <ringGeometry args={[0.08, 0.12, 28]} />
              <meshBasicMaterial color={link.color} transparent opacity={0.6} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0, 0.001]}>
              <circleGeometry args={[0.05, 18]} />
              <meshBasicMaterial color={link.color} transparent opacity={0.85} depthWrite={false} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

function EuropeTerrain() {
  return (
    <group>
      <CommandFloor fadeDistance={26} />
      <SeaGlow radius={9.2} color="#0a2f3c" />
      <GhostNeighbours />
      <FranceHero />
      <EuropeInterconnectors />
    </group>
  );
}

// ---------------------------------------------------------------------------
// VivaTech expo floor: a flat, graphic exhibition-hall plan (booth footprints,
// aisles, a stage and ambient light pools) — no toy 3D furniture, so it stays
// readable once the microgrid infrastructure is dropped on top.
// ---------------------------------------------------------------------------

function roundedRect(w: number, d: number, r: number): Array<[number, number]> {
  const hw = w / 2;
  const hd = d / 2;
  const rr = Math.min(r, hw, hd);
  const seg = 4;
  const pts: Array<[number, number]> = [];
  const arc = (cx: number, cz: number, start: number) => {
    for (let i = 0; i <= seg; i++) {
      const a = start + (Math.PI / 2) * (i / seg);
      pts.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]);
    }
  };
  arc(hw - rr, hd - rr, 0);
  arc(-(hw - rr), hd - rr, Math.PI / 2);
  arc(-(hw - rr), -(hd - rr), Math.PI);
  arc(hw - rr, -(hd - rr), Math.PI * 1.5);
  return pts;
}

interface FloorPlotProps {
  cx: number;
  cz: number;
  w: number;
  d: number;
  r?: number;
  color: string;
  fillOpacity?: number;
  lineOpacity?: number;
  lineWidth?: number;
  y?: number;
}

function FloorPlot({
  cx,
  cz,
  w,
  d,
  r = 0.08,
  color,
  fillOpacity = 0.05,
  lineOpacity = 0.5,
  lineWidth = 1.4,
  y = 0.02,
}: FloorPlotProps) {
  const local = useMemo(() => roundedRect(w, d, r), [w, d, r]);
  const outline = useMemo(
    () => [...local, local[0]].map(([x, z]) => [cx + x, y, cz + z] as [number, number, number]),
    [local, cx, cz, y],
  );
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    local.forEach(([x, z], index) => (index ? shape.lineTo(x, z) : shape.moveTo(x, z)));
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [local]);

  return (
    <group>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[cx, y - 0.006, cz]}>
        <meshBasicMaterial color={color} transparent opacity={fillOpacity} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Line points={outline} color={color} lineWidth={lineWidth} transparent opacity={lineOpacity} />
    </group>
  );
}

function LightPool({ cx, cz, radius, color, opacity = 0.1 }: { cx: number; cz: number; radius: number; color: string; opacity?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.012, cz]}>
      <circleGeometry args={[radius, 48]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

const CYAN = "#22d3ee";
const MAGENTA = "#ff2f8f";
const GREEN = "#34f5b0";

const EXPO_BOOTHS: Array<{ id: string; cx: number; cz: number; w: number; d: number; color: string }> = [
  { id: "back-1", cx: -1.7, cz: -1.28, w: 0.9, d: 0.6, color: CYAN },
  { id: "back-2", cx: -0.6, cz: -1.32, w: 0.9, d: 0.56, color: GREEN },
  { id: "back-3", cx: 0.6, cz: -1.32, w: 0.9, d: 0.56, color: CYAN },
  { id: "back-4", cx: 1.7, cz: -1.28, w: 0.9, d: 0.6, color: MAGENTA },
  { id: "left", cx: -1.95, cz: 0.1, w: 0.6, d: 1.0, color: GREEN },
  { id: "right", cx: 1.95, cz: 0.1, w: 0.6, d: 1.0, color: CYAN },
  { id: "front-1", cx: -1.35, cz: 1.2, w: 0.85, d: 0.55, color: MAGENTA },
  { id: "front-2", cx: 1.35, cz: 1.2, w: 0.85, d: 0.55, color: GREEN },
];

function ExpoStage() {
  const arc = useMemo(() => {
    const pts: Array<[number, number, number]> = [];
    const seg = 28;
    for (let i = 0; i <= seg; i++) {
      const a = Math.PI + (Math.PI * i) / seg; // facing inward (-z side toward center)
      pts.push([Math.cos(a) * 1.15, 0.03, 1.55 + Math.sin(a) * 0.32]);
    }
    return pts;
  }, []);
  return (
    <group>
      <FloorPlot cx={0} cz={1.62} w={2.5} d={0.5} r={0.16} color={MAGENTA} fillOpacity={0.05} lineOpacity={0.55} lineWidth={1.8} />
      <Line points={arc} color={MAGENTA} lineWidth={2.4} transparent opacity={0.7} />
    </group>
  );
}

function ExpoFloorTerrain() {
  const slabRim = useMemo(
    () =>
      [
        [-2.25, 0.04, -1.55],
        [2.25, 0.04, -1.55],
        [2.45, 0.04, 1.35],
        [1.55, 0.04, 2.0],
        [-1.8, 0.04, 1.75],
        [-2.45, 0.04, 0.95],
        [-2.25, 0.04, -1.55],
      ] as Array<[number, number, number]>,
    [],
  );

  const aisleH = useMemo(
    () =>
      [
        [-2.1, 0.018, 0],
        [2.1, 0.018, 0],
      ] as Array<[number, number, number]>,
    [],
  );
  const aisleV = useMemo(
    () =>
      [
        [0, 0.018, -1.45],
        [0, 0.018, 1.45],
      ] as Array<[number, number, number]>,
    [],
  );

  return (
    <group>
      <CommandFloor fadeDistance={11} />

      {/* Hall slab + perimeter glow. */}
      <mesh position={[0, -0.08, 0.18]} receiveShadow castShadow>
        <boxGeometry args={[4.9, 0.18, 3.75]} />
        <meshStandardMaterial color="#0a1c26" emissive="#06141c" emissiveIntensity={0.75} roughness={0.82} metalness={0.18} />
      </mesh>

      {/* Ambient colour pools for salon atmosphere. */}
      <LightPool cx={-1.85} cz={-1.3} radius={1.0} color={CYAN} opacity={0.08} />
      <LightPool cx={1.95} cz={-1.0} radius={0.95} color={GREEN} opacity={0.07} />
      <LightPool cx={0.1} cz={1.6} radius={0.85} color={MAGENTA} opacity={0.05} />

      {/* Exhibition hall outline + stand plots + aisles. */}
      <FloorPlot cx={0.1} cz={0.18} w={4.45} d={3.35} r={0.28} color={CYAN} fillOpacity={0} lineOpacity={0.28} lineWidth={1.2} y={0.026} />
      {EXPO_BOOTHS.map((booth) => (
        <FloorPlot key={booth.id} cx={booth.cx} cz={booth.cz} w={booth.w} d={booth.d} color={booth.color} fillOpacity={0.07} lineOpacity={0.5} />
      ))}
      <Line points={aisleH} color={CYAN} lineWidth={1.1} transparent opacity={0.34} />
      <Line points={aisleV} color={CYAN} lineWidth={1.1} transparent opacity={0.34} />
      <ExpoStage />

      <Line points={slabRim} color="#7df9ff" lineWidth={2.6} transparent opacity={0.95} />
      <Line points={slabRim} color="#22d3ee" lineWidth={10} transparent opacity={0.16} />
    </group>
  );
}

function IslandTerrain() {
  const island = useMemo(
    () =>
      [
        [-1.05, -1.85],
        [-0.25, -2.15],
        [0.85, -1.65],
        [1.25, -0.65],
        [1.0, 0.35],
        [0.48, 1.55],
        [-0.2, 2.1],
        [-0.95, 1.55],
        [-1.25, 0.25],
        [-1.05, -1.85],
      ] as Array<[number, number]>,
    [],
  );

  return (
    <group>
      <CommandFloor fadeDistance={12} />
      <Landmass outline={island} />
    </group>
  );
}

export function FranceTerrain({ map }: { map?: MapDefinition }) {
  if (map?.terrain === "microgrid") return <ExpoFloorTerrain />;
  if (map?.terrain === "island") return <IslandTerrain />;
  if (map?.terrain === "europe") return <EuropeTerrain />;

  return (
    <group>
      <CommandFloor />
      <SeaGlow />
      <FranceHero />
    </group>
  );
}
