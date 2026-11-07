// Dev tool: builds data/redesigns.geojson from the official utrecht.nl project pages.
// For each project it reads phase, start year and the meta description from the page and
// geocodes a representative point with Nominatim. Points are approximate starting points.
// Usage: node tools/build-redesigns.mjs
import { writeFileSync } from 'node:fs';

const BASE = 'https://www.utrecht.nl/wonen-en-leven/verkeer/verkeersprojecten/';
const UA = 'utrecht-mapstory-dev-tool/1.0';

// [page path, Dutch title, English title, geocoding query, kind]
// kind: street (redesign), bridge, safety, bus
const PROJECTS = [
  ['aanpak-zuidpoort-en-omgeving/ledig-erf-deel-catharijnesingel-en-bleekstraat-opnieuw-inrichten', 'Ledig Erf, Catharijnesingel en Bleekstraat', 'Ledig Erf, Catharijnesingel and Bleekstraat', 'Ledig Erf', 'street'],
  ['binnenstad/catharijnesingel-inrichten-als-bestemming', 'Catharijnesingel inrichten als bestemming', 'Catharijnesingel as a destination', 'Catharijnesingel', 'street'],
  ['binnenstad/janskerkhof-riool-vervangen-en-nieuwe-inrichting', 'Janskerkhof: riool en nieuwe inrichting', 'Janskerkhof: sewer and new layout', 'Janskerkhof', 'street'],
  ['binnenstad/lange-jufferstraat-vervangen-riolering', 'Lange Jufferstraat: riolering vervangen', 'Lange Jufferstraat: sewer replacement', 'Lange Jufferstraat', 'street'],
  ['binnenstad/verbeteren-kwaliteit-winkelstraten-binnenstad', 'Winkelstraten binnenstad', 'City-centre shopping streets', 'Steenweg', 'street'],
  ['leidsche-rijn/langerakbaan-nieuwe-inrichting', 'Langerakbaan nieuwe inrichting', 'Langerakbaan redesign', 'Langerakbaan', 'street'],
  ['noordoost/biltse-rading-verbeteren-verkeersveiligheid', 'Biltse Rading: verkeersveiligheid', 'Biltse Rading: road safety', 'Biltse Rading', 'safety'],
  ['noordoost/blauwkapelseweg-en-alexander-numankade-proef-uitschakelen-verkeerslichten', 'Blauwkapelseweg - Alexander Numankade', 'Blauwkapelseweg - Alexander Numankade', 'Alexander Numankade', 'safety'],
  ['noordoost/draaiweg-en-omgeving-verkeersveiligheid-verbeteren', 'Draaiweg verkeersveiliger maken', 'Draaiweg road safety', 'Draaiweg', 'safety'],
  ['noordoost/omgeving-school-nimeto-opnieuw-inrichten', 'Nimeto: omgeving school', 'Nimeto: school surroundings', 'Nimeto Utrecht', 'street'],
  ['noordoost/tuinwijkroute-opnieuw-inrichten', 'Tuinwijkroute herinrichten', 'Tuinwijkroute redesign', 'Tuinwijk Utrecht', 'street'],
  ['noordwest/boorstraat-tunnel-voor-fietsers-en-voetgangers', 'Boorstraat: tunnel voor fietsers en voetgangers', 'Boorstraat: cycling and pedestrian tunnel', 'Boorstraat', 'bridge'],
  ['noordwest/zuilen-nieuwe-inrichting-wegen', 'Julianaparklaan en Sweder van Zuylenweg', 'Julianaparklaan and Sweder van Zuylenweg', 'Julianaparklaan', 'street'],
  ['oost/cambridgelaan-opnieuw-inrichten', 'Cambridgelaan opnieuw inrichten', 'Cambridgelaan redesign', 'Cambridgelaan', 'street'],
  ['oost/ina-boudier-bakkerlaan-en-omgeving-opnieuw-inrichten', 'Ina Boudier-Bakkerlaan en omgeving', 'Ina Boudier-Bakkerlaan and surroundings', 'Ina Boudier-Bakkerlaan', 'street'],
  ['oost/jan-van-scorelstraat-verbeteren', 'Jan van Scorelstraat verbeteren', 'Jan van Scorelstraat improvements', 'Jan van Scorelstraat', 'street'],
  ['oost/maliebaan', 'Maliebaan: verbeteren straat', 'Maliebaan street improvements', 'Maliebaan', 'street'],
  ['oost/mytylbrug-aanleggen', 'Mytylbrug aanleggen', 'Mytylbrug construction', 'Mytyl Utrecht', 'bridge'],
  ['overvecht/amazonekwartier-opnieuw-inrichten', 'Amazonekwartier opnieuw inrichten', 'Amazonekwartier redesign', 'Amazonedreef', 'street'],
  ['overvecht/donaudreef-verkeersveiliger-maken', 'Donaudreef verkeersveiliger maken', 'Donaudreef road safety', 'Donaudreef', 'safety'],
  ['overvecht/gageldijk-opnieuw-inrichten', 'Gageldijk opnieuw inrichten', 'Gageldijk redesign', 'Gageldijk', 'street'],
  ['overvecht/taagdreef-en-omgeving-opnieuw-inrichten-openbare-ruimte', 'Taagdreef en omgeving', 'Taagdreef and surroundings', 'Taagdreef', 'street'],
  ['vleuten-de-meern/burgemeester-middelweerbaan-proef-stoplichten-uitschakelen', 'Burgemeester Middelweerbaan: proef stoplichten', 'Burgemeester Middelweerbaan: traffic light trial', 'Middelweerbaan', 'safety'],
  ['vleuten-de-meern/castellumlaan-opnieuw-inrichten', 'Castellumlaan opnieuw inrichten', 'Castellumlaan redesign', 'Castellumlaan', 'street'],
  ['vleuten-de-meern/meernbrug-hefbrug-centrum-de-meern-verbeteren-verkeersveiligheid', 'Meernbrug: verkeersveiligheid', 'Meernbrug: road safety', 'Meernbrug', 'bridge'],
  ['vleuten-de-meern/vervangen-loobrug', 'Loobrug vervangen', 'Loobrug replacement', 'Loobrug', 'bridge'],
  ['west/kanaalstraat-en-damstraat-opnieuw-inrichten', 'Kanaalstraat en Damstraat', 'Kanaalstraat and Damstraat', 'Damstraat', 'street'],
  ['west/niels-bohrweg-verkeersveiliger-maken', 'Niels Bohrweg opnieuw inrichten', 'Niels Bohrweg redesign', 'Niels Bohrweg', 'street'],
  ['west/vleutenseweg-verkeersveiliger-maken', 'Verkeersveiligheidsonderzoek Vleutenseweg', 'Vleutenseweg road safety study', 'Vleutenseweg', 'safety'],
  ['west/welgelegen-en-den-hommel-opnieuw-inrichten', 'Welgelegen en Den Hommel', 'Welgelegen and Den Hommel', 'Welgelegen Utrecht', 'street'],
  ['zuid/oudegeinlaan-en-omgeving-opnieuw-inrichten', 'Oudegeinlaan en omgeving', 'Oudegeinlaan and surroundings', 'Oudegeinlaan', 'street'],
  ['zuid/rotsoord-opnieuw-inrichten', 'Rotsoord opnieuw inrichten', 'Rotsoord redesign', 'Rotsoord', 'street'],
  ['zuidwest/afrikalaan-en-omgeving-opnieuw-inrichten', 'Afrikalaan en omgeving', 'Afrikalaan and surroundings', 'Afrikalaan', 'street'],
  ['zuidwest/bernadottelaan-bevinlaan-en-omgeving-opnieuw-inrichten', 'Bernadottelaan, Bevinlaan en omgeving', 'Bernadottelaan, Bevinlaan and surroundings', 'Bernadottelaan', 'street'],
  ['zuidwest/europalaan-zuid-busbaan-uitbreiden', 'Europalaan-Zuid: busbaan uitbreiden', 'Europalaan-Zuid: bus lane extension', 'Europalaan', 'bus'],
  ['zuidwest/fietsbrug-en-fietsroute-van-papendorp-naar-24-oktoberplein', 'Fietsbrug en fietsroute Papendorp - 24 Oktoberplein', 'Cycle bridge and route Papendorp - 24 Oktoberplein', 'Papendorp Utrecht', 'bridge'],
  ['zuidwest/kanaleneiland-zuid-midden-opnieuw-inrichten', 'Kanaleneiland-Zuid midden', 'Kanaleneiland-Zuid centre', 'Kanaleneiland Utrecht', 'street'],
  ['zuidwest/lanslaan-lomanlaan-noordelijke-wandel-en-fietsroute', 'Lanslaan-Lomanlaan: wandel- en fietsroute', 'Lanslaan-Lomanlaan: walking and cycling route', 'Lomanlaan', 'street'],
  ['zuidwest/socrateslaan-nieuwe-inrichting', 'Socrateslaan opnieuw inrichten', 'Socrateslaan redesign', 'Socrateslaan', 'street'],
  ['zuidwest/van-heuven-goedhartlaan-en-omgeving-opnieuw-inrichten', 'Van Heuven Goedhartlaan en omgeving', 'Van Heuven Goedhartlaan and surroundings', 'Van Heuven Goedhartlaan', 'street'],
  ['zuidwest/vasco-da-gamalaan-en-omgeving-opnieuw-inrichten', 'Vasco da Gamalaan en omgeving', 'Vasco da Gamalaan and surroundings', 'Vasco da Gamalaan', 'street'],
  ['zuidwest/waalstraat-en-zijldiepstraat-opnieuw-inrichten', 'Waalstraat, Zijldiepstraat en Merwedeplantsoen', 'Waalstraat, Zijldiepstraat and Merwedeplantsoen', 'Zijldiepstraat', 'street']
];

