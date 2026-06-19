// Generates src/features/map3d/geo/europeGeo.ts from a Natural Earth 50m
// admin-0 countries GeoJSON. Run once to (re)bake the data:
//
//   curl -sL -o .tmp_geo/ne50.geojson \
//     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
//   node scripts/build-europe-geo.mjs
//
// The output is a small, hand-clipped + simplified set of neighbour outlines
// around metropolitan France, projected in the app with the same projectLonLat.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SRC = ".tmp_geo/ne50.geojson";
const OUT = "src/features/map3d/geo/europeGeo.ts";

// View window around France (lon/lat). Everything is clipped to this box so we
// never carry the long tails of Scandinavia or eastern Europe into the scene.
const BOX = { minLon: -11, maxLon: 18, minLat: 35.5, maxLat: 59 };

// Neighbours rendered as faint "ghost" landmasses behind the French hero shape.
// France itself keeps its tuned outline (franceGeo.ts), so it is excluded here.
const COUNTRIES = [
  "United Kingdom",
  "Ireland",
  "Spain",
  "Portugal",
  "Belgium",
  "Netherlands",
  "Luxembourg",
  "Germany",
  "Switzerland",
  "Austria",
  "Italy",
  "Denmark",
  "Czechia",
  "Poland",
  "Slovenia",
  "Croatia",
  "Slovakia",
  "Hungary",
  "Norway",
  "Sweden",
];

const SIMPLIFY_TOLERANCE = 0.07; // degrees
const MIN_RING_AREA = 0.05; // degrees^2, drops tiny islets

// --- Sutherland–Hodgman polygon clipping against the axis-aligned BOX --------
function clipAgainstEdge(points, inside, intersect) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const cur = points[i];
    const prev = points[(i + points.length - 1) % points.length];
    const curIn = inside(cur);
    const prevIn = inside(prev);
    if (curIn) {
      if (!prevIn) out.push(intersect(prev, cur));
      out.push(cur);
    } else if (prevIn) {
      out.push(intersect(prev, cur));
    }
  }
  return out;
}

function clipToBox(ring) {
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  let pts = ring;
  // left
  pts = clipAgainstEdge(pts, (p) => p[0] >= BOX.minLon, (a, b) => lerp(a, b, (BOX.minLon - a[0]) / (b[0] - a[0])));
  if (pts.length < 3) return [];
  // right
  pts = clipAgainstEdge(pts, (p) => p[0] <= BOX.maxLon, (a, b) => lerp(a, b, (BOX.maxLon - a[0]) / (b[0] - a[0])));
  if (pts.length < 3) return [];
  // bottom
  pts = clipAgainstEdge(pts, (p) => p[1] >= BOX.minLat, (a, b) => lerp(a, b, (BOX.minLat - a[1]) / (b[1] - a[1])));
  if (pts.length < 3) return [];
  // top
  pts = clipAgainstEdge(pts, (p) => p[1] <= BOX.maxLat, (a, b) => lerp(a, b, (BOX.maxLat - a[1]) / (b[1] - a[1])));
  if (pts.length < 3) return [];
  return pts;
}

// --- Ramer–Douglas–Peucker simplification ------------------------------------
function perpDist(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1e-9;
  return Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / len;
}

function rdp(points, eps) {
  if (points.length < 3) return points;
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > eps) {
    const left = rdp(points.slice(0, idx + 1), eps);
    const right = rdp(points.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

// RDP needs an open chain; a closed ring has a zero-length baseline that
// collapses it. Split the ring at its two extreme points and simplify each arc.
function simplifyRing(ring, eps) {
  const pts = ring.slice();
  const last = pts[pts.length - 1];
  if (pts.length > 1 && pts[0][0] === last[0] && pts[0][1] === last[1]) pts.pop();
  if (pts.length < 4) return pts;
  let far = 0;
  let fd = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2;
    if (d > fd) {
      fd = d;
      far = i;
    }
  }
  const arc1 = rdp(pts.slice(0, far + 1), eps);
  const arc2 = rdp(pts.slice(far).concat([pts[0]]), eps);
  return arc1.slice(0, -1).concat(arc2.slice(0, -1));
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

const round = (n) => Math.round(n * 100) / 100;

function processCountry(feature) {
  const geom = feature.geometry;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  const rings = [];
  for (const poly of polys) {
    const outer = poly[0]; // ignore holes for a silhouette
    const clipped = clipToBox(outer);
    if (clipped.length < 4) continue;
    if (ringArea(clipped) < MIN_RING_AREA) continue;
    let simplified = simplifyRing(clipped, SIMPLIFY_TOLERANCE);
    if (simplified.length < 4) continue;
    simplified = simplified.map(([lon, lat]) => [round(lon), round(lat)]);
    rings.push(simplified);
  }
  return rings;
}

// --- Run ---------------------------------------------------------------------
const data = JSON.parse(readFileSync(SRC, "utf8"));
const wanted = new Set(COUNTRIES);
const out = [];
let totalPoints = 0;

for (const feature of data.features) {
  const name = feature.properties.NAME;
  if (!wanted.has(name)) continue;
  const rings = processCountry(feature);
  if (!rings.length) continue;
  for (const ring of rings) totalPoints += ring.length;
  out.push({ name, rings });
}

out.sort((a, b) => a.name.localeCompare(b.name));

const header = `// AUTO-GENERATED by scripts/build-europe-geo.mjs — do not edit by hand.
// Source: Natural Earth 50m admin-0 countries (public domain).
// Simplified (RDP ${SIMPLIFY_TOLERANCE}deg) and clipped to a France-centred view box.
import type { LonLat } from "@/features/map3d/geo/franceGeo";

export interface CountryOutline {
  name: string;
  rings: LonLat[][];
}

export const EUROPE_NEIGHBOURS: CountryOutline[] = ${JSON.stringify(out)
  .replace(/\],"rings"/g, '],\n    "rings"')
  .replace(/\{"name"/g, "\n  {\n    \"name\"")
  .replace(/\}\]$/, "}\n]")};
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, header);
console.log(`Wrote ${OUT}: ${out.length} countries, ${totalPoints} points total.`);
for (const c of out) console.log(`  ${c.name}: ${c.rings.length} ring(s), ${c.rings.reduce((n, r) => n + r.length, 0)} pts`);
