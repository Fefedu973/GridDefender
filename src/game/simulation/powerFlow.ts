// Linearized DC power flow over the transmission graph.
//
// We solve B'·θ = P' where θ are nodal voltage angles, P the nodal injections
// (productionMw - demandMw), and B the susceptance-weighted Laplacian. Flow on a
// line is f_ij = b_ij·(θ_i - θ_j), which conserves power at every node by
// construction. A small diagonal regularization keeps the system solvable even
// when a trip splits the graph into islands (those angles relax toward 0 rather
// than producing NaN).

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  /** Susceptance; <= 0 or inactive removes the edge from the solve. */
  b: number;
  active: boolean;
}

/**
 * Gauss-Jordan elimination with partial pivoting. Returns the solution vector
 * for A·x = rhs. Near-singular pivots resolve to 0 (defensive; regularization
 * normally prevents them).
 */
export function solveLinear(a: number[][], rhs: number[]): number[] {
  const n = rhs.length;
  if (n === 0) return [];
  const m = a.map((row, i) => [...row, rhs[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    }
    if (Math.abs(m[pivot][col]) < 1e-12) continue;

    if (pivot !== col) {
      const swap = m[col];
      m[col] = m[pivot];
      m[pivot] = swap;
    }

    const diag = m[col][col];
    for (let c = col; c <= n; c++) m[col][c] /= diag;

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = m[r][col];
      if (factor === 0) continue;
      for (let c = col; c <= n; c++) m[r][c] -= factor * m[col][c];
    }
  }

  return m.map((row) => row[n]);
}

/**
 * Solve nodal flows. `injections` should already be balanced (sum ~ 0); any
 * residual is absorbed by the slack node. Returns signed flow per edge id where
 * positive means flow runs from `edge.from` to `edge.to`.
 */
export function solveDcFlow(
  nodeIds: string[],
  injections: Record<string, number>,
  edges: FlowEdge[],
  slackId: string,
): Record<string, number> {
  const nonSlack = nodeIds.filter((id) => id !== slackId);
  const index = new Map<string, number>();
  nonSlack.forEach((id, i) => index.set(id, i));
  const n = nonSlack.length;

  const flows: Record<string, number> = {};
  for (const edge of edges) flows[edge.id] = 0;
  if (n === 0) return flows;

  const b: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const p: number[] = new Array<number>(n).fill(0);

  // Tiny regularization so disconnected components stay solvable.
  const reg = 1e-6;
  for (let i = 0; i < n; i++) b[i][i] += reg;
  for (const id of nonSlack) p[index.get(id)!] = injections[id] ?? 0;

  for (const edge of edges) {
    if (!edge.active || edge.b <= 0) continue;
    const i = index.has(edge.from) ? index.get(edge.from)! : -1;
    const j = index.has(edge.to) ? index.get(edge.to)! : -1;
    if (i >= 0) b[i][i] += edge.b;
    if (j >= 0) b[j][j] += edge.b;
    if (i >= 0 && j >= 0) {
      b[i][j] -= edge.b;
      b[j][i] -= edge.b;
    }
  }

  const theta = solveLinear(b, p);
  const angle = (id: string) => (id === slackId ? 0 : theta[index.get(id)!] ?? 0);

  for (const edge of edges) {
    if (!edge.active || edge.b <= 0) {
      flows[edge.id] = 0;
      continue;
    }
    flows[edge.id] = edge.b * (angle(edge.from) - angle(edge.to));
  }

  return flows;
}
