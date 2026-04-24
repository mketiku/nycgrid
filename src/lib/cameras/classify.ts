export type CameraType = "street" | "bridge" | "highway" | "tunnel";

export function classifyCameraType(name: string): CameraType {
  const n = name.toUpperCase();
  if (
    /^(BB-|BB |WBB|MHB-|QBB)/.test(n) ||
    /BROOKLYN BRIDGE|WILLIAMSBURG BRIDGE|MANHATTAN BRIDGE|QUEENSBORO|VERRAZZANO|VERRAZANO|THIRD AVE BRIDGE|FLUSHING BRIDGE|TRIBORO|MACOMBS DAM BR/.test(
      n
    )
  )
    return "bridge";
  if (
    /LINCOLN TUN|MIDTOWN TUNNEL|QMT|HOLLAND TUNNEL|BATTERY.{0,10}TUNNEL/.test(n) ||
    n.includes("DYER AVE")
  )
    return "tunnel";
  if (
    /\b(BQE|FDR|LIE|GCP|SIE|WSE|MLK|MDE|CBX|CBE|BRE|TNE|SHE|VWE|CVE|KWV|PE-|GE-)\b/.test(n) ||
    /PKWY|EXPWY|EXPY|EXPRESSWAY|THRUWAY|PARKWAY/.test(n) ||
    /^C[1-5]-/.test(n) ||
    /BELT|BRUCKNER|DEEGAN|HENRY HUDSON|HARLEM RIVER|HARLEM RVR|HUTCHH?INSON|BRONX RIVER|JACKIE ROBINSON|PELHAM|CLEARVIEW|VAN WYCK|NASSAU EXP|GOWANUS|PROSPECT EXP|CROSS BRONX|CROSS BAY|CROSS ISLAND|NE THRUWAY|NEW ENG/.test(
      n
    ) ||
    /BPU|NORTH BOUND BPU|SOUTH BOUND BPU/.test(n)
  )
    return "highway";
  return "street";
}
