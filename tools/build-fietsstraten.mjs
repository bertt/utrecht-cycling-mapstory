// Dev tool: builds data/fietsstraten.geojson (bicycle streets / fietsstraten) from OpenStreetMap.
// Fetches ways tagged bicycle_road=yes or cyclestreet=yes in the Utrecht area via Overpass
// and merges the ways of each street name into one MultiLineString.
// Data: © OpenStreetMap contributors (ODbL). Usage: node tools/build-fietsstraten.mjs
import { writeFileSync } from 'node:fs';

const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
const BBOX = '52.04,5.03,52.14,5.20'; // south,west,north,east around the city of Utrecht
const QUERY = `[out:json][timeout:90][bbox:${BBOX}];(way["bicycle_road"="yes"];way["cyclestreet"="yes"];);out geom tags;`;

async function fetchOverpass() {
  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'User-Agent': 'utrecht-mapstory-dev-tool/1.0', Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(QUERY)
      });
      if (response.ok) return (await response.json()).elements;
      console.warn(endpoint, response.status);
    } catch (error) {
      console.warn(endpoint, error.message);
    }
  }
  throw new Error('All Overpass endpoints failed');
}

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const round = (n) => Math.round(n * 1e5) / 1e5;

const elements = (await fetchOverpass()).filter((e) => e.geometry && e.tags?.name);
const byName = new Map();
for (const e of elements) {
  const line = e.geometry.map((p) => [round(p.lon), round(p.lat)]);
  if (!byName.has(e.tags.name)) byName.set(e.tags.name, []);
  byName.get(e.tags.name).push(line);
}

const features = [...byName].sort(([a], [b]) => a.localeCompare(b)).map(([name, lines]) => ({
  type: 'Feature',
  properties: { id: 'fietsstraat-' + slug(name), name },
  geometry: { type: 'MultiLineString', coordinates: lines }
}));

const collection = {
  type: 'FeatureCollection',
  name: 'fietsstraten',
  note: 'Bicycle streets from OpenStreetMap (bicycle_road=yes / cyclestreet=yes). Data © OpenStreetMap contributors, ODbL. Check against official sources before publication.',
  features
};
writeFileSync(new URL('../data/fietsstraten.geojson', import.meta.url), JSON.stringify(collection));
console.log(`written ${features.length} streets from ${elements.length} ways`);
