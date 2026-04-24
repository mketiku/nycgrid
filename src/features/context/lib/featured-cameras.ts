import { CAMERAS } from "@/lib/cameras/data";
import type { FeaturedCamera, FeaturedCameraConfig } from "../types";

const FEATURED_CONFIGS: FeaturedCameraConfig[] = [
  // ── Manhattan ───────────────────────────────────────────────────────────────

  {
    id: "301002c0-fe39-4fad-998a-fdc66e531b1d",
    displayName: "Lincoln Tunnel",
    tags: ["commute", "tunnel"],
    nearestSubwayLines: ["A", "C", "E"],
    lore: "Three tubes, one of which runs beneath the Hudson at 97 feet below the river surface. Around 120,000 vehicles pass through daily — the most of any tunnel in the world.",
  },
  {
    id: "25ad72fe-e74c-49af-b4c0-34c9eac14655",
    displayName: "Holland Tunnel",
    tags: ["commute", "tunnel"],
    nearestSubwayLines: ["1", "2", "A", "C", "E"],
    lore: "The first mechanically ventilated underwater tunnel, completed in 1927. Its 84 fans completely refresh the air every 90 seconds — you breathe cleaner air inside than on the streets above. US Route 1, which runs all the way to Fort Kent, Maine, begins right at the tunnel's mouth.",
  },
  {
    id: "053e8995-f8cb-4d02-a659-70ac7c7da5db",
    displayName: "Times Square",
    tags: ["landmark", "commute"],
    nearestSubwayLines: ["1", "2", "3", "7", "N", "Q", "R", "W", "A", "C", "E", "S"],
    lore: "Originally named Longacre Square — a carriage industry hub. Renamed in 1904 when the New York Times moved its headquarters here and the mayor renamed the square in their honor. The New Year's Eve ball drop started that same year to celebrate the paper's opening.",
  },
  {
    id: "6d3a21dd-0434-4d92-a0d1-3ca8b77297db",
    displayName: "Fifth Avenue",
    tags: ["landmark"],
    nearestSubwayLines: ["N", "R", "W", "F", "Q"],
    lore: "The Plaza Hotel has stood at the park's southeast corner since 1907 — F. Scott Fitzgerald set scenes here, and Eloise lived on the top floor in Kay Thompson's 1955 novel. At 5th and 59th, you're standing at the geographic heart of what New York decided to be.",
  },
  {
    id: "85809312-60f2-4a52-a694-82628529c05a",
    displayName: "Central Park South",
    tags: ["park", "landmark"],
    nearestSubwayLines: ["N", "Q", "R", "W"],
    lore: "The southern gateway. The Plaza Hotel opened here in 1907. The Pulitzer Fountain in Grand Army Plaza was donated by Joseph Pulitzer's estate in 1916. Horse-drawn carriages still operate from this corner.",
  },
  {
    id: "984ebbad-ca64-41d8-8008-63aaae316952",
    displayName: "Central Park West",
    tags: ["park"],
    nearestSubwayLines: ["B", "C"],
    lore: "The Dakota was built in 1884 so far uptown that New Yorkers joked it might as well be in Dakota Territory — which is how it got its name. It was also the first luxury apartment building in New York City, proving that wealthy Manhattanites could be convinced to live stacked on top of each other.",
  },
  {
    id: "8a6bc417-4877-4ebe-8052-88c1b261baf1",
    displayName: "Central Park N. Entrance",
    tags: ["park"],
    nearestSubwayLines: ["B", "C"],
    lore: "The northern edge borders Harlem. The Harlem Meer — a 11-acre lake — sits just inside. Less photographed than the south end, which is exactly why it's worth watching.",
  },
  {
    id: "c880d0c4-db84-44c2-9f00-62f21a83b5d0",
    displayName: "Columbus Circle",
    tags: ["landmark"],
    nearestSubwayLines: ["A", "B", "C", "D", "1"],
    lore: "NYC's official geographic center — all distances to and from the city are measured from this point. The statue of Columbus has stood here since 1892. Five subway lines and two of the city's premier performance venues — Jazz at Lincoln Center and the David H. Koch Theater — converge at this circle.",
  },
  {
    id: "936d479d-402f-468a-b1c6-b2c2a68a0b4c",
    displayName: "George Washington Bridge",
    tags: ["landmark", "commute"],
    nearestSubwayLines: ["A"],
    lore: "The GWB has more lanes of traffic than any bridge in the world — 14 total. Le Corbusier called it 'the most beautiful bridge in the world.' The little red lighthouse underneath, built in 1880, was saved from demolition by public outcry after a children's book made it famous.",
  },
  {
    id: "5c4582a7-6492-41ac-9bac-fa872878117b",
    displayName: "West Street, Downtown",
    tags: ["landmark", "waterfront"],
    nearestSubwayLines: ["1", "2", "3", "4", "5", "A", "C", "E", "R", "W"],
    lore: "Lower Manhattan's western edge was built progressively outward into the Hudson River over three centuries of landfill — the ground here didn't exist when the Dutch arrived in 1626. This stretch of West Street was once the heart of New York's maritime economy, where tall ships unloaded cargo from around the world.",
  },
  {
    id: "7cfc551d-403d-46a8-aa74-89f472b7136b",
    displayName: "Battery Park",
    tags: ["waterfront", "landmark"],
    nearestSubwayLines: ["1", "4", "5", "R", "W"],
    lore: "The southern tip of Manhattan. Dutch settlers built a fort here in 1626. Today it's the departure point for the Statue of Liberty and Ellis Island ferries. On a clear day you can see the Verrazano from the water's edge.",
  },
  {
    id: "ecba28cb-ac70-4d25-abcb-6506111ea120",
    displayName: "FDR @ Brooklyn Bridge",
    tags: ["commute", "landmark"],
    nearestSubwayLines: ["4", "5", "6"],
    lore: "The FDR Drive runs the full length of Manhattan's east side on a series of viaducts built over the water. At rush hour, this stretch near the Brooklyn Bridge is one of the city's most reliable traffic jams.",
  },

  // ── Brooklyn ─────────────────────────────────────────────────────────────────

  {
    id: "07c5a9ab-38b0-4176-a932-395cded5858e",
    displayName: "Brooklyn Heights",
    tags: ["landmark"],
    nearestSubwayLines: ["2", "3", "4", "5", "A", "C", "F"],
    lore: "Cadman Plaza was carved from a dense neighborhood in the 1950s to anchor the new Brooklyn Civic Center. The approach to the Brooklyn Bridge on this side passes through some of the oldest streets in the borough. Brooklyn Heights was the first neighborhood in New York City to be designated a historic district, in 1965.",
  },
  {
    id: "0f3b6031-fe36-43df-b2c7-6120e0580309",
    displayName: "Brooklyn Bridge Walk",
    tags: ["commute", "landmark"],
    nearestSubwayLines: ["4", "5", "6", "A", "C"],
    lore: "Opened in 1883, it was the longest suspension bridge in the world for 20 years. The pedestrian walkway runs above the car lanes — rare for its era. Over 100,000 vehicles cross daily.",
  },
  {
    id: "f1912436-d91e-407e-b4a3-d163090f226f",
    displayName: "DUMBO",
    tags: ["waterfront", "landmark"],
    nearestSubwayLines: ["A", "C"],
    lore: "Old Fulton Street is the original ferry landing where Robert Fulton's steam ferry connected Brooklyn to Manhattan starting in 1814 — a service that ran until the Brooklyn Bridge made it obsolete in 1883. DUMBO — Down Under the Manhattan Bridge Overpass — was named by artists who moved here in the 1970s hoping the awkward name would keep developers away.",
  },
  {
    id: "cb68b8b1-9093-4f2e-acf2-8133b047e8df",
    displayName: "Grand Army Plaza",
    tags: ["landmark", "park"],
    nearestSubwayLines: ["2", "3"],
    lore: "Eastern Parkway was the world's first parkway — laid out by Olmsted and Vaux in 1874 as a grand boulevard extending from Prospect Park. Grand Army Plaza's triumphal arch was dedicated in 1892 to Union soldiers. On Saturdays, one of New York's best greenmarkets fills the plaza.",
  },
  {
    id: "3c079db6-117c-4e79-94ed-5178c1517091",
    displayName: "Prospect Park",
    tags: ["park"],
    nearestSubwayLines: ["F", "G", "B", "Q"],
    lore: "Olmsted and Vaux considered Prospect Park their finest work — better than Central Park. The Long Meadow at the center is the largest open green space in Brooklyn. The park was completed in 1873; the Prospect Expressway cuts along its western edge, a reminder of Robert Moses' near-miss attempt to run a highway through the park itself.",
  },
  {
    id: "053afe02-e1b3-4bea-9995-787e72c7fff4",
    displayName: "Barclays Center",
    tags: ["venue"],
    nearestSubwayLines: ["2", "3", "4", "5", "B", "D", "N", "Q", "R"],
    lore: "Built over one of the busiest transit hubs in Brooklyn. The arena opened in 2012 above the Atlantic Yards site — a 10-year redevelopment fight that reshaped the neighborhood. Nine subway lines converge below it.",
  },
  {
    id: "899dfa1e-a2c5-490a-b8ba-480493634846",
    displayName: "Coney Island",
    tags: ["beach"],
    nearestSubwayLines: ["D", "F", "N", "Q"],
    lore: "NYC's summer escape since the 1880s. Nathan's Famous hot dog stand opened here in 1916 and still hosts the July 4th eating contest. The Wonder Wheel has turned since 1920. The subway reaches the ocean.",
  },

  // ── Queens ───────────────────────────────────────────────────────────────────

  {
    id: "67f77766-bd19-4082-adeb-88d59866c490",
    displayName: "Long Island City",
    tags: ["commute", "waterfront"],
    nearestSubwayLines: ["7", "G"],
    lore: "The views of Midtown Manhattan from the Long Island City waterfront — the Chrysler Building perfectly framed across the East River — are among the best in the city and entirely free. The neighborhood went from one of NYC's densest manufacturing zones to one of its fastest-growing communities in under two decades.",
  },
  {
    id: "cbd7c7a6-9bc5-4d6d-baf4-61b648dd589d",
    displayName: "Astoria",
    tags: ["neighborhood"],
    nearestSubwayLines: ["N", "W"],
    lore: "Astoria has one of the largest Greek communities outside Greece, concentrated here since the 1950s. Kaufman Astoria Studios — four blocks south — was built by Paramount Pictures in 1920 and still operates as one of the country's oldest working film studios. LaGuardia Airport sits a mile to the north.",
  },
  {
    id: "5507fab3-3430-4747-a9ab-ed9f7b5ba959",
    displayName: "Jackson Heights",
    tags: ["neighborhood", "commute"],
    nearestSubwayLines: ["E", "F", "M", "R", "7"],
    lore: "Jackson Heights was developed in the 1910s as a planned garden community — the first in the US to offer cooperative apartment ownership, with shared interior courtyards considered revolutionary at the time. Today it's one of the most linguistically diverse places on Earth: the UN has identified over 160 languages spoken within a few square miles.",
  },
  {
    id: "6dd4b946-8704-4690-aa87-017a19e778c5",
    displayName: "Jamaica",
    tags: ["neighborhood", "commute"],
    nearestSubwayLines: ["J", "Z"],
    lore: "Jamaica Avenue follows an Indigenous trail called the King's Highway that ran along Long Island's spine before European settlement. The elevated J and Z trains run directly above the avenue; the line here opened in 1918. JFK Airport is 3 miles south.",
  },
  {
    id: "16d86749-6ec5-4594-8ccc-56c9507fedc3",
    displayName: "Rockaway",
    tags: ["beach"],
    nearestSubwayLines: ["A"],
    lore: "A barrier peninsula with 11 miles of Atlantic coastline — NYC's only true ocean beach. The A train runs 31 miles from the northern tip of Manhattan all the way here, the longest single-seat subway ride in the system. The boardwalk stretches nearly 6 miles along the oceanfront.",
  },

  // ── The Bronx ─────────────────────────────────────────────────────────────────

  {
    id: "2f28f8df-5eb5-4327-ab1f-7feaf2630b34",
    displayName: "Grand Concourse",
    tags: ["landmark", "neighborhood"],
    nearestSubwayLines: ["4", "D"],
    lore: "Modeled on the Champs-Élysées, the Grand Concourse was laid out in 1909 as a residential boulevard. It's lined with some of the finest Art Deco apartment buildings in the United States — the result of a Jewish middle-class migration north from the Lower East Side in the 1920s and '30s.",
  },
  {
    id: "2a0ec6ff-9284-466a-9785-9f6df84ea4cf",
    displayName: "Fordham Road",
    tags: ["neighborhood", "commute"],
    nearestSubwayLines: ["4", "B", "D"],
    lore: "Fordham Road is the Bronx's main commercial corridor — on weekends it rivals Midtown in pedestrian density. Fordham University, founded by the Jesuits in 1841, sits just west. The mix of Dominican, Albanian, and West African communities here has made Fordham one of the most linguistically layered blocks in the borough.",
  },
  {
    id: "0ee4eb1e-77ce-47a1-a145-0cb115656aad",
    displayName: "Cross Bronx Expressway",
    tags: ["commute"],
    nearestSubwayLines: ["6"],
    lore: "The Cross Bronx runs elevated up to 60 feet above street level, cut through solid schist bedrock — the same ancient rock formation that lets Manhattan's skyscrapers stand. The Bronx is also the only borough on the North American mainland; every other borough is on an island.",
  },
  {
    id: "7badcb3f-7cb5-4fa6-90fd-40c3b6c40eac",
    displayName: "Bronx River Parkway",
    tags: ["commute"],
    nearestSubwayLines: ["2", "5"],
    lore: "Completed in 1906, the Bronx River Parkway was the first parkway in the United States — predating the word itself. After decades of community-led restoration, otters, migratory fish, and great blue herons have returned to the Bronx River corridor, one of the most remarkable urban wildlife comebacks in the Northeast.",
  },

  // ── Staten Island ─────────────────────────────────────────────────────────────

  {
    id: "36d22d6d-bffd-4466-8a9c-9c78a1bb9021",
    displayName: "St. George",
    tags: ["waterfront", "commute"],
    nearestSubwayLines: ["SIR"],
    lore: "Victory Boulevard leads directly to the St. George Ferry Terminal, where 70,000 passengers a day ride the free Staten Island Ferry. The 25-minute crossing offers unobstructed views of the Statue of Liberty and Lower Manhattan at no cost. It has been free since 1997.",
  },
  {
    id: "0f5e11ff-0ecc-4622-a32e-bb80a6b2c1c6",
    displayName: "Hylan Boulevard",
    tags: ["commute"],
    nearestSubwayLines: [],
    lore: "Hylan Boulevard runs 17 miles along Staten Island's south shore end to end. Named for former mayor John Hylan, who tried to municipalize the city's subways in the 1920s. The south shore remained largely undeveloped marshland until the Verrazano-Narrows Bridge opened in 1964 and triggered a wave of development that transformed the borough.",
  },
  {
    id: "34af619f-c745-4f09-a81c-e3635dd764c6",
    displayName: "Richmond Avenue",
    tags: ["neighborhood"],
    nearestSubwayLines: [],
    lore: "Richmond Avenue runs through the heart of Staten Island, just east of the Staten Island Greenbelt — a 3,000-acre continuous forest preserve and the largest natural area in New York City. More deer live in the Greenbelt than anywhere else in the five boroughs, and the trails inside feel nothing like the city surrounding them.",
  },
];

export function buildFeaturedCameras(allCameras: typeof CAMERAS): FeaturedCamera[] {
  return FEATURED_CONFIGS.flatMap((config) => {
    const camera = allCameras.find((c) => c.id === config.id);
    if (!camera) return [];
    return [{ ...camera, ...config }];
  });
}

export const FEATURED_CAMERAS: FeaturedCamera[] = buildFeaturedCameras(CAMERAS);
