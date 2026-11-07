// Dev tool: builds data/doorfietsroutes.geojson with the provincial through-routes
// (doorfietsroutes) listed at
// https://www.provincie-utrecht.nl/onderwerpen/mobiliteit/fiets/doorfietsroutes
// that are not already in data/routes.geojson. Anchors are geocoded with Nominatim
// and routed over the real network with the public OSM bike router (OSRM demo).
// The lines are approximate, NOT the official alignments. Usage: node tools/build-doorfietsroutes.mjs
import { writeFileSync } from 'node:fs';

const PAGE = 'https://www.provincie-utrecht.nl/onderwerpen/mobiliteit/fiets/doorfietsroutes/';
const ROUTING = 'https://routing.openstreetmap.de/routed-bike/route/v1/driving/';
const UA = 'utrecht-mapstory-dev-tool/1.0';

// Anchors are [lon, lat] or a geocoding query string.
const CENTRAAL = [5.1101, 52.0894];
const ROUTES = [
  {
    id: 'doorfietsroute-woerden-utrecht-f12', slug: 'doorfietsroute-woerden-utrecht-f12', code: 'F12',
    nl: 'Doorfietsroute Woerden–Utrecht (F12)', en: 'Woerden–Utrecht cycling route (F12)',
    anchors: ['Woerden station', [4.9625, 52.0894], CENTRAAL], status: 'afgerond', planning: ['Klaar; het Woerdense deel is in februari 2026 geopend', 'Completed; the Woerden section opened in February 2026'],
    links: ['Woerden', 'Utrecht Centraal']
  },
  {
    id: 'doorfietsroute-utrecht-ijsselstein-f408', slug: 'doorfietsroute-f408-utrecht-ijsselstein', code: 'F408',
    nl: 'Doorfietsroute Utrecht–IJsselstein (F408)', en: 'Utrecht–IJsselstein cycling route (F408)',
    anchors: [CENTRAAL, 'Nieuwegein City station', 'IJsselstein station'], status: 'in uitvoering', planning: ['IJsselstein klaar; Nieuwegein werkt in 2026 aan de rest', 'IJsselstein completed; Nieuwegein is building the rest in 2026'],
    links: ['Utrecht Centraal', 'IJsselstein']
  },
  {
    id: 'doorfietsroute-usp-veenendaal-f225', slug: 'doorfietsroute-f225-utrecht-science-park-veenendaal-0', code: 'F225',
    nl: 'Doorfietsroute Utrecht Science Park–Veenendaal (F225)', en: 'Utrecht Science Park–Veenendaal cycling route (F225)',
    anchors: ['Utrecht Science Park', 'Driebergen-Zeist station', 'Veenendaal-De Klomp station'], status: 'in uitvoering', planning: ['Aanleg gestart in 2024; werkzaamheden lopen door tot 2027', 'Construction started in 2024; works continue until 2027'],
    links: ['Utrecht Science Park', 'Zeist', 'Driebergen', 'Veenendaal']
  },
  {
    id: 'doorfietsroute-hilversum-amersfoort-f1', slug: 'doorfietsroute-f1-hilversum-amersfoort', code: 'F1',
    nl: 'Doorfietsroute Hilversum–Amersfoort (F1)', en: 'Hilversum–Amersfoort cycling route (F1)',
    anchors: [[5.1813, 52.2265], 'Baarn station', 'Amersfoort Centraal'], status: 'in uitvoering', planning: ['Volgens planning alle onderdelen klaar in 2027', 'All parts due to be completed in 2027'],
    links: ['Hilversum', 'Baarn', 'Soest', 'Amersfoort']
  },
  {
    id: 'doorfietsroute-houten-castellum-usp-f27', slug: 'doorfietsroute-houten-castelleum-utrecht-science-park-f27', code: 'F27',
    nl: 'Doorfietsroute Houten Castellum–Utrecht Science Park (F27)', en: 'Houten Castellum–Utrecht Science Park cycling route (F27)',
    anchors: ['Houten Castellum', 'Utrecht Science Park'], status: 'in voorbereiding', planning: ['Streven: verbeteringen eind 2027 gerealiseerd', 'Aim: improvements completed by the end of 2027'],
    links: ['Houten', 'Utrecht Science Park']
  },
  {
    id: 'doorfietsroute-houten-lage-weide-f409', slug: 'doorfietsroute-houten-lage-weide-f409', code: 'F409',
    nl: 'Doorfietsroute Houten–Lage Weide (F409)', en: 'Houten–Lage Weide cycling route (F409)',
    anchors: ['Houten station', 'Lage Weide Utrecht'], status: 'in uitvoering', planning: ['Houten en Nieuwegein bijna klaar; Utrecht rondt eind 2028 af', 'Houten and Nieuwegein nearly done; Utrecht completes by the end of 2028'],
    links: ['Houten', 'Lage Weide']
  },
  {
    id: 'doorfietsroute-amersfoort-bunschoten-f199', slug: 'doorfietsroute-f199-amersfoort-bunschoten', code: 'F199',
    nl: 'Doorfietsroute Amersfoort–Bunschoten (F199)', en: 'Amersfoort–Bunschoten cycling route (F199)',
    anchors: ['Amersfoort Centraal', 'Bunschoten-Spakenburg'], status: 'afgerond', planning: ['Opgeleverd in mei 2024; de eerste doorfietsroute van de provincie', 'Completed in May 2024; the province\'s first through-route'],
    links: ['Amersfoort', 'Bunschoten']
  },
  {
    id: 'doorfietsroute-houten-utrecht-centrum', slug: '', code: '',
    nl: 'Doorfietsroute Houten–Utrecht-Centrum', en: 'Houten–Utrecht-Centrum cycling route',
    anchors: ['Houten station', [5.1400, 52.0700], CENTRAAL], status: 'gepland', development: true,
    links: ['Houten', 'Utrecht Centraal']
  },
  {
    id: 'doorfietsroute-houten-culemborg', slug: '', code: '',
    nl: 'Doorfietsroute Houten–Culemborg', en: 'Houten–Culemborg cycling route',
    anchors: ['Houten station', 'Culemborg station'], status: 'gepland', development: true,
    links: ['Houten', 'Culemborg']
  },
  {
    id: 'doorfietsroute-amersfoort-usp', slug: '', code: '',
    nl: 'Doorfietsroute Amersfoort–Utrecht Science Park', en: 'Amersfoort–Utrecht Science Park cycling route',
    anchors: ['Amersfoort Centraal', 'Utrecht Science Park'], status: 'gepland', development: true,
    links: ['Amersfoort', 'Utrecht Science Park']
  },
  {
    id: 'doorfietsroute-mijdrecht-schiphol', slug: '', code: '',
    nl: 'Doorfietsroute Mijdrecht–Schiphol', en: 'Mijdrecht–Schiphol cycling route',
    anchors: ['Mijdrecht', 'Uithoorn', 'Schiphol Airport'], status: 'gepland', development: true,
    links: ['Mijdrecht', 'Schiphol']
  }
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round = (c) => [Number(c[0].toFixed(5)), Number(c[1].toFixed(5))];

async function geocode(query) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=nl&q=' + encodeURIComponent(query);
  const json = await (await fetch(url, { headers: { 'User-Agent': UA } })).json();
  await sleep(1100);
  if (!json.length) throw new Error('No geocode for ' + query);
  return [Number(json[0].lon), Number(json[0].lat)];
}

