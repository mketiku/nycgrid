import type { Recommendation } from "./types";

export const RECOMMENDATIONS: Recommendation[] = [
  // ── Citywide ──────────────────────────────────────────────────────────────

  {
    id: "nypl-digital-collections",
    type: "read",
    title: "NYPL Digital Collections",
    description:
      "Over a million items from the New York Public Library — historic photos, maps, menus, manuscripts, and more.",
    url: "https://digitalcollections.nypl.org/",
    source: "New York Public Library",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "nyc-arch-video-1",
    type: "video",
    title: "NYC — Architectural Digest",
    description: "Architectural Digest takes you inside New York City's most remarkable spaces.",
    url: "https://www.youtube.com/watch?v=_b4XQUE_u8o",
    source: "Architectural Digest",
    youtubeId: "_b4XQUE_u8o",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "nyc-arch-video-2",
    type: "video",
    title: "NYC — Architectural Digest",
    description: "A closer look at New York City's architecture, interiors, and urban design.",
    url: "https://www.youtube.com/watch?v=5m6w1Pq0Pyw",
    source: "Architectural Digest",
    youtubeId: "5m6w1Pq0Pyw",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "nyc-video-3",
    type: "video",
    title: "New York City — Short Film",
    description: "A cinematic look at New York City.",
    url: "https://www.youtube.com/watch?v=VGy65I_9pDw",
    source: "YouTube",
    youtubeId: "VGy65I_9pDw",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "nyc-video-4",
    type: "video",
    title: "New York City — Short Film",
    description: "A cinematic look at New York City.",
    url: "https://www.youtube.com/watch?v=S758wEniU0c",
    source: "YouTube",
    youtubeId: "S758wEniU0c",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "nyc-video-5",
    type: "video",
    title: "New York City — Short Film",
    description: "A cinematic look at New York City.",
    url: "https://www.youtube.com/watch?v=fgTKTs33NLY",
    source: "YouTube",
    youtubeId: "fgTKTs33NLY",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "nyc-public-infrastructure-1",
    type: "video",
    title: "NYC Public Infrastructure",
    description: "A look at the systems and infrastructure that keep New York City running.",
    url: "https://www.youtube.com/watch?v=Q5pfKsBfzCI",
    source: "YouTube",
    youtubeId: "Q5pfKsBfzCI",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "nyc-public-infrastructure-2",
    type: "video",
    title: "NYC Public Infrastructure",
    description: "A look at the systems and infrastructure that keep New York City running.",
    url: "https://www.youtube.com/watch?v=COLMODzYX7U",
    source: "YouTube",
    youtubeId: "COLMODzYX7U",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "nyc-public-infrastructure-3",
    type: "video",
    title: "NYC Public Infrastructure",
    description: "A look at the systems and infrastructure that keep New York City running.",
    url: "https://www.youtube.com/watch?v=7t_u1EgFTUw",
    source: "YouTube",
    youtubeId: "7t_u1EgFTUw",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "she-can-answer-nyc",
    type: "video",
    title: "She Can Answer Any Question About New York City",
    description:
      "A deep dive into NYC knowledge — geography, history, and the systems that hold the city together.",
    url: "https://www.youtube.com/watch?v=S758wEniU0c",
    source: "Public Opinion",
    youtubeId: "S758wEniU0c",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "whats-under-the-street",
    type: "video",
    title: "What's Under the Street in NYC?",
    description:
      "The invisible infrastructure below the pavement: pipes, cables, tunnels, and what holds it all up.",
    url: "https://www.youtube.com/watch?v=VGy65I_9pDw",
    source: "Public Opinion",
    youtubeId: "VGy65I_9pDw",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "congestion-pricing-wendover",
    type: "video",
    title: "The Battle Over NYC Congestion Pricing",
    description:
      "The politics, economics, and urban planning behind one of NYC's most contested transit policies.",
    url: "https://www.youtube.com/watch?v=fgTKTs33NLY",
    source: "Wendover Productions",
    youtubeId: "fgTKTs33NLY",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "nyc-water-supply-wendover",
    type: "video",
    title: "The Simple Genius of NYC's Water Supply System",
    description:
      "How New York City delivers clean water to 8 million people every day — entirely by gravity.",
    url: "https://www.youtube.com/watch?v=_b4XQUE_u8o",
    source: "Wendover Productions",
    youtubeId: "_b4XQUE_u8o",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "surveillance-city-motherboard",
    type: "video",
    title: "Surveillance and the City: Know When You're Being Watched",
    description:
      "What public camera networks actually capture, and what they don't — relevant context for any camera.",
    url: "https://www.youtube.com/watch?v=5m6w1Pq0Pyw",
    source: "Motherboard",
    youtubeId: "5m6w1Pq0Pyw",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "the-power-broker",
    type: "read",
    title: "The Power Broker — Robert Caro",
    description:
      "How Robert Moses shaped NYC's infrastructure — and at what cost. The definitive book on urban power.",
    url: "https://www.amazon.com/Power-Broker-Robert-Moses-Fall/dp/0394720245",
    source: "Robert Caro",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "streetfight",
    type: "read",
    title: "Streetfight — Janette Sadik-Khan",
    description:
      "NYC's former transportation commissioner on how she redesigned the city's streets.",
    url: "https://www.amazon.com/Streetfight-Handbook-Urban-Revolution/dp/0143128973",
    source: "Janette Sadik-Khan",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "death-and-life",
    type: "read",
    title: "The Death and Life of Great American Cities — Jane Jacobs",
    description:
      "The landmark critique of urban planning and the conditions that make city life work.",
    url: "https://www.amazon.com/Death-Life-Great-American-Cities/dp/067974195X",
    source: "Jane Jacobs",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "strong-towns",
    type: "resource",
    title: "Strong Towns",
    description:
      "A clear-eyed look at how American cities are built financially and what needs to change.",
    url: "https://www.strongtowns.org/",
    source: "Strong Towns",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "nyc-municipal-archives",
    type: "read",
    title: "NYC Municipal Archives",
    description:
      "Digitized historical records, photographs, and documents from New York City government going back centuries.",
    url: "https://www.nyc.gov/site/records/historical-records/historical-records-landing.page",
    source: "NYC Department of Records and Information Services",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "nycparks-events",
    type: "resource",
    title: "NYC Parks Events",
    description:
      "Free public programming across all five boroughs — concerts, fitness classes, nature walks, and more.",
    url: "https://www.nycgovparks.org/events",
    source: "NYC Parks",
    scope: { kind: "area", area: "citywide" },
  },
  {
    id: "nyc-dot-youtube",
    type: "video",
    title: "NYC DOT on YouTube",
    description:
      "Official channel from the Department of Transportation — street safety campaigns, infrastructure projects, and city footage.",
    url: "https://www.youtube.com/@NYCDOT",
    source: "NYC Department of Transportation",
    scope: { kind: "area", area: "citywide" },
  },

  // ── Manhattan ─────────────────────────────────────────────────────────────

  {
    id: "african-burial-ground-nps",
    type: "place",
    title: "African Burial Ground National Monument",
    description:
      "Free NPS site in Lower Manhattan preserving the 17th–18th century burial ground of enslaved and free Africans.",
    url: "https://www.nps.gov/afbg/index.htm",
    source: "National Park Service",
    scope: { kind: "area", area: "Manhattan" },
  },
  {
    id: "hamilton-grange-nps",
    type: "place",
    title: "Hamilton Grange National Memorial",
    description:
      "Alexander Hamilton's country home, fully restored and free to tour in Hamilton Heights.",
    url: "https://www.nps.gov/hagr/index.htm",
    source: "National Park Service",
    scope: { kind: "area", area: "Manhattan" },
  },
  {
    id: "stonewall-nps",
    type: "place",
    title: "Stonewall National Monument",
    description:
      "The birthplace of the modern LGBTQ+ rights movement in Greenwich Village — free NPS site.",
    url: "https://www.nps.gov/ston/index.htm",
    source: "National Park Service",
    scope: { kind: "area", area: "Manhattan" },
  },
  {
    id: "inwood-hill-park",
    type: "place",
    title: "Inwood Hill Park",
    description:
      "Manhattan's last remaining old-growth forest — free NYC Parks land with caves, trails, and Hudson River views.",
    url: "https://www.nycgovparks.org/parks/inwood-hill-park",
    source: "NYC Parks",
    scope: { kind: "area", area: "Manhattan" },
  },

  // ── Brooklyn ──────────────────────────────────────────────────────────────

  {
    id: "nyc-transit-museum",
    type: "place",
    title: "NYC Transit Museum",
    description:
      "Genuinely excellent. A must-visit for anyone curious about how the subway and buses were built.",
    url: "https://www.nytransitmuseum.org/",
    source: "MTA",
    scope: { kind: "area", area: "Brooklyn" },
  },
  {
    id: "gateway-nra-brooklyn",
    type: "place",
    title: "Gateway National Recreation Area",
    description:
      "Free federal parkland spanning Jamaica Bay, Fort Tilden, and Floyd Bennett Field — beaches, trails, and wildlife refuge.",
    url: "https://www.nps.gov/gate/index.htm",
    source: "National Park Service",
    scope: { kind: "area", area: "Brooklyn" },
  },
  {
    id: "brooklyn-public-library-digital",
    type: "read",
    title: "Brooklyn Public Library — Digital Collections",
    description:
      "Free digital access to e-books, audiobooks, databases, and Brooklyn-specific archives with a library card.",
    url: "https://www.bklynlibrary.org/digital",
    source: "Brooklyn Public Library",
    scope: { kind: "area", area: "Brooklyn" },
  },
  {
    id: "prospect-park",
    type: "place",
    title: "Prospect Park",
    description:
      "Brooklyn's 585-acre green lung — free year-round with a lake, forest, meadow, and the only remaining forest in the borough.",
    url: "https://www.nycgovparks.org/parks/prospect-park",
    source: "NYC Parks",
    scope: { kind: "area", area: "Brooklyn" },
  },
  {
    id: "brooklyn-recycling-tour",
    type: "read",
    title: "Touring Brooklyn's Waste Recycling Facility",
    description:
      "A behind-the-scenes look at the sanitation infrastructure quietly keeping Brooklyn running.",
    url: "https://nylesa.org/member_stories/touring-brooklyns-waste-recycling-facility/",
    source: "NY League of Environmental Studies",
    scope: { kind: "area", area: "Brooklyn" },
  },

  // ── Queens ────────────────────────────────────────────────────────────────

  {
    id: "gateway-nra-queens",
    type: "place",
    title: "Jamaica Bay Wildlife Refuge",
    description:
      "330 species of birds and 9,155 acres of federal wilderness right inside New York City — free entry.",
    url: "https://www.nps.gov/gate/planyourvisit/jamaica-bay-wildlife-refuge.htm",
    source: "National Park Service",
    scope: { kind: "area", area: "Queens" },
  },
  {
    id: "queens-public-library-digital",
    type: "read",
    title: "Queens Public Library — Digital Resources",
    description:
      "Free e-books, language learning, business databases, and the Queens Memory Project digital archive.",
    url: "https://www.queenslibrary.org/books-and-more/digital-resources",
    source: "Queens Public Library",
    scope: { kind: "area", area: "Queens" },
  },
  {
    id: "alley-pond-park",
    type: "place",
    title: "Alley Pond Park",
    description:
      "NYC's oldest living thing — a 350-year-old tulip tree — plus wetlands, trails, and a free environmental center.",
    url: "https://www.nycgovparks.org/parks/alley-pond-park",
    source: "NYC Parks",
    scope: { kind: "area", area: "Queens" },
  },

  // ── Bronx ─────────────────────────────────────────────────────────────────

  {
    id: "pelham-bay-park",
    type: "place",
    title: "Pelham Bay Park",
    description:
      "NYC's largest park at 2,772 acres — shoreline, forest, Orchard Beach, and free year-round programming.",
    url: "https://www.nycgovparks.org/parks/pelham-bay-park",
    source: "NYC Parks",
    scope: { kind: "area", area: "Bronx" },
  },
  {
    id: "van-cortlandt-park",
    type: "place",
    title: "Van Cortlandt Park",
    description:
      "Ancient forest, wetlands, and America's oldest public golf course — 1,146 free acres in the northwest Bronx.",
    url: "https://www.nycgovparks.org/parks/van-cortlandt-park",
    source: "NYC Parks",
    scope: { kind: "area", area: "Bronx" },
  },
  {
    id: "bronx-river-greenway",
    type: "place",
    title: "Bronx River Greenway",
    description:
      "A free 12-mile trail and restored river corridor running through the heart of the Bronx.",
    url: "https://www.nycgovparks.org/parks/bronx-river-greenway",
    source: "NYC Parks",
    scope: { kind: "area", area: "Bronx" },
  },

  // ── Staten Island ─────────────────────────────────────────────────────────

  {
    id: "staten-island-ferry",
    type: "place",
    title: "Staten Island Ferry",
    description:
      "Free 25-minute ferry ride with unmatched views of the harbor, Statue of Liberty, and Lower Manhattan skyline.",
    url: "https://www.nyc.gov/html/dot/html/ferries/statenisland.shtml",
    source: "NYC Department of Transportation",
    scope: { kind: "area", area: "Staten Island" },
  },
  {
    id: "snug-harbor",
    type: "place",
    title: "Snug Harbor Cultural Center & Botanical Garden",
    description:
      "83 acres of free grounds with Greek Revival architecture, sculpture gardens, and public art on NYC Parks land.",
    url: "https://www.nycgovparks.org/parks/snug-harbor-cultural-center-and-botanical-garden",
    source: "NYC Parks",
    scope: { kind: "area", area: "Staten Island" },
  },
  {
    id: "staten-island-greenbelt",
    type: "place",
    title: "Staten Island Greenbelt",
    description:
      "2,800 acres of free forest in the center of Staten Island — the largest remaining forest in NYC.",
    url: "https://www.nycgovparks.org/parks/greenbelt",
    source: "NYC Parks",
    scope: { kind: "area", area: "Staten Island" },
  },
];