const KIND = {
  street: {
    goals: 'fiets, groen, veiligheid, leefbaarheid',
    descEn: 'The street is being redesigned with more room for walking, cycling and greenery.',
    cyclingNl: 'Meer en veiligere ruimte voor fietsers.', cyclingEn: 'More and safer space for cyclists.',
    greenNl: 'Meer groen en ruimte om te verblijven.', greenEn: 'More greenery and space to linger.',
    safetyNl: 'Rustiger verkeer en veiligere oversteken.', safetyEn: 'Calmer traffic and safer crossings.'
  },
  safety: {
    goals: 'fiets, veiligheid',
    descEn: 'Measures to make traffic safer for pedestrians and cyclists.',
    cyclingNl: 'Veiliger fietsen.', cyclingEn: 'Safer cycling.',
    greenNl: '', greenEn: '',
    safetyNl: 'Aanpassingen die de verkeersveiligheid vergroten.', safetyEn: 'Changes that improve road safety.'
  },
  bridge: {
    goals: 'fiets, veiligheid',
    descEn: 'A new or improved crossing that connects routes for pedestrians and cyclists.',
    cyclingNl: 'Betere verbindingen voor fietsers.', cyclingEn: 'Better connections for cyclists.',
    greenNl: '', greenEn: '',
    safetyNl: 'Veiliger oversteken.', safetyEn: 'Safer crossings.'
  },
  bus: {
    goals: 'overstappen, leefbaarheid',
    descEn: 'Improved bus infrastructure for faster and more reliable public transport.',
    cyclingNl: '', cyclingEn: '',
    greenNl: '', greenEn: '',
    safetyNl: 'Betere bereikbaarheid met het openbaar vervoer.', safetyEn: 'Better access by public transport.'
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&rsquo;/g, "'").replace(/&nbsp;/g, ' ');

async function geocode(query) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&bounded=1&viewbox=4.95,52.15,5.25,52.03&q='
    + encodeURIComponent(`${query}, Utrecht`);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const json = await res.json();
  return json.length ? [Number(Number(json[0].lon).toFixed(5)), Number(Number(json[0].lat).toFixed(5))] : null;
}

