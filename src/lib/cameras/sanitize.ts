const HIGHWAY_MAP: Record<string, string> = {
  BRE: "Bruckner Expy",
  BRP: "Bronx River Pkwy",
  CBE: "Cross Bronx Expy",
  CBX: "Cross Bronx Expy",
  MDE: "Major Deegan Expy",
  SHE: "Sheridan Expy",
  TNE: "Throgs Neck Expy",
  BQE: "BQE",
  GE: "Gowanus Expy",
  PE: "Prospect Expy",
  KWV: "Korean War Veterans Pkwy",
  MLK: "MLK Expy",
  SIE: "Staten Island Expy",
  WSE: "West Shore Expy",
  WST: "West Side Hwy",
  CVE: "Clearview Expy",
  GCP: "Grand Central Pkwy",
  LIE: "Long Island Expy",
  VWE: "Van Wyck Expy",
};

// NO i-flag — [A-Z_]+ must only match uppercase letters/underscore,
// preventing it from consuming lowercase location text like "at_Location_Name".
const DIRECTION_PREFIX_RE =
  /^\d+[A-Z]?[-_]?(?:[A-Z_]+\s*-\s*)?(?:(?:NB|SB|EB|WB|Med|Cntr|Ctr|N|S|E|W)\s*[-_]?\s*)?/;

function decodeCCode(name: string): string | null {
  const hwMatch = name.match(/^C\d-([A-Z]+)-(.+)$/);
  if (!hwMatch) return null;

  const [, hwCode, rest] = hwMatch;
  const highway = HIGHWAY_MAP[hwCode];
  if (!highway) return null;

  let body = rest.replace(DIRECTION_PREFIX_RE, "").trim();

  body = body.replace(/^(?:NB|SB|EB|WB|Med|Cntr|Ctr)[-_]+at[-_]/gi, "");
  body = body.replace(/^_?at[_\s]?/i, "");
  body = body.replace(/[-_](?:Ex|EX)\d+[-\w]*$/i, "");

  if (!body) return null;

  body = body.replace(/_?Btwn_?/gi, " between ");
  body = body
    .replace(/_/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return `${highway} @ ${body}`;
}

export function sanitizeCameraName(name: string): string {
  let n = name.trim();

  if (/^C\d-[A-Z]/.test(n)) {
    const decoded = decodeCCode(n);
    if (decoded) return decoded;
    return n
      .replace(/^C\d-[A-Z]+-\d+[A-Z]?[-_]/i, "")
      .replace(/[-_](?:Ex|EX)\d+[-\w]*$/i, "")
      .replace(/_at_/gi, " @ ")
      .replace(/_Btwn_/gi, " between ")
      .replace(/_/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  n = n.replace(/\s*-\s*quad\s*-\s*ptz/gi, "");
  n = n.replace(/\s*-\s*ptz/gi, "");
  n = n.replace(/\s*-\s*quad/gi, "");
  n = n.replace(/\s*\(ptz\)\s*/gi, "");
  n = n.replace(/\s*-?\s*\d+\.\d+(\.\d+)?$/, "");
  n = n.replace(/\s*-?\s*Quad\s+(North|South|East|West)/gi, " $1");
  n = n.replace(/\s*-\s*Quad\s*$/gi, "");
  n = n.replace(/\s{2,}/g, " ").trim();

  return n;
}
