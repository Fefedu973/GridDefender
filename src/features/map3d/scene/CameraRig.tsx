"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { FranceGridSnapshot, SelectedEntity } from "@/game/network/networkTypes";
import type { AIJob } from "@/game/types";

interface OrbitLike {
  target: THREE.Vector3;
  update: () => void;
}

interface CameraRigProps {
  snapshot: FranceGridSnapshot;
  aiJobs: Pick<AIJob, "id" | "assignedNodeId" | "externalized">[];
  selectedEntity?: SelectedEntity;
  center: THREE.Vector3;
}

export function CameraRig({ snapshot, aiJobs, selectedEntity, center }: CameraRigProps) {
  const controls = useThree((state) => state.controls) as OrbitLike | null;
  const desired = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!controls) return;

    desired.current.copy(center);

    if (selectedEntity?.kind === "node") {
      const node = snapshot.nodes.find((item) => item.id === selectedEntity.id);
      if (node) desired.current.set(node.position[0], 0.2, node.position[2]);
    }

    if (selectedEntity?.kind === "workload") {
      const job = aiJobs.find((item) => item.id === selectedEntity.id);
      const datacenter = snapshot.nodes.find((item) => item.id === job?.assignedNodeId);
      if (datacenter) desired.current.set(datacenter.position[0], 0.2, datacenter.position[2]);
    }

    if (selectedEntity?.kind === "line") {
      const line = snapshot.lines.find((item) => item.id === selectedEntity.id);
      const from = snapshot.nodes.find((node) => node.id === line?.fromNodeId);
      const to = snapshot.nodes.find((node) => node.id === line?.toNodeId);
      if (from && to) {
        desired.current.set(
          (from.position[0] + to.position[0]) / 2,
          0.2,
          (from.position[2] + to.position[2]) / 2,
        );
      }
    }

    controls.target.lerp(desired.current, 0.08);
    controls.update();
  });

  return null;
}
