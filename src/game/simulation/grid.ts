import type { GameState } from "@/game/types";
import type {
  GridNode,
  GridNodeStatus,
  GridRuntime,
  TransmissionLine,
  TransmissionLineStatus,
} from "@/game/network/networkTypes";
import { balanceGrid, computeNodeLoads } from "@/game/simulation/nodeBalance";
import { updateLineThermal } from "@/game/simulation/lineThermal";
import { shouldTrip, tripLine } from "@/game/simulation/protection";
import { solveDcFlow, type FlowEdge } from "@/game/simulation/powerFlow";
import { round } from "@/lib/math";

// Preferred reference / balancing node for the DC solve when it exists.
const PREFERRED_SLACK_NODE_ID = "normandy-production";
const MAX_CASCADE_PASSES = 4;
const LINE_HISTORY_LIMIT = 18;

export interface GridTickOptions {
  /** Enable thermal heat integration + tripping. False = pure flow refresh. */
  allowTrips?: boolean;
  /** Minutes elapsed this step. 0 (e.g. an instant action) skips thermal. */
  tickMinutes?: number;
}

function lineStatus(ratio: number): TransmissionLineStatus {
  if (ratio >= 1.1) return "critical";
  if (ratio >= 0.94) return "overloaded";
  if (ratio >= 0.72) return "loaded";
  return "stable";
}

function nodeStatus(node: GridNode): GridNodeStatus {
  const unserved = node.demandMw - node.servedDemandMw;
  if (node.role === "consumer") {
    if (unserved > 1) return "critical";
    const ratio = node.maxDemandMw > 0 ? node.servedDemandMw / node.maxDemandMw : 0;
    if (ratio >= 1.0) return "critical";
    if (ratio >= 0.9) return "overloaded";
    if (ratio >= 0.72) return "loaded";
    return "stable";
  }
  if (node.role === "producer") {
    const ratio = node.maxProductionMw > 0 ? node.servedProductionMw / node.maxProductionMw : 0;
    if (ratio >= 0.98) return "loaded";
    return "stable";
  }
  return "stable";
}

function causesForLine(state: GameState, line: TransmissionLine): string[] {
  const causes: string[] = [];
  if (line.utilizationRatio > 1) causes.push("Surcharge thermique");

  for (const incidentId of line.incidentIds) {
    const incident = state.incidents.find((item) => item.id === incidentId && !item.resolvedAt);
    if (incident) causes.push(incident.title);
  }

  if (causes.length === 0) causes.push("Flux de transit regional");
  return causes;
}

/**
 * Dev-only invariant: at every node, signed flow out minus flow in must equal
 * the node injection (Kirchhoff). Holds while the graph is connected to the
 * slack; islanded components after a trip are exempt. Warns rather than throws.
 */
function assertConservation(
  nodes: GridNode[],
  lines: TransmissionLine[],
  flows: Record<string, number>,
  injections: Record<string, number>,
): void {
  if (process.env.NODE_ENV === "production") return;
  const EPSILON = 0.5;
  const balance: Record<string, number> = {};
  for (const node of nodes) balance[node.id] = 0;
  for (const line of lines) {
    if (line.tripped) continue;
    const flow = flows[line.id] ?? 0;
    balance[line.fromNodeId] += flow;
    balance[line.toNodeId] -= flow;
  }
  for (const node of nodes) {
    const residual = balance[node.id] - (injections[node.id] ?? 0);
    if (Math.abs(residual) > EPSILON) {
      console.warn(
        `[grid] conservation violated at ${node.id}: residual ${residual.toFixed(2)} MW`,
      );
    }
    if (!Number.isFinite(node.servedProductionMw) || !Number.isFinite(node.servedDemandMw)) {
      console.warn(`[grid] non-finite served value at ${node.id}`);
    }
  }
}

function buildEdges(lines: TransmissionLine[]): FlowEdge[] {
  return lines.map((line) => ({
    id: line.id,
    from: line.fromNodeId,
    to: line.toNodeId,
    b: line.susceptance,
    active: !line.tripped,
  }));
}

function selectSlackNodeId(nodes: GridNode[]): string {
  const preferred = nodes.find((node) => node.id === PREFERRED_SLACK_NODE_ID);
  if (preferred) return preferred.id;

  const producer = [...nodes]
    .filter((node) => node.servedProductionMw > 0 || node.productionMw > 0)
    .sort((a, b) => b.servedProductionMw + b.productionMw - (a.servedProductionMw + a.productionMw))[0];

  return producer?.id ?? nodes[0]?.id ?? PREFERRED_SLACK_NODE_ID;
}

function activeGridComponents(nodes: GridNode[], lines: TransmissionLine[]): GridNode[][] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const line of lines) {
    if (line.tripped) continue;
    if (!nodesById.has(line.fromNodeId) || !nodesById.has(line.toNodeId)) continue;
    adjacency.get(line.fromNodeId)?.push(line.toNodeId);
    adjacency.get(line.toNodeId)?.push(line.fromNodeId);
  }

  const seen = new Set<string>();
  const components: GridNode[][] = [];
  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    const stack = [node.id];
    const component: GridNode[] = [];
    seen.add(node.id);
    while (stack.length > 0) {
      const id = stack.pop()!;
      const item = nodesById.get(id);
      if (item) component.push(item);
      for (const next of adjacency.get(id) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        stack.push(next);
      }
    }
    components.push(component);
  }
  return components;
}

