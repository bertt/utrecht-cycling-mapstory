/**
 * All user-facing strings for the map story.
 * Add a new language by adding a new key with the same structure as `nl`.
 * Chapters are listed in order; their map behaviour lives in js/app.js.
 */
const translations = {
  nl: {
    siteTitle: "Utrecht in beweging",
    siteSubtitle: "Verkeersprojecten voor een aantrekkelijke en bereikbare stad",
    pageTitle: "Utrecht in beweging – een kaartverhaal over verkeersprojecten",
    allProjects: "Alle verkeersprojecten van gemeente Utrecht",
    projectsHeading: "Verkeersprojecten op de kaart",
    exploreMap: "Verken de kaart",
    moreInfo: "Meer informatie bij gemeente Utrecht",
    moreInfoOverview: "Overzichtspagina van gemeente Utrecht",
    overviewNote: "Geen eigen projectpagina beschikbaar; dit is de meest relevante officiële overzichtspagina.",
    showOnMap: "Toon op kaart",
    chapter: "Hoofdstuk",
    chapterProgress: "Hoofdstuk {current} van {total}",
    previous: "Vorige",
    next: "Volgende",
    planning: "Planning",
    connections: "Samenhang",
    legendTitle: "Legenda",
    legendToggle: "Legenda tonen of verbergen",
    legendStatus: "Status",
    legendNow: "Er nu: klaar of in uitvoering",
    legendUpcoming: "Komt: in voorbereiding of gepland",
    legend: {
      main: "Hoofdfietsroutes",
      green: "Groen, water en klimaat",
      safety: "Veiligheid en rustiger verkeer",
      parking: "Fietsparkeren en overstappen",
      redesign: "Herinrichting",
      regional: "Regionale verbindingen"
    },
    categories: {
      hoofdfietsroute: "Hoofdfietsroute",
      doorfietsroute: "Doorfietsroute",
      herinrichting: "Herinrichting",
      fietsenstalling: "Fietsenstalling",
      buurtstalling: "Stalling binnenstad"
    },
    statuses: {
      "in voorbereiding": "In voorbereiding",
      "in uitvoering": "In uitvoering",
      "gepland": "Gepland",
      "bestaand": "Bestaand",
      "uitgesteld": "Uitgesteld",
      "afgerond": "Afgerond"
    },
    goals: {
      fiets: "Fiets en bereikbaarheid",
      groen: "Groen en biodiversiteit",
      klimaat: "Klimaatadaptatie",
      veiligheid: "Veiligheid",
      leefbaarheid: "Leefbaarheid",
      overstappen: "Parkeren en overstappen"
    },
    benefits: {
      cycling: "Fietsen en bereikbaarheid",
      green: "Groen en klimaat",
      safety: "Veiligheid en leefbaarheid"
    },
    a11y: {
      languageSwitcher: "Taalkeuze",
      switchToNl: "Nederlands",
      switchToEn: "English",
      chapterNav: "Hoofdstukken",
      chapterPager: "Vorig of volgend hoofdstuk",
      storyPanel: "Verhaal",
      map: "Interactieve kaart van fietsprojecten in Utrecht",
      github: "Bekijk de broncode op GitHub (opent in een nieuw tabblad)",
      projects: "Projecten in dit hoofdstuk",
      closePopup: "Sluit venster",
      externalLink: "opent in een nieuw tabblad",
      marker: "Project op de kaart:"
    },
    github: "GitHub",
    hero: {
      badges: ["Voorrang aan lopen, fietsen en OV", "Meer groen en ruimte", "Veiliger én prettiger"]
    },
    mapError: "De kaartgegevens konden niet worden geladen. Open de site via een webserver (bijvoorbeeld GitHub Pages).",
    footer: {
      text: "Dit is een onofficieel kaartverhaal. Locaties zijn bij benadering; raadpleeg de projectpagina's van gemeente Utrecht voor actuele informatie.",
      attribution: "Basiskaart: OpenFreeMap, © OpenMapTiles, data © OpenStreetMap-bijdragers."
    },
    chapters: [
      {
        title: "Utrecht in beweging",
        nav: "Intro",
        lead: "We maken Utrecht aantrekkelijk en bereikbaar voor iedereen.",
        body: [
          "Utrecht geeft voorrang aan lopen, fietsen en openbaar vervoer en maakt meer ruimte voor groen, spelen en verblijven. Op de kaart zie je de verkeersprojecten van de stad; klik op een punt of lijn voor meer informatie."
        ]
      }
    ]
  },

  en: {
    siteTitle: "Utrecht on the Move",
    siteSubtitle: "Traffic projects for an attractive and accessible city",
    pageTitle: "Utrecht on the Move – a map story about traffic projects",
    allProjects: "All traffic projects of the Municipality of Utrecht",
    projectsHeading: "Traffic projects on the map",
    exploreMap: "Explore the map",
    moreInfo: "More information from the Municipality of Utrecht",
    moreInfoOverview: "Overview page of the Municipality of Utrecht",
    overviewNote: "No dedicated project page is available; this is the most relevant official overview page.",
    showOnMap: "Show on map",
    chapter: "Chapter",
    chapterProgress: "Chapter {current} of {total}",
    previous: "Previous",
    next: "Next",
    planning: "Planning",
    connections: "How it connects",
    legendTitle: "Legend",
    legendToggle: "Show or hide legend",
    legendStatus: "Status",
    legendNow: "Now: completed or under construction",
    legendUpcoming: "Coming: in preparation or planned",
    legend: {
      main: "Main cycling routes",
      green: "Green space, water and climate",
      safety: "Safety and calmer traffic",
      parking: "Bicycle parking and interchanges",
      redesign: "Urban redesign",
      regional: "Regional connections"
    },
    categories: {
      hoofdfietsroute: "Main cycling route",
      doorfietsroute: "Through route",
      herinrichting: "Urban redesign",
      fietsenstalling: "Bicycle parking",
      buurtstalling: "City-centre parking"
    },
    statuses: {
      "in voorbereiding": "In preparation",
      "in uitvoering": "Under construction",
      "gepland": "Planned",
      "bestaand": "Existing",
      "uitgesteld": "Postponed",
      "afgerond": "Completed"
    },
    goals: {
      fiets: "Cycling and accessibility",
      groen: "Green space and biodiversity",
      klimaat: "Climate adaptation",
      veiligheid: "Safety",
      leefbaarheid: "Livability",
      overstappen: "Parking and interchanges"
    },
    benefits: {
      cycling: "Cycling and accessibility",
      green: "Green space and climate",
      safety: "Safety and livability"
    },
    a11y: {
      languageSwitcher: "Language",
      switchToNl: "Nederlands",
      switchToEn: "English",
      chapterNav: "Chapters",
      chapterPager: "Previous or next chapter",
      storyPanel: "Story",
      map: "Interactive map of cycling projects in Utrecht",
      github: "View the source code on GitHub (opens in a new tab)",
      projects: "Projects in this chapter",
      closePopup: "Close popup",
      externalLink: "opens in a new tab",
      marker: "Project on the map:"
    },
    github: "GitHub",
    hero: {
      badges: ["Priority for walking, cycling and transit", "More green space", "Safer and more pleasant"]
    },
    mapError: "The map data could not be loaded. Open the site through a web server (for example GitHub Pages).",
    footer: {
      text: "This is an unofficial map story. Locations are approximate; check the City of Utrecht project pages for current information.",
      attribution: "Basemap: OpenFreeMap, © OpenMapTiles, data © OpenStreetMap contributors."
    },
    chapters: [
      {
        title: "Utrecht on the Move",
        nav: "Intro",
        lead: "We are making Utrecht attractive and accessible for everyone.",
        body: [
          "Utrecht gives priority to walking, cycling and public transport and creates more space for greenery, play and spending time outdoors. The map shows the city's traffic projects; click a point or line for more information."
        ]
      }
    ]
  }
};
