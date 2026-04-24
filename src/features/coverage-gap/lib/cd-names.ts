// Neighborhood names for NYC's 59 community districts.
// Keys are BoroCD integers: first digit = borough (1–5), last two = district number.
// Source: NYC DCP Community District Tabulation Areas 2020 (dataset xn3r-zk6y).
export const CD_NAMES: Record<number, string> = {
  // Manhattan
  101: "Financial District / Tribeca",
  102: "Greenwich Village / SoHo",
  103: "Lower East Side / Chinatown",
  104: "Chelsea / Hell's Kitchen",
  105: "Midtown / Flatiron / Union Square",
  106: "East Midtown / Murray Hill",
  107: "Upper West Side",
  108: "Upper East Side / Roosevelt Island",
  109: "Morningside Heights / Hamilton Heights",
  110: "Harlem",
  111: "East Harlem",
  112: "Washington Heights / Inwood",

  // Bronx
  201: "Melrose / Mott Haven / Port Morris",
  202: "Longwood / Hunts Point",
  203: "Morrisania / Crotona Park East",
  204: "Highbridge / Concourse",
  205: "Morris Heights / Mount Hope",
  206: "Tremont / Belmont / West Farms",
  207: "Fordham / Bedford Park / Norwood",
  208: "Riverdale / Kingsbridge / Marble Hill",
  209: "Soundview / Parkchester",
  210: "Co-op City / Throgs Neck",
  211: "Pelham Parkway / Morris Park",
  212: "Wakefield / Williamsbridge / Eastchester",

  // Brooklyn
  301: "Williamsburg / Greenpoint",
  302: "Downtown Brooklyn / Fort Greene",
  303: "Bedford-Stuyvesant",
  304: "Bushwick",
  305: "East New York / Cypress Hills",
  306: "Park Slope / Carroll Gardens",
  307: "Sunset Park / Windsor Terrace",
  308: "Crown Heights North",
  309: "Crown Heights South",
  310: "Bay Ridge / Dyker Heights",
  311: "Bensonhurst / Bath Beach",
  312: "Borough Park / Kensington",
  313: "Coney Island / Brighton Beach",
  314: "Flatbush / Midwood",
  315: "Sheepshead Bay / Gravesend",
  316: "Ocean Hill / Brownsville",
  317: "East Flatbush",
  318: "Canarsie / Flatlands",

  // Queens
  401: "Astoria / Queensbridge",
  402: "Long Island City / Sunnyside / Woodside",
  403: "Jackson Heights / East Elmhurst",
  404: "Elmhurst / Corona",
  405: "Ridgewood / Maspeth / Middle Village",
  406: "Forest Hills / Rego Park",
  407: "Flushing / Whitestone",
  408: "Fresh Meadows / Hillcrest / Briarwood",
  409: "Kew Gardens / Richmond Hill / Woodhaven",
  410: "South Ozone Park / Howard Beach",
  411: "Bayside / Douglaston",
  412: "Jamaica / St. Albans / Hollis",
  413: "Queens Village / Bellerose / Rosedale",
  414: "The Rockaways",

  // Staten Island
  501: "North Shore",
  502: "Mid-Island",
  503: "South Shore",
};