function phaseOf(text) {
  const m = text.match(/Fase project:?\s*(in voorbereiding|in uitvoering|gepland|uitgesteld|afgerond)(?:\s+(?:Start uitvoering|Start werkzaamheden|Geplande bouw|Waarschijnlijk klaar in|Start bouw|Oplevering):?\s*(\S+(?: \S+){0,3}?)(?=\s[A-Z]|$))?/i);
  const status = m ? m[1].toLowerCase() : 'in voorbereiding';
  const start = m && m[2] ? m[2].trim() : '';
  return { status, start };
}

// Concrete planning taken from the project pages where the "Fase project" line has no date.
const PLANNING = {
  'catharijnesingel-inrichten-als-bestemming': {
    status: 'afgerond',
    nl: 'Uitgevoerd: afgesloten voor doorgaand autoverkeer sinds 21 september 2026; boetes vanaf 1 januari 2027',
    en: 'Completed: closed to through traffic since 21 September 2026; fines from 1 January 2027'
  },
  'meernbrug-hefbrug-centrum-de-meern-verbeteren-verkeersveiligheid': {
    nl: 'Besluit door nieuw college najaar 2026; eerste maatregelen in 2026, fietsstraat Castellumlaan voorlopig 2027',
    en: 'Decision by the new council in autumn 2026; first measures in 2026, Castellumlaan cycle street provisionally 2027'
  },
  'welgelegen-en-den-hommel-opnieuw-inrichten': {
    nl: 'Uitvoering 2027–2028; start naar verwachting begin 2027',
    en: 'Construction 2027–2028; start expected in early 2027'
  },
  'kanaleneiland-zuid-midden-opnieuw-inrichten': {
    nl: 'Ontwerp 2025–2027; start werkzaamheden waarschijnlijk in 2028',
    en: 'Design 2025–2027; works probably start in 2028'
  },
  'biltse-rading-verbeteren-verkeersveiligheid': {
    nl: 'Voetgangersoversteek al aangepast; start verdere aanpassingen nog niet bekend',
    en: 'Pedestrian crossing already improved; start of further changes not yet known'
  },
  'boorstraat-tunnel-voor-fietsers-en-voetgangers': {
    nl: 'Ontwerp voorgelegd aan het college in september 2026; raadsbesluit verwacht in 2027; bouw nog niet gepland',
    en: 'Design presented to the council in September 2026; council decision expected in 2027; construction not yet scheduled'
  },
  'castellumlaan-opnieuw-inrichten': {
    nl: 'Riolering wordt binnen enkele jaren vervangen; start uitvoering nog niet bekend',
    en: 'Sewer to be replaced within a few years; construction start not yet known'
  }
};

