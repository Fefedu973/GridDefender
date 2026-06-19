"use client";

import { Float, Html, Line, OrbitControls, Sparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { CampaignMapEdge, CampaignMapNode, CampaignMapNodeStatus } from "@/content/campaign/campaignMap";

const STATUS_COLOR: Record<CampaignMapNodeStatus, string> = {
  locked: "#5b7079",
  available: "#37e0ff",
  completed: "#3bf7b0",
};

// Map the campaign layout (x/y in 0..100, z = elevation) into world space.
function toWorld(node: CampaignMapNode): THREE.Vector3 {
  return new THREE.Vector3((node.x - 52) / 11, node.z / 42, (node.y - 50) / 11);
}

function nodeColor(node: CampaignMapNode, selected: boolean) {
  if (node.status === "locked") return STATUS_COLOR.locked;
  return selected ? "#ffffff" : STATUS_COLOR[node.status];
}

interface OrbitLike {
  target: THREE.Vector3;
  update: () => void;
}

/** Glide the orbit target onto the active mission so it stays centered. */
function CameraRig({ focus }: { focus: THREE.Vector3 }) {
  const controls = useThree((state) => state.controls) as OrbitLike | null;
  useFrame(() => {
    if (!controls) return;
    controls.target.lerp(focus, 0.07);
    controls.update();
  });
  return null;
}

function MissionNode({
  node,
  selected,
  onSelect,
}: {
  node: CampaignMapNode;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const position = useMemo(() => toWorld(node), [node]);
  const [hovered, setHovered] = useState(false);
  const haloRef = useRef<THREE.Mesh>(null);
  const locked = node.status === "locked";
  const active = node.status === "available";
  const color = nodeColor(node, selected);

  useFrame(({ clock }) => {
    if (!haloRef.current) return;
    const material = haloRef.current.material as THREE.MeshBasicMaterial;
    if (selected || active) {
      const pulse = 0.5 + Math.sin(clock.elapsedTime * 2.4 + node.index) * 0.5;
      const scale = 1 + pulse * 0.35;
      haloRef.current.scale.set(scale, scale, scale);
      material.opacity = 0.3 + pulse * 0.5;
    } else {
      haloRef.current.scale.set(1, 1, 1);
      material.opacity = hovered ? 0.6 : 0.32;
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!locked) onSelect(node.id);
  };
  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (locked) return;
    setHovered(true);
    document.body.style.cursor = "pointer";
  };
  const handleOut = () => {
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  return (
    <group position={position}>
      {/* Stem down to the ground plane */}
      <mesh position={[0, -position.y / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, Math.max(0.01, position.y), 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>

      {/* Pulsing halo on the ground */}
      <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -position.y + 0.01, 0]}>
        <ringGeometry args={[0.17, 0.26, 36]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <Float speed={active || selected ? 2.4 : 1.2} rotationIntensity={0.5} floatIntensity={active || selected ? 0.7 : 0.35}>
        <mesh onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut} scale={selected ? 1.4 : hovered ? 1.18 : 1}>
          <octahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={locked ? 0.25 : selected ? 1.4 : 0.95}
            metalness={0.4}
            roughness={0.25}
          />
        </mesh>
        <Html center position={[0, 0.36, 0]} distanceFactor={6.5} zIndexRange={[20, 0]}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 13,
              color: selected ? "#04161d" : color,
              background: selected ? "#ffffff" : "rgba(3,12,17,0.78)",
              border: `1px solid ${selected ? "#ffffff" : color}`,
              borderRadius: 5,
              padding: "1px 8px",
              whiteSpace: "nowrap",
              boxShadow: locked ? "none" : `0 0 14px ${color}aa`,
              pointerEvents: "none",
            }}
          >
            {node.index + 1}
          </div>
        </Html>
      </Float>
    </group>
  );
}

export function CampaignMap3D({
  nodes,
  edges,
  selectedMissionId,
  onSelect,
}: {
  nodes: CampaignMapNode[];
  edges: CampaignMapEdge[];
  selectedMissionId: string;
  onSelect: (id: string) => void;
}) {
  const nodesById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const center = useMemo(() => {
    if (nodes.length === 0) return new THREE.Vector3(0, 0.4, 0);
    const sum = nodes.reduce((acc, node) => acc.add(toWorld(node)), new THREE.Vector3());
    return sum.multiplyScalar(1 / nodes.length).setY(0.4);
  }, [nodes]);
  const focus = useMemo(() => {
    const selected = nodesById.get(selectedMissionId);
    return selected ? toWorld(selected).setY(0.4) : center.clone();
  }, [center, nodesById, selectedMissionId]);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded border border-[var(--c-cyan)]/20 bg-[radial-gradient(circle_at_50%_30%,rgba(55,224,255,0.22),transparent_52%),radial-gradient(circle_at_82%_85%,rgba(167,139,250,0.16),transparent_46%),radial-gradient(circle_at_15%_88%,rgba(59,247,176,0.14),transparent_44%),#04141b]">
      <Canvas
        camera={{ position: [center.x + 0.2, 4.6, 7.6], fov: 46, near: 0.1, far: 60 }}
        dpr={[1, 1.7]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onPointerMissed={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <ambientLight intensity={0.95} />
        <hemisphereLight args={["#3fe6ff", "#0a2230", 0.7]} />
        <directionalLight position={[3, 7, 4]} intensity={1.2} color="#fff4e6" />
        <pointLight position={[center.x, 3, center.z]} intensity={1.6} color="#37e0ff" distance={18} />
        <pointLight position={[center.x - 4, 2.4, center.z + 3]} intensity={1.1} color="#a78bfa" distance={16} />
        <pointLight position={[center.x + 4, 2.4, center.z - 3]} intensity={1.0} color="#3bf7b0" distance={16} />

        {/* Glowing ground disc + softer grid for a warmer floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, -0.02, center.z]}>
          <circleGeometry args={[7, 64]} />
          <meshBasicMaterial color="#0a2c38" transparent opacity={0.55} />
        </mesh>
        <gridHelper args={[15, 15, "#2f8aa3", "#15596b"]} position={[center.x, 0, center.z]} />

        <Sparkles count={42} scale={[12, 3, 12]} position={[center.x, 1.4, center.z]} size={2.4} speed={0.35} color="#9fefff" opacity={0.7} />

        {edges.map((edge) => {
          const from = nodesById.get(edge.fromId);
          const to = nodesById.get(edge.toId);
          if (!from || !to) return null;
          return (
            <Line
              key={`${edge.fromId}-${edge.toId}`}
              points={[toWorld(from), toWorld(to)]}
              color={edge.unlocked ? "#3bf7b0" : "#46606b"}
              lineWidth={edge.unlocked ? 2.6 : 1.3}
              dashed={!edge.unlocked}
              dashSize={0.14}
              gapSize={0.1}
              transparent
              opacity={edge.unlocked ? 0.9 : 0.45}
            />
          );
        })}

        {nodes.map((node) => (
          <MissionNode key={node.id} node={node} selected={node.id === selectedMissionId} onSelect={onSelect} />
        ))}

        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          autoRotate
          autoRotateSpeed={0.4}
          minDistance={5}
          maxDistance={12}
          minPolarAngle={0.5}
          maxPolarAngle={1.18}
          target={[focus.x, focus.y, focus.z]}
        />
        <CameraRig focus={focus} />
      </Canvas>
    </div>
  );
}
