// Replaces the approximate (OSRM) F-route geometry with the official geometry from the
// Province of Utrecht "Doorfietsroutes" StoryMaps collection
// (https://storymaps.arcgis.com/collections/06fbc6b7eac446efb767fc5acb4323f2).
//
// Sources (ArcGIS Online, public):
//   - Snelfietsroutes FeatureServer/0   official routes (item 4: current routes)
//   - Doorfietsroute_Dom_tot_Dam        Dom tot Dam route
//   - web map d41a57b3... "Schetsen"    four sketched study routes (item 3: new routes)
//
// Usage: node tools/build-province-geometry.mjs
import { readFile, writeFile } from 'node:fs/promises';

const BASE = 'https://services.arcgis.com/m4kxECHTi6Dj9hfa/arcgis/rest/services';
const SKETCH_MAP = 'https://www.arcgis.com/sharing/rest/content/items/d41a57b30891473c9316db30237b35d9/data?f=json';

// Official route number + name -> feature id in our data files.
const OFFICIAL = [
  { id: 'doorfietsroute-usp-veenendaal-f225', file: 'doorfietsroutes', nummer: 225, name: /Veenendaal - USP$/ },
  { id: 'doorfietsroute-utrecht-amersfoort', file: 'routes', nummer: 28 },
  { id: 'doorfietsroute-woerden-utrecht-f12', file: 'doorfietsroutes', nummer: 12 },
  { id: 'doorfietsroute-utrecht-ijsselstein-f408', file: 'doorfietsroutes', nummer: 408 },
  { id: 'doorfietsroute-hilversum-amersfoort-f1', file: 'doorfietsroutes', nummer: 1 },
  { id: 'doorfietsroute-amersfoort-bunschoten-f199', file: 'doorfietsroutes', nummer: 199 },
  { id: 'doorfietsroute-utrecht-hilversum', file: 'routes', nummer: 27, name: /Hilversum - Utrecht/ },
  { id: 'doorfietsroute-houten-castellum-usp-f27', file: 'doorfietsroutes', nummer: 27, name: /Castellum/ },
  { id: 'doorfietsroute-houten-lage-weide-f409', file: 'doorfietsroutes', nummer: 409 }
];

// The four sketches are unnamed; they are told apart by their position.
const SKETCHES = [
  { id: 'doorfietsroute-houten-utrecht-centrum', test: (c) => c[0] > 5.1 && c[0] < 5.2 && c[1] < 52.09 && c[1] > 52.03 },
  { id: 'doorfietsroute-houten-culemborg', test: (c) => c[1] < 52.03 },
  { id: 'doorfietsroute-amersfoort-usp', test: (c) => c[0] >= 5.2 },
  { id: 'doorfietsroute-mijdrecht-schiphol', test: (c) => c[0] < 5.1 }
];

const getJson = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': 'utrecht-cycling-mapstory build script' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};

const lines = (geometry) => (geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates);
const round = (c) => [Math.round(c[0] * 1e6) / 1e6, Math.round(c[1] * 1e6) / 1e6];
const toGeometry = (parts) => {
  const clean = parts.map((p) => p.map(round));
  return clean.length === 1 ? { type: 'LineString', coordinates: clean[0] } : { type: 'MultiLineString', coordinates: clean };
};
const centroid = (parts) => {
  const all = parts.flat();
  return [all.reduce((s, c) => s + c[0], 0) / all.length, all.reduce((s, c) => s + c[1], 0) / all.length];
};
// RD New (EPSG:28992) to WGS84, series approximation (accurate to about 1 m).
const rdToLngLat = ([x, y]) => {
  const dx = (x - 155000) / 1e5;
  const dy = (y - 463000) / 1e5;
  const K = [[0, 1, 3235.65389], [2, 0, -32.58297], [0, 2, -0.24750], [2, 1, -0.84978], [0, 3, -0.06550], [2, 2, -0.01709], [1, 0, -0.00738], [4, 0, 0.00530], [2, 3, -0.00039], [4, 1, 0.00033], [1, 1, -0.00012]];
  const L = [[1, 0, 5260.52916], [1, 1, 105.94684], [1, 2, 2.45656], [3, 0, -0.81885], [1, 3, 0.05594], [3, 1, -0.05607], [0, 1, 0.01199], [3, 2, -0.00256], [1, 4, 0.00128], [0, 2, 0.00022], [2, 0, -0.00022], [5, 0, 0.00026]];
  const sum = (terms) => terms.reduce((s, [p, q, v]) => s + v * dx ** p * dy ** q, 0);
  return [5.38720621 + sum(L) / 3600, 52.15517440 + sum(K) / 3600];
};

