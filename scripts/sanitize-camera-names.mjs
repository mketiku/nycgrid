/**
 * Camera name sanitization — removes DOT equipment codes, PTZ/quad suffixes,
 * numeric angle codes, and decodes internal C-code highway names to readable form.
 *
 * Exported as a function so fetch-cameras.mjs can apply it on every fetch.
 * Run directly to apply in-place to an existing data.ts:
 *   node scripts/sanitize-camera-names.mjs
 */

const HIGHWAY_MAP = {
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

function decodeCCode(name) {
  const hwMatch = name.match(/^C\d-([A-Z]+)-(.+)$/);
  if (!hwMatch) return null;

  const [, hwCode, rest] = hwMatch;
  const highway = HIGHWAY_MAP[hwCode];
  if (!highway) return null;

  let body = rest.replace(DIRECTION_PREFIX_RE, "").trim();

  // Strip direction code that leaked through double-prefix patterns like _N_NB_at_
  body = body.replace(/^(?:NB|SB|EB|WB|Med|Cntr|Ctr)[-_]+at[-_]/gi, "");
  body = body.replace(/^_?at[_\s]?/i, "");

  // Strip trailing exit codes (-Ex10, _Ex15, -Ex7-CBX, -EX6A).
  // Require at least one digit after Ex so "_Expwy" is never stripped.
  body = body.replace(/[-_](?:Ex|EX)\d+[-\w]*$/i, "");

  if (!body) return null;

  body = body.replace(/_?Btwn_?/gi, " between ");
  body = body.replace(/_/g, " ").replace(/\s{2,}/g, " ").trim();

  return `${highway} @ ${body}`;
}

export function sanitizeCameraName(name) {
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
  n = n.replace(/\s*-\s*\d+\.\d+(\.\d+)?$/, "");
  n = n.replace(/\s*-?\s*Quad\s+(North|South|East|West)/gi, " $1");
  n = n.replace(/\s*-\s*Quad\s*$/gi, "");
  n = n.replace(/\s{2,}/g, " ").trim();

  return n;
}

// CLI: apply sanitization in-place to data.ts when run directly
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  const { readFileSync, writeFileSync } = await import("fs");
  const filePath = "src/lib/cameras/data.ts";
  const data = readFileSync(filePath, "utf8");
  let changed = 0;
  const result = data.replace(/("name":\s*|name:\s*)"([^"]+)"/g, (match, prefix, original) => {
    const sanitized = sanitizeCameraName(original);
    if (sanitized !== original) {
      changed++;
      return `${prefix}"${sanitized}"`;
    }
    return match;
  });
  writeFileSync(filePath, result, "utf8");
  console.log(`Done. ${changed} camera names sanitized.`);
}