function balanceByActiveTopology(nodes: GridNode[], lines: TransmissionLine[]) {
  return activeGridComponents(nodes, lines).reduce(
    (total, component) => {
      const result = balanceGrid(component);
      return {
        unservedMw: round(total.unservedMw + result.unservedMw, 1),
        oversupplyMw: round(total.oversupplyMw + result.oversupplyMw, 1),
      };
    },
    { unservedMw: 0, oversupplyMw: 0 },
  );
}

function updateLineRatings(state: GameState): void {
  for (const line of state.grid.lines) {
    const emergencyActive = line.emergencyCapacityUntil !== undefined && line.emergencyCapacityUntil >= state.minute;
    line.capacityMw = emergencyActive ? round(line.nominalCapacityMw * 1.18, 1) : line.nominalCapacityMw;
  }
}

function updateLineProtectionState(line: TransmissionLine): void {
  if (line.tripped) {
    if (line.protectionState === "open" || line.protectionState === "repairing") return;
    line.protectionState = "tripped";
    return;
  }

  line.repairUntil = undefined;
  if (line.temperatureC >= 100 || line.utilizationRatio >= 1 || line.overloadDuration > 0) {
    line.protectionState = "armed";
    return;
  }

  line.protectionState = "closed";
}

function recordLineHistory(line: TransmissionLine, tickMinutes: number): void {
  if (tickMinutes <= 0) return;
  line.utilizationHistory = [...line.utilizationHistory, round(line.utilizationRatio, 2)].slice(-LINE_HISTORY_LIMIT);
}

function assignFlows(lines: TransmissionLine[], flows: Record<string, number>): void {
  for (const line of lines) {
    if (line.tripped) {
      line.signedFlowMw = 0;
      line.currentFlowMw = 0;
      line.utilizationRatio = 0;
      continue;
    }
    const signedFlow = flows[line.id] ?? 0;
    const flow = Math.abs(signedFlow);
    line.signedFlowMw = round(signedFlow, 1);
    line.currentFlowMw = round(flow, 1);
    line.utilizationRatio = line.capacityMw > 0 ? round(flow / line.capacityMw, 2) : 0;
  }
}

/**
 * Advance the grid one step: derive nodal loads, balance them, solve flows,
 * integrate line heat, trip + re-solve cascades, then recompute statuses and
 * aggregates. Mutates and returns `state.grid` (the caller works on a cloned
 * state, so persistent line heat carries across ticks).
 */
export function solveGridTick(state: GameState, options: GridTickOptions = {}): GridRuntime {
  const grid = state.grid;
  const { nodes, lines } = grid;
  const tickMinutes = options.tickMinutes ?? state.scenario.tickMinutes;
  const runThermal = options.allowTrips !== false && tickMinutes > 0;

  updateLineRatings(state);
  computeNodeLoads(state, nodes);
  let { unservedMw } = balanceByActiveTopology(nodes, lines);

  const nodeIds = nodes.map((node) => node.id);
  let injections: Record<string, number> = {};
  for (const node of nodes) injections[node.id] = node.servedProductionMw - node.servedDemandMw;

  const slackNodeId = selectSlackNodeId(nodes);
  let flows = solveDcFlow(nodeIds, injections, buildEdges(lines), slackNodeId);
  assignFlows(lines, flows);

  if (tickMinutes > 0) {
    for (const line of lines) updateLineThermal(line, tickMinutes);
  }

  if (runThermal) {
    for (let pass = 0; pass < MAX_CASCADE_PASSES; pass++) {
      const toTrip = lines.filter(shouldTrip);
      if (toTrip.length === 0) break;
      for (const line of toTrip) tripLine(line);
      unservedMw = balanceByActiveTopology(nodes, lines).unservedMw;
      injections = {};
      for (const node of nodes) injections[node.id] = node.servedProductionMw - node.servedDemandMw;
      flows = solveDcFlow(nodeIds, injections, buildEdges(lines), slackNodeId);
      assignFlows(lines, flows);
    }
  }

  let overloadMw = 0;
  let maxUtilization = 0;
  const trippedLineIds: string[] = [];
  for (const line of lines) {
    if (line.tripped) {
      line.status = "offline";
      trippedLineIds.push(line.id);
    } else {
      line.status = lineStatus(line.utilizationRatio);
      maxUtilization = Math.max(maxUtilization, line.utilizationRatio);
      overloadMw += Math.max(0, line.currentFlowMw - line.capacityMw);
    }
    line.causes = causesForLine(state, line);
    updateLineProtectionState(line);
    recordLineHistory(line, tickMinutes);
  }

  for (const node of nodes) node.status = nodeStatus(node);

  assertConservation(nodes, lines, flows, injections);

  grid.unservedMw = unservedMw;
  grid.overloadMw = round(overloadMw, 1);
  grid.trippedLineIds = trippedLineIds;
  grid.maxUtilization = round(maxUtilization, 2);

  return grid;
}
