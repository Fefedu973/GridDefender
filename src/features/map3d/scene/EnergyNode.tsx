"use client";

import { Html } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import type { GridNode } from "@/game/network/networkTypes";
import { nodeKindColor, nodeStatusColor } from "@/features/map3d/scene/visuals";
import { formatMw } from "@/lib/format";

interface EnergyNodeProps {
  node: GridNode;
  selected: boolean;
  onSelect: () => void;
}

const PRIMARY_KINDS = new Set(["datacenter", "nuclear", "battery", "hospital", "interconnect"]);

/* ------------------------------------------------------------------ */
/* Per-kind stylised infrastructure models (a few primitives each).   */
/* ------------------------------------------------------------------ */

function CoolingTower({ color }: { color: string }) {
  return (
    <group>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.17, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.13, 0.34, 20, 1, true]} />
          <meshStandardMaterial color="#0b2e22" emissive={color} emissiveIntensity={0.7} side={THREE.DoubleSide} roughness={0.5} />
        </mesh>
      ))}
      {[-0.12, 0.12].map((x) => (
        <mesh key={`steam-${x}`} position={[x, 0.36, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function DataMonolith({ color, pulse }: { color: string; pulse: number }) {
  return (
    <group>
      <mesh position={[0, 0.24, 0]} castShadow>
        <boxGeometry args={[0.26, 0.48, 0.26]} />
        <meshStandardMaterial color="#04222e" emissive={color} emissiveIntensity={0.35 + pulse * 0.5} metalness={0.6} roughness={0.25} />
      </mesh>
      {[0.12, 0.24, 0.36].map((y) => (
        <mesh key={y} position={[0, y, 0.135]}>
          <boxGeometry args={[0.2, 0.022, 0.01]} />
          <meshBasicMaterial color={color} transparent opacity={0.6 + pulse * 0.4} />
        </mesh>
      ))}
    </group>
  );
}

function BatteryStack({ color }: { color: string }) {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[(i - 1) * 0.13, 0.1, 0]} castShadow>
          <boxGeometry args={[0.1, 0.2, 0.16]} />
          <meshStandardMaterial color="#1e1140" emissive={color} emissiveIntensity={0.6} metalness={0.4} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.34, 0.018, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function SolarArray({ color }: { color: string }) {
  return (
    <group>
      {[-0.13, 0.13].map((x) => (
        <group key={x} position={[x, 0.08, 0]} rotation={[-Math.PI / 5, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.012, 0.18]} />
            <meshStandardMaterial color="#1a1404" emissive={color} emissiveIntensity={0.55} metalness={0.3} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WindTurbine({ color }: { color: string }) {
  const bladesRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (bladesRef.current) bladesRef.current.rotation.z += delta * 1.6;
  });
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.03, 0.44, 8]} />
        <meshStandardMaterial color="#dbeafe" emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <group ref={bladesRef} position={[0, 0.44, 0.04]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i / 3) * Math.PI * 2]} position={[0, 0.1, 0]}>
            <boxGeometry args={[0.022, 0.2, 0.01]} />
            <meshStandardMaterial color="#e0f2fe" emissive={color} emissiveIntensity={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Hospital({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[0.3, 0.32, 0.26]} />
        <meshStandardMaterial color="#2a0a0a" emissive={color} emissiveIntensity={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.34, 0.135]}>
        <boxGeometry args={[0.12, 0.04, 0.01]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.34, 0.135]}>
        <boxGeometry args={[0.04, 0.12, 0.01]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function CityCluster({ color }: { color: string }) {
  const heights = [0.34, 0.24, 0.42, 0.28];
  const xs = [-0.14, -0.02, 0.12, 0.04];
  const zs = [0.05, -0.1, 0.02, 0.12];
  return (
    <group>
      {heights.map((h, i) => (
        <mesh key={i} position={[xs[i], h / 2, zs[i]]} castShadow>
          <boxGeometry args={[0.09, h, 0.09]} />
          <meshStandardMaterial color="#0a1830" emissive={color} emissiveIntensity={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Factory({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.13, 0]} castShadow>
        <boxGeometry args={[0.34, 0.26, 0.22]} />
        <meshStandardMaterial color="#11161f" emissive={color} emissiveIntensity={0.3} roughness={0.6} />
      </mesh>
      {[-0.08, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.32, -0.04]} castShadow>
          <cylinderGeometry args={[0.03, 0.035, 0.18, 10]} />
          <meshStandardMaterial color="#1b222c" emissive={color} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Pylon({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.22, 0]}>
        <torusGeometry args={[0.16, 0.022, 8, 24]} />
        <meshStandardMaterial color="#3a2606" emissive={color} emissiveIntensity={0.7} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#3a2606" emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function ChargeStation({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[0.12, 0.32, 0.1]} />
        <meshStandardMaterial color="#2a2206" emissive={color} emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.26, 0.06]}>
        <boxGeometry args={[0.08, 0.06, 0.01]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function NodeStructure({ node, pulse }: { node: GridNode; pulse: number }) {
  const color = nodeKindColor(node.kind);
  switch (node.kind) {
    case "nuclear":
      return <CoolingTower color={color} />;
    case "datacenter":
      return <DataMonolith color={color} pulse={pulse} />;
    case "battery":
      return <BatteryStack color={color} />;
    case "solar":
      return <SolarArray color={color} />;
    case "wind":
      return <WindTurbine color={color} />;
    case "hospital":
      return <Hospital color={color} />;
    case "city":
      return <CityCluster color={color} />;
    case "industry":
      return <Factory color={color} />;
    case "interconnect":
      return <Pylon color={color} />;
    case "ev":
      return <ChargeStation color={color} />;
    default:
      return <CityCluster color={color} />;
  }
}

/* ------------------------------------------------------------------ */

export function EnergyNode({ node, selected, onSelect }: EnergyNodeProps) {
  const reticleRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const monolithPulse = useRef(0);
  const [hovered, setHovered] = useState(false);

  const kindColor = nodeKindColor(node.kind);
  const statusColor = nodeStatusColor(node.status);
  const accent = node.status === "stable" ? kindColor : statusColor;

  const maxCapacity = Math.max(1, node.maxProductionMw, node.maxDemandMw);
  const intensity = Math.min(1.2, Math.max(node.productionMw, node.demandMw) / maxCapacity);
  const beamHeight = 0.55 + intensity * 0.95;

  const isPrimary = PRIMARY_KINDS.has(node.kind) || node.criticality === "critical";
  const showLabel = selected || hovered || isPrimary || node.status === "critical" || node.status === "overloaded";

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    monolithPulse.current = 0.5 + Math.sin(t * 2.2) * 0.5;

    if (reticleRef.current && selected) {
      reticleRef.current.rotation.z = t * 0.8;
    }
    if (beamRef.current) {
      const flick = node.status === "critical" ? 0.6 + Math.sin(t * 9) * 0.3 : 0.42 + Math.sin(t * 2) * 0.08;
      (beamRef.current.material as THREE.MeshBasicMaterial).opacity = flick;
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect();
  };

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handleOut = () => {
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  return (
    <group position={node.position} onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
      {/* Locator beam */}
      <mesh ref={beamRef} position={[0, beamHeight / 2, 0]}>
        <cylinderGeometry args={[0.035, 0.07, beamHeight, 12, 1, true]} />
        <meshBasicMaterial color={accent} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Ground pad + status ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="#02141b" transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
        <ringGeometry args={[0.2, 0.24, 40]} />
        <meshBasicMaterial color={accent} transparent opacity={selected ? 1 : 0.7} />
      </mesh>

      {/* Selection reticle */}
      {selected && (
        <group ref={reticleRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[0.3, 0.33, 4]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
        </group>
      )}

      <pointLight color={accent} intensity={selected ? 2.4 : 1.1} distance={2.4} position={[0, 0.4, 0]} />

      <group scale={selected ? 1.18 : 1}>
        <NodeStructure node={node} pulse={monolithPulse.current} />
      </group>

      {showLabel && (
        <Html
          center
          position={[0, beamHeight + 0.22, 0]}
          distanceFactor={9}
          className="pointer-events-none select-none"
          zIndexRange={[20, 0]}
        >
          <div className={`node-label ${selected ? "node-label--selected" : ""} ${node.status === "critical" ? "node-label--critical" : ""}`}>
            <span className="node-label__dot" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
            <span className="node-label__name">{node.label}</span>
            <span className="node-label__value">{formatMw(Math.max(node.productionMw, node.demandMw))}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
