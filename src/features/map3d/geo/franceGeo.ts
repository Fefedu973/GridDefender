// Real metropolitan France geography, projected into the 3D world.
//
// Everything in the scene (terrain shape, node placement, transmission lines)
// derives from real-ish lon/lat coordinates so the map is instantly readable as
// France and cities never collapse onto each other.

export type LonLat = [number, number];

// Equirectangular projection with a cos(lat) correction so the silhouette keeps
// the right proportions. North is mapped to -Z (further from the camera).
const LON_CENTER = 2.4;
const LAT_CENTER = 46.6;
const LAT_COS = Math.cos((LAT_CENTER * Math.PI) / 180);
const SCALE = 0.62;

export function projectLonLat([lon, lat]: LonLat): [number, number] {
  const x = (lon - LON_CENTER) * LAT_COS * SCALE;
  const z = -(lat - LAT_CENTER) * SCALE;
  return [x, z];
}

// Clockwise trace of the metropolitan coastline + land borders. Faithful enough
// to read as the Hexagone: Brittany peninsula, Cotentin, the Mediterranean arc,
// the Alsace notch and the Pyrenees flat bottom.
export const FRANCE_OUTLINE: LonLat[] = [
  [2.45, 51.05], // Dunkerque
  [1.85, 50.95], // Calais
  [1.58, 50.86], // Cap Gris-Nez
  [1.55, 50.2],
  [1.08, 49.93], // Dieppe
  [0.18, 49.7],
  [0.1, 49.49], // Le Havre
  [-0.35, 49.28],
  [-1.15, 49.35],
  [-1.6, 49.72], // Cotentin tip (Cherbourg)
  [-1.62, 49.0],
  [-1.55, 48.62], // Mont-Saint-Michel bay
  [-2.02, 48.65], // Saint-Malo
  [-2.85, 48.6],
  [-3.6, 48.66],
  [-4.32, 48.68],
  [-4.78, 48.38], // Brest / Finistere tip
  [-4.72, 48.04], // Pointe du Raz
  [-4.32, 47.8],
  [-3.2, 47.6],
  [-2.5, 47.45],
  [-2.18, 47.28], // Loire estuary
  [-1.82, 46.5], // Vendee
  [-1.55, 46.16], // La Rochelle
  [-1.08, 45.6], // Gironde mouth
  [-1.25, 44.65], // Arcachon
  [-1.48, 43.49], // Biarritz
  [-1.78, 43.35], // Hendaye (Spanish border)
  [-0.7, 42.8], // Pyrenees
  [0.65, 42.7],
  [1.45, 42.5], // Andorra
  [2.65, 42.34], // Cerbere
  [3.05, 42.47], // Perpignan coast
  [3.0, 43.0],
  [3.88, 43.55], // Montpellier
  [4.85, 43.4], // Camargue
  [5.35, 43.3], // Marseille
  [5.93, 43.12], // Toulon
  [6.6, 43.16], // Saint-Tropez
  [7.27, 43.69], // Nice
  [7.52, 43.78], // Menton (Italian border)
  [6.95, 44.3],
  [7.0, 44.95],
  [6.8, 45.5],
  [7.05, 45.92], // Mont Blanc
  [6.1, 46.2], // Geneva
  [6.45, 46.65],
  [7.0, 47.5], // Basel
  [7.58, 47.6],
  [8.22, 48.0], // Rhine / Alsace bulge
  [7.8, 48.65],
  [8.1, 49.0], // Lauterbourg (NE corner)
  [6.7, 49.2], // Luxembourg border
  [5.8, 49.55], // Belgian Ardennes
  [4.85, 49.8],
  [4.15, 50.0], // Givet salient
  [3.65, 50.38],
  [3.15, 50.52], // Lille area
  [2.55, 50.8],
  [2.45, 51.05],
];

// Corsica, as a small detached island for flavour.
export const CORSICA_OUTLINE: LonLat[] = [
  [9.36, 43.0],
  [9.55, 42.7],
  [9.5, 42.35],
  [9.4, 41.9],
  [9.23, 41.38], // Bonifacio
  [8.8, 41.55],
  [8.7, 41.95],
  [8.6, 42.35],
  [8.7, 42.6],
  [9.0, 42.8],
  [9.36, 43.0],
];

export function outlineToWorld(outline: LonLat[]): Array<[number, number]> {
  return outline.map(projectLonLat);
}

// Approximate projected extents, used to size the surrounding sea plane / grid.
export const FRANCE_BOUNDS = (() => {
  const pts = FRANCE_OUTLINE.map(projectLonLat);
  const xs = pts.map((p) => p[0]);
  const zs = pts.map((p) => p[1]);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
    centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
    centerZ: (Math.min(...zs) + Math.max(...zs)) / 2,
  };
})();
