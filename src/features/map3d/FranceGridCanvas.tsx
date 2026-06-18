"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { getFranceGridSnapshot } from "@/game/network/franceGrid";
import { FRANCE_BOUNDS } from "@/features/map3d/geo/franceGeo";
import type { SelectedEntity } from "@/game/network/networkTypes";
import { CameraRig } from "@/features/map3d/scene/CameraRig";
import { CrisisEffects } from "@/features/map3d/scene/CrisisEffects";
import { EnergyNodeInstances } from "@/features/map3d/scene/EnergyNodeInstances";
import { FranceTerrain } from "@/features/map3d/scene/FranceTerrain";
import { TransmissionNetwork } from "@/features/map3d/scene/TransmissionNetwork";
import { useGameStore } from "@/store/gameStore";

function CanvasReadySignal({ onReady }: { onReady: () => void }) {
  const signaled = useRef(false);

  useFrame(() => {
    if (signaled.current) return;
    signaled.current = true;
    window.requestAnimationFrame(onReady);
  });

  return null;
}

export function FranceGridCanvas() {
  const game = useGameStore((state) => state.game);
  const selectedEntity = useGameStore((state) => state.selectedEntity);
  const selectEntity = useGameStore((state) => state.selectEntity);
  const [mapReady, setMapReady] = useState(false);
  const snapshot = useMemo(() => getFranceGridSnapshot(game), [game]);
  const selectedLineId = selectedEntity?.kind === "line" ? selectedEntity.id : undefined;
  const selectedNodeId = selectedEntity?.kind === "node" ? selectedEntity.id : undefined;

  const center = useMemo(
    () => new THREE.Vector3(FRANCE_BOUNDS.centerX, 0, FRANCE_BOUNDS.centerZ),
    [],
  );

  const select = (entity: SelectedEntity) => selectEntity(entity);
  const revealMap = useCallback(() => setMapReady(true), []);

  return (
    <div className="absolute inset-0 bg-[#030a10]">
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-out ${
          mapReady ? "opacity-100" : "opacity-0"
        }`}
      >
        <Canvas
          className="absolute inset-0"
          dpr={[1, 1.9]}
          camera={{ position: [center.x + 0.3, 7.1, center.z + 8.1], fov: 42, near: 0.1, far: 120 }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          onPointerMissed={() => selectEntity(undefined)}
          shadows="percentage"
        >
          <CanvasReadySignal onReady={revealMap} />
          <color attach="background" args={["#030a10"]} />
          <fog attach="fog" args={["#030a10", 11, 26]} />

          <ambientLight intensity={0.55} />
          <hemisphereLight args={["#1a4a5a", "#02060a", 0.5]} />
          <directionalLight position={[4, 9, 5]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
          <pointLight position={[center.x, 5, center.z]} intensity={1.8} color="#22d3ee" distance={20} />
          <pointLight position={[-4, 3, 6]} intensity={0.7} color="#34d399" distance={16} />

          <FranceTerrain />
          <TransmissionNetwork
            snapshot={snapshot}
            selectedLineId={selectedLineId}
            onSelectLine={(lineId) => select({ kind: "line", id: lineId })}
          />
          <EnergyNodeInstances
            snapshot={snapshot}
            selectedNodeId={selectedNodeId}
            onSelectNode={(nodeId) => select({ kind: "node", id: nodeId })}
          />
          <CrisisEffects snapshot={snapshot} />

          <OrbitControls
            makeDefault
            enablePan={false}
            enableDamping
            dampingFactor={0.06}
            autoRotate={!selectedEntity}
            autoRotateSpeed={0.18}
            minDistance={5}
            maxDistance={13}
            minPolarAngle={0.35}
            maxPolarAngle={1.15}
            target={[center.x, 0, center.z]}
          />
          <CameraRig snapshot={snapshot} selectedEntity={selectedEntity} center={center} />

          <EffectComposer>
            <Bloom intensity={0.9} luminanceThreshold={0.18} luminanceSmoothing={0.4} mipmapBlur />
            <Vignette eskil={false} offset={0.25} darkness={0.85} />
          </EffectComposer>
        </Canvas>
      </div>
    </div>
  );
}
