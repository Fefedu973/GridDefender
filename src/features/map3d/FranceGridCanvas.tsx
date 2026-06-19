"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { MapDefinition } from "@/game/domain/mapDefinition";
import type { SelectedEntity } from "@/game/network/networkTypes";
import type { GameState } from "@/game/types";
import { CameraRig } from "@/features/map3d/scene/CameraRig";
import { CrisisEffects } from "@/features/map3d/scene/CrisisEffects";
import { EnergyNodeInstances } from "@/features/map3d/scene/EnergyNodeInstances";
import { FranceTerrain } from "@/features/map3d/scene/FranceTerrain";
import { TransmissionNetwork } from "@/features/map3d/scene/TransmissionNetwork";
import { WeatherEffects } from "@/features/map3d/scene/WeatherEffects";
import { getSceneRenderQualityProfile } from "@/features/map3d/scene/renderQualityProfile";
import { getSceneCameraConfig } from "@/features/map3d/scene/sceneCamera";
import { getSceneEnvironment } from "@/features/map3d/scene/sceneEnvironment";
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

export function FranceGridCanvas({
  map,
  gameOverride,
  showHorizonRing = true,
}: {
  map?: MapDefinition;
  gameOverride?: GameState;
  showHorizonRing?: boolean;
}) {
  const storeGame = useGameStore((state) => state.game);
  const renderQuality = useGameStore((state) => state.renderQuality);
  const viewLayer = useGameStore((state) => state.viewLayer);
  const selectedEntity = useGameStore((state) => state.selectedEntity);
  const selectEntity = useGameStore((state) => state.selectEntity);
  const [mapReady, setMapReady] = useState(false);
  const game = gameOverride ?? storeGame;
  // The engine owns the live grid; the scene renders it directly.
  const snapshot = game.grid;
  const selectedLineId = selectedEntity?.kind === "line" ? selectedEntity.id : undefined;
  const selectedNodeId = selectedEntity?.kind === "node" ? selectedEntity.id : undefined;
  const environment = getSceneEnvironment({
    map,
    minute: game.minute,
    startMinute: game.scenario.startMinute,
    endMinute: game.scenario.endMinute,
    solarDrop: game.flags.solarDrop,
  });

  const cameraConfig = useMemo(() => getSceneCameraConfig(map, snapshot.nodes), [map, snapshot.nodes]);
  const center = useMemo(
    () => new THREE.Vector3(cameraConfig.target[0], cameraConfig.target[1], cameraConfig.target[2]),
    [cameraConfig.target],
  );
  const renderProfile = useMemo(() => getSceneRenderQualityProfile(renderQuality), [renderQuality]);

  const select = (entity: SelectedEntity) => selectEntity(entity);
  const revealMap = useCallback(() => setMapReady(true), []);

  return (
    <div className="absolute inset-0 bg-[#030a10]" data-map={map?.id ?? "france-national"}>
      <div
        className={`absolute inset-0 transition-opacity duration-500 ease-out ${
          mapReady ? "opacity-100" : "opacity-0"
        }`}
      >
        <Canvas
          className="absolute inset-0"
          dpr={renderProfile.dpr}
          camera={{ position: cameraConfig.position, fov: cameraConfig.fov, near: 0.1, far: 120 }}
          gl={{ antialias: renderProfile.antialias, alpha: false, powerPreference: "high-performance" }}
          onPointerMissed={() => selectEntity(undefined)}
          shadows={renderProfile.shadowMode}
        >
          <CanvasReadySignal onReady={revealMap} />
          <color attach="background" args={[environment.skyColor]} />
          <fog attach="fog" args={[environment.skyColor, environment.fogNear, environment.fogFar]} />

          <ambientLight intensity={environment.ambientIntensity * renderProfile.lightScale} />
          <hemisphereLight args={[environment.phase === "storm" ? "#17313d" : "#1a4a5a", "#02060a", environment.hemiIntensity * renderProfile.lightScale]} />
          <directionalLight
            color={environment.keyLight}
            position={[4, 9, 5]}
            intensity={environment.keyIntensity * renderProfile.lightScale}
            castShadow={renderProfile.pylonShadows}
            shadow-mapSize={[1024, 1024]}
          />
          {renderProfile.extraLights && (
            <>
              <pointLight position={[center.x, 5, center.z]} intensity={1.8 * renderProfile.lightScale} color="#22d3ee" distance={20} />
              <pointLight position={[-4, 3, 6]} intensity={0.7 * renderProfile.lightScale} color="#34d399" distance={16} />
            </>
          )}

          <FranceTerrain map={map} />
          {showHorizonRing && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, -0.255, center.z]}>
              <ringGeometry args={[4.2, 8.5, 80]} />
              <meshBasicMaterial color={environment.horizonColor} transparent opacity={environment.horizonOpacity} depthWrite={false} />
            </mesh>
          )}
          <TransmissionNetwork
            snapshot={snapshot}
            selectedLineId={selectedLineId}
            renderProfile={renderProfile}
            viewLayer={viewLayer}
            onSelectLine={(lineId) => select({ kind: "line", id: lineId })}
          />
          <EnergyNodeInstances
            snapshot={snapshot}
            selectedNodeId={selectedNodeId}
            mapModelScale={map?.modelScale ?? 1}
            renderQuality={renderQuality}
            viewLayer={viewLayer}
            onSelectNode={(nodeId) => select({ kind: "node", id: nodeId })}
          />
          <CrisisEffects snapshot={snapshot} ringSegments={renderProfile.crisisRingSegments} />
          <WeatherEffects rain={environment.rain && renderProfile.weatherEffects} />

          <OrbitControls
            makeDefault
            enablePan={false}
            enableDamping
            dampingFactor={0.06}
            autoRotate
            autoRotateSpeed={cameraConfig.autoRotateSpeed}
            minDistance={cameraConfig.minDistance}
            maxDistance={cameraConfig.maxDistance}
            minPolarAngle={cameraConfig.minPolarAngle}
            maxPolarAngle={cameraConfig.maxPolarAngle}
            target={cameraConfig.target}
          />
          <CameraRig
            snapshot={snapshot}
            aiJobs={game.aiJobs}
            selectedEntity={selectedEntity}
            center={center}
          />

          {renderProfile.postprocessing && (
            <EffectComposer>
              <Bloom intensity={renderProfile.bloomIntensity} luminanceThreshold={0.18} luminanceSmoothing={0.4} mipmapBlur />
              <Vignette eskil={false} offset={0.25} darkness={0.85} />
            </EffectComposer>
          )}
        </Canvas>
      </div>
    </div>
  );
}
