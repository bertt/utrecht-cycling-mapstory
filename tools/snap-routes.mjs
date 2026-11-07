// Dev tool: builds detailed LineStrings in data/routes.geojson by routing between
// a few verified anchor points (stations, streets geocoded via Nominatim) on the
// real cycling network, using the public OSM bike router (OSRM demo server).
// Usage: node tools/snap-routes.mjs
// Routes follow the OSM bike router, not official project alignments. Review the
// result on the map and replace it with verified data before publication.
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../data/routes.geojson', import.meta.url);
const ENDPOINT = 'https://routing.openstreetmap.de/routed-bike/route/v1/driving/';

// Anchor points ([lon, lat]) per feature id. Few, on-street points avoid detours.
const CENTRAAL = [5.1101, 52.0894];
const WAYPOINTS = {
  'fietsroute-om-de-noord': [[5.0893, 52.1033], [5.1252, 52.1113], [5.1775, 52.0915]],
  'doorfietsroute-utrecht-amersfoort': [CENTRAAL, [5.1775, 52.0915], [5.3741, 52.1539]],
  'fietsroute-om-de-zuid': [[5.1429, 52.0657], [5.1459, 52.0784]],
  'koningsweg': [[5.1413, 52.0747], [5.1583, 52.0655]],
  'doorfietsroute-utrecht-hilversum': [CENTRAAL, [5.2049, 52.1307], [5.1813, 52.2265]],
  'dom-tot-damroute': [CENTRAAL, [5.0320, 52.1361], [4.9913, 52.1701], [5.0440, 52.3122], [4.8936, 52.3731]],
  'fietsroute-utrecht-houten-f409': [CENTRAAL, [5.1702, 52.0326]],
  'weerdsingel-oostzijde': [[5.1195, 52.0955], [5.1215, 52.1000]],
  'ockhuizerweg-polderweg': [[4.9948, 52.1257], [4.9887, 52.1300]]
};

const round = (c) => [Number(c[0].toFixed(5)), Number(c[1].toFixed(5))];

async function snap(coords) {
  const path = coords.map((c) => c.join(',')).join(';');
  const url = `${ENDPOINT}${path}?overview=full&geometries=geojson&continue_straight=false`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.code !== 'Ok') throw new Error(data.code + ' ' + (data.message || ''));
  return data.routes[0].geometry.coordinates.map(round);
}

const collection = JSON.parse(await readFile(FILE, 'utf8'));
for (const feature of collection.features) {
  const waypoints = WAYPOINTS[feature.properties.id];
  if (feature.geometry.type !== 'LineString' || !waypoints) continue;
  try {
    const snapped = await snap(waypoints);
    console.log(feature.properties.id, waypoints.length, '->', snapped.length);
    feature.geometry.coordinates = snapped;
  } catch (error) {
    console.warn('Skipped', feature.properties.id, error.message);
  }
  await new Promise((resolve) => setTimeout(resolve, 1200)); // be polite to the public server
}
await writeFile(FILE, JSON.stringify(collection, null, 2) + '\n');
