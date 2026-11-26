// Minimal protobuf encoder for building GTFS-realtime test feeds.

interface FixtureStop {
  stopId: string;
  arrival?: number;
  departure?: number;
}

interface FixtureTrip {
  routeId: string;
  stops: FixtureStop[];
}

interface FixtureOptions {
  withHeader?: boolean;
  withVehicleEntity?: boolean;
  withExtensions?: boolean;
}

function varint(value: number): number[] {
  const out: number[] = [];
  let v = value;
  while (v >= 0x80) {
    out.push((v % 0x80) | 0x80);
    v = Math.floor(v / 0x80);
  }
  out.push(v);
  return out;
}

const tag = (field: number, wireType: number) => varint(field * 8 + wireType);
const lenField = (field: number, bytes: number[]) => [
  ...tag(field, 2),
  ...varint(bytes.length),
  ...bytes,
];
const intField = (field: number, value: number) => [...tag(field, 0), ...varint(value)];
const str = (s: string) => [...new TextEncoder().encode(s)];

function stopTimeUpdate(stop: FixtureStop, withExtensions: boolean): number[] {
  const bytes = [...intField(1, 7)];
  if (stop.arrival !== undefined) bytes.push(...lenField(2, intField(2, stop.arrival)));
  if (stop.departure !== undefined) bytes.push(...lenField(3, intField(2, stop.departure)));
  bytes.push(...lenField(4, str(stop.stopId)));
  if (withExtensions) bytes.push(...lenField(1001, str("track 2")));
  return bytes;
}

export function encodeFeed(trips: FixtureTrip[], options: FixtureOptions = {}): Uint8Array {
  const bytes: number[] = [];
  if (options.withHeader) {
    bytes.push(...lenField(1, [...lenField(1, str("1.0")), ...intField(3, 1_791_699_000)]));
  }
  if (options.withVehicleEntity) {
    bytes.push(...lenField(2, [...lenField(1, str("veh")), ...lenField(4, intField(5, 3))]));
  }
  trips.forEach((trip, i) => {
    const descriptor = [...lenField(1, str(`trip-${i}`)), ...lenField(5, str(trip.routeId))];
    const update = [
      ...lenField(1, descriptor),
      ...trip.stops.flatMap((s) => lenField(2, stopTimeUpdate(s, !!options.withExtensions))),
    ];
    // fixed32 field (wire type 5) to prove unknown wire types are skipped
    const fixed32 = options.withExtensions ? [...tag(9, 5), 1, 2, 3, 4] : [];
    bytes.push(...lenField(2, [...lenField(1, str(`e${i}`)), ...lenField(3, update), ...fixed32]));
  });
  return new Uint8Array(bytes);
}
