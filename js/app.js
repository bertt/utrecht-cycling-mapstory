/**
 * Utrecht Cycles Forward – interactive bilingual map story.
 * Vanilla JavaScript + MapLibre GL JS. Strings live in js/translations.js.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------
  const STORAGE_KEY = 'utrecht-mapstory-lang';
  const DEFAULT_LANG = 'nl';
  const SUPPORTED_LANGS = ['nl', 'en'];
  const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
  const INITIAL_VIEW = { center: [5.1214, 52.0907], zoom: 12.2 };
  const FLY_DURATION = 1600;
  const DATA_FILES = ['data/routes.geojson', 'data/doorfietsroutes.geojson', 'data/projects.geojson', 'data/redesigns.geojson'];

  // Projects that are not realised yet ("coming"); everything else is "now".
  const UPCOMING = ['in voorbereiding', 'gepland', 'uitgesteld'];
  const UPCOMING_EXPRESSION = ['in', ['get', 'status'], ['literal', UPCOMING]];
  const ALL_PROJECTS_URL = 'https://www.utrecht.nl/wonen-en-leven/verkeer/verkeersprojecten';
  // F-route numbers for routes whose title does not contain one
  const F_NUMBER_OVERRIDES = {
    'doorfietsroute-utrecht-amersfoort': 'F28',
    'doorfietsroute-utrecht-hilversum': 'F27',
    'dom-tot-damroute': 'F2'
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileQuery = window.matchMedia('(max-width: 820px)');

  const COLORS = {
    blue: '#0077c8',
    green: '#2e8b57',
    amber: '#f2a541',
    purple: '#8a5cf6',
    orange: '#e4572e',
    teal: '#0f4c5c',
    gray: '#5d646b',
    cyclestreet: '#d1345b'
  };
  const CYCLESTREETS_FILE = 'data/fietsstraten.geojson';
  const CYCLESTREETS_SOURCE = 'cyclestreets';

  // Base colour and brighter "active" colour per project category.
  const CATEGORY_COLOR = {
    hoofdfietsroute: COLORS.blue,
    doorfietsroute: COLORS.green,
    herinrichting: COLORS.orange,
    fietsenstalling: COLORS.purple,
    buurtstalling: COLORS.purple
  };
  const CATEGORY_BRIGHT = {
    hoofdfietsroute: '#2aa0ff',
    doorfietsroute: '#3cb371',
    herinrichting: '#ff7a52',
    fietsenstalling: '#a98bff',
    buurtstalling: '#a98bff'
  };
  // Every F-route gets its own colour so routes can be told apart
  const F_ROUTE_COLORS = {
    'doorfietsroute-utrecht-amersfoort': '#2e8b57',
    'doorfietsroute-utrecht-hilversum': '#7b3fa0',
    'dom-tot-damroute': '#c77d00',
    'fietsroute-utrecht-houten-f409': '#0f4c5c',
    'doorfietsroute-woerden-utrecht-f12': '#6a8d1f',
    'doorfietsroute-utrecht-ijsselstein-f408': '#00897b',
    'doorfietsroute-usp-veenendaal-f225': '#8d5524',
    'doorfietsroute-hilversum-amersfoort-f1': '#d81b60',
    'doorfietsroute-houten-castellum-usp-f27': '#5d6d7e',
    'doorfietsroute-houten-lage-weide-f409': '#e0a800',
    'doorfietsroute-amersfoort-bunschoten-f199': '#7cb342',
    'doorfietsroute-houten-utrecht-centrum': '#b0719a',
    'doorfietsroute-houten-culemborg': '#a1887f',
    'doorfietsroute-amersfoort-usp': '#6d4c41',
    'doorfietsroute-mijdrecht-schiphol': '#9e9d24',
    'doorfietsroute-ede-veenendaal-f112': '#1e88e5',
    'doorfietsroute-bilthoven-uithof-houten': '#c62828'
  };
  const colorForFeature = (p) => F_ROUTE_COLORS[p.id] || CATEGORY_COLOR[p.category] || COLORS.gray;

  // Line widths (px at mid zoom) per category: thicker for main routes.
  const CATEGORY_WIDTH = {
    hoofdfietsroute: 4,
    doorfietsroute: 4,
    herinrichting: 2.6,
    fietsenstalling: 3,
    buurtstalling: 3
  };

  // Thematic highlight colours used by chapters that focus on a theme.
  const HIGHLIGHTS = {
    green: { color: COLORS.green, bright: '#3fcf7f' },
    amber: { color: COLORS.amber, bright: '#ffc15c' },
    teal: { color: COLORS.teal, bright: '#1a8aa3' }
  };

  /**
   * Map view: ids = project ids in focus (null = everything), highlight =
   * optional theme colour. Text comes from translations.chapters[0].
   */
  const CHAPTERS = [
    { ids: null, highlight: null, camera: INITIAL_VIEW }
  ];

  const LAYER_IDS = {
    casing: 'route-casing',
    solid: 'route-line',
    planned: 'route-line-planned',
    fill: 'area-fill',
    outline: 'area-outline'
  };
  const SOURCE_ID = 'projects';

  // ---------------------------------------------------------------------------
  // Inline SVG icons (lightweight, no icon library)
  // ---------------------------------------------------------------------------
  const svg = (inner) =>
    `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
  const ICONS = {
    bike: svg('<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8L8.5 5.5H7M13 12H9"/>'),
    leaf: svg('<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19c3-5 6-8 10-10"/>'),
    drop: svg('<path d="M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z"/>'),
    shield: svg('<path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>'),
    train: svg('<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l2-4M15 21l-2-4"/><circle cx="9" cy="14" r=".6"/><circle cx="15" cy="14" r=".6"/>'),
    external: svg('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    pin: svg('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>')
  };
  const GOAL_ICON = {
    fiets: 'bike',
    groen: 'leaf',
    klimaat: 'drop',
    veiligheid: 'shield',
    leefbaarheid: 'shield',
    overstappen: 'train'
  };

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const state = {
    lang: DEFAULT_LANG,
    chapter: 0,
    features: [],          // all project features with a computed `anchor`
    byId: new Map(),
    markers: new Map(),    // id -> { marker, element }
    popup: null,
    popupId: null,
    selectedId: null,
    hoverId: null,
    mapReady: false
  };

  let map = null;

  // ---------------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------------
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  /** Escape text before inserting it into HTML strings. */
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  /** Look up a translation by dotted path, falling back to Dutch. */
  function t(path, vars) {
    const find = (lang) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), translations[lang]);
    let value = find(state.lang);
    if (value == null) value = find(DEFAULT_LANG);
    if (typeof value === 'string' && vars) {
      value = value.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : ''));
    }
    return value == null ? path : value;
  }

  /** Pick the current-language string from a { nl, en } object. */
  const loc = (obj) => (obj && (obj[state.lang] || obj[DEFAULT_LANG])) || '';

  const statusClass = (status) => 'status-' + String(status).replace(/\s+/g, '-');

  // ---------------------------------------------------------------------------
  // Geometry helpers
  // ---------------------------------------------------------------------------
  function allCoordinates(geometry) {
    switch (geometry.type) {
      case 'Point': return [geometry.coordinates];
      case 'LineString': return geometry.coordinates;
      case 'MultiLineString': return geometry.coordinates.flat();
      case 'Polygon': return geometry.coordinates[0];
      default: return [];
    }
  }

  /** Representative point used for markers and popups. */
  function computeAnchor(geometry) {
    const coords = allCoordinates(geometry);
    if (geometry.type === 'Point') return coords[0];
    if (geometry.type === 'LineString') return coords[Math.floor((coords.length - 1) / 2)];
    if (geometry.type === 'MultiLineString') {
      const longest = geometry.coordinates.reduce((a, b) => (b.length > a.length ? b : a));
      return longest[Math.floor((longest.length - 1) / 2)];
    }
    const ring = coords.slice(0, -1);
    const sum = ring.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
    return [sum[0] / ring.length, sum[1] / ring.length];
  }

  function computeBounds(geometry) {
    const bounds = new maplibregl.LngLatBounds();
    allCoordinates(geometry).forEach((c) => bounds.extend(c));
    return bounds;
  }

  // ---------------------------------------------------------------------------
  // Translations and language switching
  // ---------------------------------------------------------------------------
  function applyStaticTranslations() {
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    document.title = t('pageTitle');
  }

  function setLanguage(lang, { persist = true } = {}) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
    state.lang = lang;
    document.documentElement.lang = lang;
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage may be unavailable */ }
      // Keep the shareable URL in sync with the chosen language
      const url = new URL(window.location.href);
      if (url.searchParams.has('lang')) {
        url.searchParams.set('lang', lang);
        history.replaceState(null, '', url);
      }
    }

    $$('.lang-btn').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
    });

    applyStaticTranslations();
    renderChapter();
    renderLegend();
    updateMarkerLabels();
    refreshPopup();
    const errorEl = $('#map-error');
    if (!errorEl.hidden) errorEl.textContent = t('mapError');
  }

  function getStoredLanguage() {
    // A ?lang=en / ?lang=nl URL parameter takes priority over the stored preference
    const param = new URLSearchParams(window.location.search).get('lang');
    if (SUPPORTED_LANGS.includes(param)) return param;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return SUPPORTED_LANGS.includes(stored) ? stored : DEFAULT_LANG;
    } catch (e) {
      return DEFAULT_LANG;
    }
  }

  // ---------------------------------------------------------------------------
  // Project cards and popups
  // ---------------------------------------------------------------------------
  function categoryTag(p) {
    const color = CATEGORY_COLOR[p.category] || COLORS.gray;
    return `<span class="tag" style="--tag-color:${color}"><i aria-hidden="true"></i>${esc(t('categories.' + p.category))}</span>`;
  }

  function statusBadge(p) {
    return `<span class="status ${statusClass(p.status)}">${esc(t('statuses.' + p.status))}</span>`;
  }

  /** Goal icons, de-duplicated by icon, with accessible text labels. */
  function goalIcons(p) {
    const groups = new Map();
    p.goals.split(',').map((g) => g.trim()).filter(Boolean).forEach((goal) => {
      const icon = GOAL_ICON[goal];
      if (!icon) return;
      if (!groups.has(icon)) groups.set(icon, []);
      groups.get(icon).push(t('goals.' + goal));
    });
    const items = Array.from(groups.entries()).map(([icon, labels]) => {
      const label = labels.join(', ');
      return `<li class="goal goal-${icon}" title="${esc(label)}">${ICONS[icon]}<span class="sr-only">${esc(label)}</span></li>`;
    });
    return `<ul class="goal-icons">${items.join('')}</ul>`;
  }

  /** Visible link to the official utrecht.nl page (opens in a new tab). */
  function officialLink(p) {
    const isOverview = p.urlType === 'overview';
    const label = isOverview ? t('moreInfoOverview') : t('moreInfo');
    const note = isOverview ? `<span class="overview-note">${esc(t('overviewNote'))}</span>` : '';
    return `<a class="ext-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">`
      + `<span>${esc(label)}</span>${ICONS.external}<span class="sr-only"> (${esc(t('a11y.externalLink'))})</span></a>${note}`;
  }

  function benefitsList(p) {
    const b = p.benefits && p.benefits[state.lang];
    if (!b) return '';
    const rows = ['cycling', 'green', 'safety']
      .filter((k) => b[k])
      .map((k) => `<div><dt>${esc(t('benefits.' + k))}</dt><dd>${esc(b[k])}</dd></div>`);
    return rows.length ? `<dl class="benefits">${rows.join('')}</dl>` : '';
  }

  function cardHTML(p) {
    return `
      <article class="project-card" data-id="${esc(p.id)}">
        <div class="card-tags">${categoryTag(p)}${statusBadge(p)}</div>
        <h4>${esc(loc(p.title))}</h4>
        <p>${esc(loc(p.description))}</p>
        ${goalIcons(p)}
        ${benefitsList(p)}
        <p class="meta"><strong>${esc(t('planning'))}:</strong> ${esc(loc(p.planning))}</p>
        <p class="meta"><strong>${esc(t('connections'))}:</strong> ${esc(loc(p.connections))}</p>
        <div class="card-actions">
          <button type="button" class="btn btn-small" data-show="${esc(p.id)}">${ICONS.pin}<span>${esc(t('showOnMap'))}</span></button>
          ${officialLink(p)}
        </div>
      </article>`;
  }

  function popupHTML(p) {
    return `
      <div class="popup">
        <div class="card-tags">${categoryTag(p)}${statusBadge(p)}</div>
        <h3>${esc(loc(p.title))}</h3>
        <p>${esc(loc(p.description))}</p>
        ${goalIcons(p)}
        <p class="meta"><strong>${esc(t('planning'))}:</strong> ${esc(loc(p.planning))}</p>
        ${officialLink(p)}
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Story panel rendering
  // ---------------------------------------------------------------------------
  function renderChapter() {
    const chapter = translations[state.lang].chapters[0];
    const el = $('#chapter');

    const badges = `<ul class="pills">${t('hero.badges').map((b, i) => `<li class="pill pill-${i + 1}">${esc(b)}</li>`).join('')}</ul>`;
    const cta = `<p class="all-projects"><a class="ext-link" href="${ALL_PROJECTS_URL}" target="_blank" rel="noopener noreferrer">`
      + `<span>${esc(t('allProjects'))}</span>${ICONS.external}<span class="sr-only"> (${esc(t('a11y.externalLink'))})</span></a></p>`;
    el.className = 'chapter chapter-hero';
    el.innerHTML = `
      <h2>${esc(chapter.title)}</h2>
      <p class="lead">${esc(chapter.lead)}</p>
      ${chapter.body.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}
      ${badges}
      ${cta}`;
  }

  // ---------------------------------------------------------------------------
  // Legend
  // ---------------------------------------------------------------------------
  // Short legend labels per F-route (place names, so no translation needed)
  const F_ROUTE_LABELS = {
    'doorfietsroute-utrecht-amersfoort': ['F28', 'Utrecht–Amersfoort'],
    'doorfietsroute-utrecht-hilversum': ['F27', 'Utrecht–Hilversum'],
    'dom-tot-damroute': ['F2', 'Dom–Dam'],
    'fietsroute-utrecht-houten-f409': ['F409', 'Utrecht–Houten'],
    'doorfietsroute-woerden-utrecht-f12': ['F12', 'Woerden–Utrecht'],
    'doorfietsroute-utrecht-ijsselstein-f408': ['F408', 'Utrecht–IJsselstein'],
    'doorfietsroute-usp-veenendaal-f225': ['F225', 'USP–Veenendaal'],
    'doorfietsroute-hilversum-amersfoort-f1': ['F1', 'Hilversum–Amersfoort'],
    'doorfietsroute-houten-castellum-usp-f27': ['F27 USP', 'Houten Castellum–USP'],
    'doorfietsroute-houten-lage-weide-f409': ['F409 LW', 'Houten–Lage Weide'],
    'doorfietsroute-amersfoort-bunschoten-f199': ['F199', 'Amersfoort–Bunschoten'],
    'doorfietsroute-houten-utrecht-centrum': ['Houten', 'Houten–Utrecht-Centrum'],
    'doorfietsroute-houten-culemborg': ['Culemb.', 'Houten–Culemborg'],
    'doorfietsroute-amersfoort-usp': ['Amersf.', 'Amersfoort–USP'],
    'doorfietsroute-mijdrecht-schiphol': ['Schiphol', 'Mijdrecht–Schiphol'],
    'doorfietsroute-ede-veenendaal-f112': ['F112', 'Ede–Veenendaal'],
    'doorfietsroute-bilthoven-uithof-houten': ['Bilth.', 'Bilthoven–Uithof–Houten']
  };

  function renderLegend() {
    const items = [
      { key: 'main', color: COLORS.blue, type: 'line' },
      { key: 'cyclestreet', color: COLORS.cyclestreet, type: 'line' },
      { key: 'redesign', color: COLORS.orange, type: 'dot' }
    ];
    const rows = items.map((i) =>
      `<li><span class="swatch swatch-${i.type}" style="--c:${i.color}" aria-hidden="true"></span>${esc(t('legend.' + i.key))}</li>`);
    const fRoutes =     Object.entries(F_ROUTE_LABELS).map(([id, [label, full]]) =>
          `<li title="${esc(full)}"><span class="swatch" style="--c:${F_ROUTE_COLORS[id]}" aria-hidden="true"></span>${esc(label)}</li>`);
    rows.splice(1, 0,
      `<li class="legend-group">${esc(t('legend.regional'))}<ul class="legend-froutes">${fRoutes.join('')}</ul></li>`);
    rows.push(`<li class="legend-sep">${esc(t('legendStatus'))}</li>`);
    rows.push(`<li><span class="swatch swatch-solid" aria-hidden="true"></span><span class="swatch swatch-dot swatch-now" aria-hidden="true"></span>${esc(t('legendNow'))}</li>`);
    rows.push(`<li><span class="swatch swatch-dashed" aria-hidden="true"></span><span class="swatch swatch-dot swatch-upcoming" aria-hidden="true"></span>${esc(t('legendUpcoming'))}</li>`);
    $('#legend-body').innerHTML = rows.join('');
    $('#legend-toggle').setAttribute('aria-label', t('legendToggle'));
  }

  /** Legend is always open on desktop and collapsible on mobile. */
  function syncLegendMode(initial) {
    const toggle = $('#legend-toggle');
    const legend = $('#legend');
    if (!mobileQuery.matches) {
      legend.dataset.collapsed = 'false';
      toggle.disabled = true;
      toggle.setAttribute('aria-expanded', 'true');
    } else {
      toggle.disabled = false;
      if (initial) legend.dataset.collapsed = 'true';
      toggle.setAttribute('aria-expanded', String(legend.dataset.collapsed !== 'true'));
    }
  }

  // ---------------------------------------------------------------------------
  // Map layers
  // ---------------------------------------------------------------------------
  const categoryMatch = (table, fallback) =>
    ['match', ['get', 'category'], ...Object.entries(table).flat(), fallback];

  const isSelected = ['boolean', ['feature-state', 'selected'], false];
  const isHovered = ['boolean', ['feature-state', 'hover'], false];

  /** Expression that is true for features in focus in the current chapter. */
  function activeExpression(ids) {
    return ids ? ['in', ['get', 'id'], ['literal', ids]] : true;
  }

  function colorExpression(config) {
    const active = activeExpression(config.ids);
    const base = ['match', ['get', 'id'], ...Object.entries(F_ROUTE_COLORS).flat(), categoryMatch(CATEGORY_COLOR, COLORS.gray)];
    const bright = ['match', ['get', 'id'], ...Object.entries(F_ROUTE_COLORS).flat(), categoryMatch(CATEGORY_BRIGHT, COLORS.gray)];
    const h = config.highlight;
    return [
      'case',
      ['any', isSelected, isHovered], h ? ['case', active, h.bright, bright] : bright,
      active, h ? h.color : base,
      base
    ];
  }

  function opacityExpression(config, activeValue) {
    return ['case', activeExpression(config.ids), activeValue, 0.16];
  }

  function widthExpression(extraNear, extraFar) {
    const factor = ['*', categoryMatch(CATEGORY_WIDTH, 3), ['case', isSelected, 1.5, isHovered, 1.25, 1]];
    return [
      'interpolate', ['linear'], ['zoom'],
      9, ['+', ['*', 0.6, factor], extraNear],
      15, ['+', ['*', 1.9, factor], extraFar]
    ];
  }

  function addMapLayers() {
    const lines = ['==', ['geometry-type'], 'LineString'];
    const planned = UPCOMING_EXPRESSION;
    const config = CHAPTERS[state.chapter];
    const lineLayout = { 'line-cap': 'round', 'line-join': 'round' };

    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: state.features },
      promoteId: 'id'
    });

    // 3D buildings from the basemap's OpenMapTiles building layer, below all project layers
    if (map.getSource('openmaptiles') && !map.getLayer('buildings-3d')) {
      map.addLayer({
        id: 'buildings-3d', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 14,
        paint: {
          'fill-extrusion-color': '#d9d9d9',
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.8
        }
      });
    }

    // Bicycle streets (OSM data) sit below the project routes
    map.addSource(CYCLESTREETS_SOURCE, { type: 'geojson', data: state.cyclestreets });
    map.addLayer({
      id: 'cyclestreet-halo', type: 'line', source: CYCLESTREETS_SOURCE, layout: lineLayout,
      filter: ['==', ['get', 'name'], ''],
      paint: { 'line-color': '#ffd23f', 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 8, 16, 20], 'line-opacity': 0.8, 'line-blur': 2 }
    });
    map.addLayer({
      id: 'cyclestreet-casing', type: 'line', source: CYCLESTREETS_SOURCE, layout: lineLayout,
      paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 2, 16, 8], 'line-opacity': 0.9 }
    });
    map.addLayer({
      id: 'cyclestreet-line', type: 'line', source: CYCLESTREETS_SOURCE, layout: lineLayout,
      paint: { 'line-color': COLORS.cyclestreet, 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 1.5, 16, 5] }
    });
    // Wide invisible layer so thin bicycle streets are easy to hover and click
    map.addLayer({
      id: 'cyclestreet-hit', type: 'line', source: CYCLESTREETS_SOURCE, layout: lineLayout,
      paint: { 'line-color': '#000000', 'line-width': 18, 'line-opacity': 0 }
    });

    map.addLayer({
      id: LAYER_IDS.fill, type: 'fill', source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': colorExpression(config),
        'fill-opacity': opacityExpression(config, 0.4)
      }
    });
    map.addLayer({
      id: LAYER_IDS.outline, type: 'line', source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Polygon'],
      layout: lineLayout,
      paint: {
        'line-color': colorExpression(config),
        'line-width': 2.5,
        'line-opacity': opacityExpression(config, 1)
      }
    });
    // Selection halo: drawn under the route casing, shown only for the selected project
    const noSelection = ['==', ['get', 'id'], ''];
    const haloPaint = {
      'line-color': '#ffd23f',
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 10, 15, 22],
      'line-opacity': 0.75,
      'line-blur': 2
    };
    map.addLayer({
      id: 'selection-halo-area', type: 'line', source: SOURCE_ID,
      filter: ['all', ['==', ['geometry-type'], 'Polygon'], noSelection],
      layout: lineLayout, paint: haloPaint
    });
    // White casing under all route lines for contrast
    map.addLayer({
      id: 'selection-halo', type: 'line', source: SOURCE_ID,
      filter: ['all', lines, noSelection],
      layout: lineLayout, paint: haloPaint
    });
    map.addLayer({
      id: LAYER_IDS.casing, type: 'line', source: SOURCE_ID, filter: lines,
      layout: lineLayout,
      paint: {
        'line-color': '#ffffff',
        'line-width': widthExpression(1.5, 3.5),
        'line-opacity': ['case', activeExpression(config.ids), ['case', planned, 0.55, 0.95], 0.1]
      }
    });
    map.addLayer({
      id: LAYER_IDS.solid, type: 'line', source: SOURCE_ID,
      filter: ['all', lines, ['!', planned]],
      layout: lineLayout,
      paint: {
        'line-color': colorExpression(config),
        'line-width': widthExpression(0, 0),
        'line-opacity': opacityExpression(config, 1)
      }
    });
    // Planned routes are dashed and slightly transparent
    map.addLayer({
      id: LAYER_IDS.planned, type: 'line', source: SOURCE_ID,
      filter: ['all', lines, planned],
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': colorExpression(config),
        'line-width': widthExpression(0, 0),
        'line-dasharray': [1.6, 1.2],
        'line-opacity': opacityExpression(config, 0.85)
      }
    });

    // F-route number labels along the lines
    map.addLayer({
      id: 'route-fnumber', type: 'symbol', source: SOURCE_ID,
      filter: ['has', 'fnumber'],
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 400,
        'text-field': ['get', 'fnumber'],
        'text-font': ['Noto Sans Bold'],
        'text-size': 12,
        'text-keep-upright': true,
        'text-allow-overlap': false
      },
      paint: {
        'text-color': '#14653a',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });

    bindLayerInteractions();
  }

  /** Re-apply paint properties after a chapter change (dims unrelated layers). */
  function updateMapStyles() {
    if (!state.mapReady) return;
    const config = CHAPTERS[state.chapter];
    const planned = UPCOMING_EXPRESSION;
    map.setPaintProperty(LAYER_IDS.fill, 'fill-color', colorExpression(config));
    map.setPaintProperty(LAYER_IDS.fill, 'fill-opacity', opacityExpression(config, 0.4));
    map.setPaintProperty(LAYER_IDS.outline, 'line-color', colorExpression(config));
    map.setPaintProperty(LAYER_IDS.outline, 'line-opacity', opacityExpression(config, 1));
    map.setPaintProperty(LAYER_IDS.casing, 'line-opacity',
      ['case', activeExpression(config.ids), ['case', planned, 0.55, 0.95], 0.1]);
    map.setPaintProperty(LAYER_IDS.solid, 'line-color', colorExpression(config));
    map.setPaintProperty(LAYER_IDS.solid, 'line-opacity', opacityExpression(config, 1));
    map.setPaintProperty(LAYER_IDS.planned, 'line-color', colorExpression(config));
    map.setPaintProperty(LAYER_IDS.planned, 'line-opacity', opacityExpression(config, 0.85));
    updateMarkerStyles();
  }

  function setFeatureState(id, key, value) {
    if (!id || !state.mapReady) return;
    map.setFeatureState({ source: SOURCE_ID, id }, { [key]: value });
    if (key === 'selected') showSelection(value ? id : null);
  }

  /** Show a halo under the selected route/area and enlarge its marker. */
  function showSelection(id) {
    const match = ['==', ['get', 'id'], id || ''];
    map.setFilter('selection-halo', ['all', ['==', ['geometry-type'], 'LineString'], match]);
    map.setFilter('selection-halo-area', ['all', ['==', ['geometry-type'], 'Polygon'], match]);
    state.markers.forEach(({ element }, markerId) => element.classList.toggle('is-selected', markerId === id));
  }

  function bindLayerInteractions() {
    map.on('mouseenter', 'cyclestreet-hit', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'cyclestreet-hit', () => { map.getCanvas().style.cursor = ''; });
    map.on('click', 'cyclestreet-hit', (e) => {
      // Project layers take precedence when a project line overlaps a bicycle street
      if (map.queryRenderedFeatures(e.point, { layers: [LAYER_IDS.solid, LAYER_IDS.planned, LAYER_IDS.fill] }).length) return;
      openCyclestreet(e.features[0].properties.name, e.lngLat);
    });
    const interactive = [LAYER_IDS.casing, LAYER_IDS.solid, LAYER_IDS.planned, LAYER_IDS.fill];

    interactive.forEach((layerId) => {
      map.on('mousemove', layerId, (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const id = e.features[0].properties.id;
        if (id === state.hoverId) return;
        setFeatureState(state.hoverId, 'hover', false);
        state.hoverId = id;
        setFeatureState(id, 'hover', true);
        setMarkerHover(id, true);
      });
      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
        setFeatureState(state.hoverId, 'hover', false);
        setMarkerHover(state.hoverId, false);
        state.hoverId = null;
      });
      map.on('click', layerId, (e) => {
        openProject(e.features[0].properties.id, { lngLat: e.lngLat });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Markers (HTML markers so they can pulse and stay visible at all zooms)
  // ---------------------------------------------------------------------------
  function createMarkers() {
    state.features.forEach((feature) => {
      const p = feature.properties;
      const el = document.createElement('button');
      el.type = 'button';
      const isParking = p.category === 'fietsenstalling' || p.category === 'buurtstalling';
      el.className = 'marker' + (p.major ? ' marker-major' : '') + (isParking ? ' marker-minor' : '')
        + (UPCOMING.includes(p.status) ? ' marker-upcoming' : '');
      el.style.setProperty('--marker-color', colorForFeature(p));
      el.innerHTML = '<span class="marker-pulse"></span><span class="marker-dot"></span>';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openProject(p.id);
      });
      el.addEventListener('mouseenter', () => setFeatureState(p.id, 'hover', true));
      el.addEventListener('mouseleave', () => setFeatureState(p.id, 'hover', false));

      const marker = new maplibregl.Marker({ element: el }).setLngLat(feature.anchor).addTo(map);
      state.markers.set(p.id, { marker, element: el });
    });
    updateMarkerLabels();
    updateMarkerStyles();
  }

  function updateMarkerLabels() {
    state.markers.forEach(({ element }, id) => {
      const p = state.byId.get(id).properties;
      element.setAttribute('aria-label', `${t('a11y.marker')} ${loc(p.title)}`);
      element.title = loc(p.title);
    });
  }

  function updateMarkerStyles() {
    const config = CHAPTERS[state.chapter];
    state.markers.forEach(({ element }, id) => {
      const inFocus = !config.ids || config.ids.includes(id);
      element.classList.toggle('is-dimmed', !inFocus);
      const p = state.byId.get(id).properties;
      const color = config.highlight && inFocus ? config.highlight.color : colorForFeature(p);
      element.style.setProperty('--marker-color', color);
    });
  }

  function setMarkerHover(id, on) {
    const entry = state.markers.get(id);
    if (entry) entry.element.classList.toggle('is-hover', on);
  }

  // ---------------------------------------------------------------------------
  // Popups and navigation between projects
  // ---------------------------------------------------------------------------
  function closePopup() {
    if (state.popup) {
      const popup = state.popup;
      state.popup = null;
      popup.remove();
    }
    setFeatureState(state.selectedId, 'selected', false);
    if (map.getLayer('cyclestreet-halo')) map.setFilter('cyclestreet-halo', ['==', ['get', 'name'], '']);
    state.selectedId = null;
    state.popupId = null;
  }

  function openProject(id, { lngLat } = {}) {
    const feature = state.byId.get(id);
    if (!feature || !state.mapReady) return;
    closePopup();

    state.selectedId = id;
    state.popupId = id;
    setFeatureState(id, 'selected', true);

    const popup = new maplibregl.Popup({ className: 'story-popup', maxWidth: '320px', offset: 16, focusAfterOpen: false })
      .setLngLat(lngLat || feature.anchor)
      .setHTML(popupHTML(feature.properties))
      .addTo(map);
    popup.on('close', () => {
      if (state.popup === popup) {
        setFeatureState(state.selectedId, 'selected', false);
        state.popup = null;
        state.popupId = null;
        state.selectedId = null;
      }
    });
    state.popup = popup;
    labelPopupClose();
  }

  function labelPopupClose() {
    if (!state.popup) return;
    const button = state.popup.getElement().querySelector('.maplibregl-popup-close-button');
    if (button) button.setAttribute('aria-label', t('a11y.closePopup'));
  }

  /** Re-render the open popup when the language changes. */
  function refreshPopup() {
    if (!state.popup || !state.popupId) return;
    state.popup.setHTML(popupHTML(state.byId.get(state.popupId).properties));
    labelPopupClose();
  }

  function cyclestreetHTML(name) {
    return `
      <div class="popup">
        <div class="card-tags"><span class="tag" style="--tag-color:${COLORS.cyclestreet}"><i aria-hidden="true"></i>${esc(t('legend.cyclestreet'))}</span></div>
        <h3>${esc(name)}</h3>
        <p>${esc(t('cyclestreetInfo'))}</p>
        <p class="meta">${esc(t('cyclestreetSource'))}</p>
      </div>`;
  }

  function openCyclestreet(name, lngLat) {
    closePopup();
    map.setFilter('cyclestreet-halo', ['==', ['get', 'name'], name]);
    const popup = new maplibregl.Popup({ className: 'story-popup', maxWidth: '320px', offset: 12, focusAfterOpen: false })
      .setLngLat(lngLat)
      .setHTML(cyclestreetHTML(name))
      .addTo(map);
    popup.on('close', () => {
      if (state.popup === popup) {
        state.popup = null;
        map.setFilter('cyclestreet-halo', ['==', ['get', 'name'], '']);
      }
    });
    state.popup = popup;
    labelPopupClose();
  }

  function flyOptions() {
    return { duration: prefersReducedMotion.matches ? 0 : FLY_DURATION, essential: true };
  }

  function flyToProject(id) {
    const feature = state.byId.get(id);
    if (!feature || !state.mapReady) return;
    const padding = mobileQuery.matches
      ? { top: 50, bottom: 50, left: 30, right: 30 }
      : { top: 90, bottom: 90, left: 70, right: 70 };

    let target;
    if (feature.geometry.type === 'Point') {
      target = { center: feature.anchor, zoom: 15.2 };
    } else {
      const cam = map.cameraForBounds(computeBounds(feature.geometry), { padding, maxZoom: 15.5 });
      target = cam ? { center: cam.center, zoom: cam.zoom } : { center: feature.anchor, zoom: 13 };
    }
    map.flyTo({ ...target, pitch: 45, ...flyOptions() });
    openProject(id);
  }

  // ---------------------------------------------------------------------------
  // Data loading and initialisation
  // ---------------------------------------------------------------------------
  async function loadFeatures() {
    const collections = await Promise.all(DATA_FILES.map(async (file) => {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`${file}: ${response.status}`);
      return response.json();
    }));
    return collections.flatMap((c) => c.features);
  }

  async function loadCyclestreets() {
    const response = await fetch(CYCLESTREETS_FILE);
    if (!response.ok) throw new Error(`${CYCLESTREETS_FILE}: ${response.status}`);
    return response.json();
  }

  function showMapError() {
    const el = $('#map-error');
    el.textContent = t('mapError');
    el.hidden = false;
  }

  function initMap() {
    map = new maplibregl.Map({
      container: 'map',
      style: STYLE_URL,
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
      attributionControl: false
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', async () => {
      try {
        const features = await loadFeatures();
        features.forEach((f) => {
          f.anchor = computeAnchor(f.geometry);
          // F-route number (e.g. "F28") used for the line label
          const match = /\bF\d+\b/.exec(f.properties.title.nl);
          const fnumber = F_NUMBER_OVERRIDES[f.properties.id] || (match && match[0]);
          if (fnumber && f.geometry.type.endsWith('LineString')) f.properties.fnumber = fnumber;
        });
        state.features = features;
        state.cyclestreets = await loadCyclestreets();
        state.byId = new Map(features.map((f) => [f.properties.id, f]));
      } catch (error) {
        console.error('Could not load project data', error);
        showMapError();
        return;
      }
      addMapLayers();
      state.mapReady = true;
      createMarkers();
      renderChapter();
      updateMapStyles();
    });
  }

  function bindEvents() {
    $$('.lang-btn').forEach((btn) => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));

    $('#legend-toggle').addEventListener('click', () => {
      const legend = $('#legend');
      const collapsed = legend.dataset.collapsed !== 'true';
      legend.dataset.collapsed = String(collapsed);
      $('#legend-toggle').setAttribute('aria-expanded', String(!collapsed));
    });
    mobileQuery.addEventListener('change', () => {
      syncLegendMode(true);
      if (map) map.resize();
    });
  }

  function init() {
    bindEvents();
    syncLegendMode(true);
    setLanguage(getStoredLanguage(), { persist: false });
    initMap();
  }

  init();
})();