async function snap(coords) {
  const path = coords.map((c) => c.join(',')).join(';');
  const data = await (await fetch(`${ROUTING}${path}?overview=full&geometries=geojson&continue_straight=false`)).json();
  await sleep(1200);
  if (data.code !== 'Ok') throw new Error(data.code);
  return data.routes[0].geometry.coordinates.map(round);
}

const features = [];
for (const r of ROUTES) {
  try {
    const coords = [];
    for (const a of r.anchors) coords.push(typeof a === 'string' ? await geocode(a) : a);
    const line = await snap(coords);
    const label = r.code ? ` (${r.code})` : '';
    const url = r.slug ? PAGE + r.slug : PAGE.slice(0, -1);
    features.push({
      type: 'Feature',
      properties: {
        id: r.id,
        title: { nl: r.nl, en: r.en },
        category: 'doorfietsroute',
        status: r.status,
        major: false,
        planning: r.planning
          ? { nl: r.planning[0], en: r.planning[1] }
          : {
            nl: r.development ? 'In ontwikkeling; zie de overzichtspagina van de provincie' : 'Zie de projectpagina van de provincie voor de actuele planning',
            en: r.development ? 'Under development; see the province overview page' : 'See the province project page for the latest planning'
          },
        description: {
          nl: `Doorfietsroute${label} tussen ${r.links[0]} en ${r.links[r.links.length - 1]}: een comfortabele, snelle fietsverbinding uit het regionale fietsnetwerk van de provincie Utrecht.`,
          en: `Through-route${label} between ${r.links[0]} and ${r.links[r.links.length - 1]}: a fast, comfortable link in the Province of Utrecht's regional cycling network.`
        },
        goals: 'fiets, veiligheid',
        benefits: {
          nl: { cycling: 'Vlot en comfortabel fietsen over langere afstanden.', green: '', safety: 'Meer ruimte en vaker voorrang voor fietsers.' },
          en: { cycling: 'Fast and comfortable cycling over longer distances.', green: '', safety: 'More space and more priority for cyclists.' }
        },
        connections: {
          nl: 'Onderdeel van het netwerk van veertien doorfietsroutes van de provincie Utrecht.',
          en: 'Part of the Province of Utrecht\'s network of fourteen through-routes.'
        },
        url,
        urlType: r.slug ? 'province' : 'overview',
        source: 'provincie-utrecht.nl'
      },
      geometry: { type: 'LineString', coordinates: line }
    });
    console.log(r.id, coords.length, '->', line.length, 'pts');
  } catch (error) {
    console.warn('Skipped', r.id, error.message);
  }
}

const collection = {
  type: 'FeatureCollection',
  name: 'doorfietsroutes',
  note: 'Approximate lines routed over the OSM bike network between anchor points; not official alignments. Source list: provincie-utrecht.nl. Verify before publication.',
  features
};
writeFileSync(new URL('../data/doorfietsroutes.geojson', import.meta.url), JSON.stringify(collection));
console.log('written', features.length);