const files = {
  routes: JSON.parse(await readFile('data/routes.geojson', 'utf8')),
  doorfietsroutes: JSON.parse(await readFile('data/doorfietsroutes.geojson', 'utf8'))
};
const setGeometry = (file, id, geometry) => {
  const feature = files[file].features.find((f) => f.properties.id === id);
  if (!feature) throw new Error(`Feature ${id} not found`);
  feature.geometry = geometry;
  console.log(`${id}: ${geometry.type}, ${lines(geometry).flat().length} points`);
};
const fileOf = (id) => (files.routes.features.some((f) => f.properties.id === id) ? 'routes' : 'doorfietsroutes');

// Current routes (preferred routes only; variants are left out)
const official = await getJson(`${BASE}/Snelfietsroutes/FeatureServer/0/query?where=${encodeURIComponent("Type='Voorkeursroute'")}&outFields=*&outSR=4326&f=geojson`);
for (const spec of OFFICIAL) {
  const parts = official.features
    .filter((f) => f.properties.Nummer === spec.nummer && (!spec.name || spec.name.test(f.properties.Naam.trim())))
    .flatMap((f) => lines(f.geometry));
  if (!parts.length) throw new Error(`No official geometry for ${spec.id}`);
  setGeometry(spec.file, spec.id, toGeometry(parts));
}

// Dom tot Dam
const dom = await getJson(`${BASE}/Doorfietsroute_Dom_tot_Dam/FeatureServer/2/query?where=1%3D1&outFields=*&outSR=4326&f=geojson`);
const domParts = dom.features.flatMap((f) => lines(f.geometry));
setGeometry('routes', 'dom-tot-damroute', toGeometry(domParts));

// Study routes (sketches in RD New). The sketches are straight schematic lines, so they
// are snapped to the cycling network with the OSM bike router, using the sketch vertices as waypoints.
const ROUTER = 'https://routing.openstreetmap.de/routed-bike/route/v1/driving/';
const snap = async (path) => {
  const waypoints = path.map((c) => c.join(',')).join(';');
  try {
    const res = await getJson(`${ROUTER}${waypoints}?overview=full&geometries=geojson&continue_straight=false`);
    return res.routes[0].geometry.coordinates;
  } catch (error) {
    console.warn('Snapping failed, keeping the straight sketch:', error.message);
    return path;
  }
};
const sketchMap = await getJson(SKETCH_MAP);
const sketchLayer = sketchMap.operationalLayers[0].featureCollection.layers.find((l) => l.layerDefinition.geometryType === 'esriGeometryPolyline');
for (const feature of sketchLayer.featureSet.features) {
  const parts = feature.geometry.paths.map((path) => path.map(rdToLngLat));
  const c = centroid(parts);
  const spec = SKETCHES.find((s) => s.test(c));
  if (!spec) { console.warn('Unmatched sketch at', c); continue; }
  setGeometry(fileOf(spec.id), spec.id, toGeometry(await Promise.all(parts.map(snap))));
}

const writeCollection = (file, collection) => {
  const features = collection.features.map((f) => `    ${JSON.stringify(f)}`).join(',\n');
  return writeFile(file, `{\n  "type": "FeatureCollection",\n  "features": [\n${features}\n  ]\n}\n`);
};
await writeCollection('data/routes.geojson', files.routes);
await writeCollection('data/doorfietsroutes.geojson', files.doorfietsroutes);