const features = [];
for (const [path, nl, en, query, kind] of PROJECTS) {
  const url = BASE + path;
  const html = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  const text = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
  const meta = decode((html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) || html.match(/<meta[^>]+content="([^"]*)"[^>]+name="description"/i) || [])[1] || '');
  const parsed = phaseOf(text);
  const known = PLANNING[path.split('/').pop()];
  const status = known?.status || parsed.status;
  const start = known ? '' : parsed.start;
  const coord = await geocode(query);
  await sleep(1100);
  if (!coord) { console.log('NO GEOCODE', query); continue; }
  const k = KIND[kind];
  const planningNl = known ? known.nl : start ? `Planning: ${start}` : 'Zie de projectpagina voor de actuele planning';
  const planningEn = known ? known.en : start ? `Planning: ${start.replace(/nog niet bekend/i, 'not yet known')}` : 'See the project page for the latest planning';
  features.push({
    type: 'Feature',
    properties: {
      id: path.split('/').pop(),
      title: { nl, en },
      category: 'herinrichting',
      status,
      major: false,
      planning: { nl: planningNl, en: planningEn },
      description: { nl: meta || `${nl}: zie de projectpagina.`, en: `${en}. ${k.descEn}` },
      goals: k.goals,
      benefits: {
        nl: { cycling: k.cyclingNl, green: k.greenNl, safety: k.safetyNl },
        en: { cycling: k.cyclingEn, green: k.greenEn, safety: k.safetyEn }
      },
      connections: {
        nl: 'Onderdeel van de verkeersprojecten van gemeente Utrecht.',
        en: 'Part of the traffic projects of the Municipality of Utrecht.'
      },
      url
    },
    geometry: { type: 'Point', coordinates: coord }
  });
  console.log(status.padEnd(16), (start || '-').padEnd(18), coord.join(','), nl);
}

const collection = {
  type: 'FeatureCollection',
  name: 'redesigns',
  note: 'Approximate geocoded points (Nominatim/OpenStreetMap) for utrecht.nl traffic projects. Not official project boundaries; verify before publication.',
  features
};
writeFileSync(new URL('../data/redesigns.geojson', import.meta.url), JSON.stringify(collection, null, 2));
console.log('written', features.length);
