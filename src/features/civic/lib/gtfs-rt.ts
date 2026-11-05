// Minimal GTFS-realtime reader: just enough protobuf wire format to pull
// route_id and per-stop arrival times out of TripUpdate entities.
// Field numbers follow https://gtfs.org/realtime/proto/

export interface DecodedStop {
  stopId: string;
  time: number;
}

export interface DecodedTrip {
  routeId: string;
  stops: DecodedStop[];
}

class Reader {
  pos: number;
  constructor(
    private readonly buf: Uint8Array,
    start = 0,
    readonly end = buf.length
  ) {
    this.pos = start;
  }

  get done() {
    return this.pos >= this.end;
  }

  varint(): number {
    let result = 0;
    let multiplier = 1;
    for (;;) {
      if (this.pos >= this.end) throw new RangeError("truncated varint");
      const byte = this.buf[this.pos++];
      result += (byte & 0x7f) * multiplier;
      if (byte < 0x80) return result;
      multiplier *= 0x80;
    }
  }

  sub(): Reader {
    const length = this.varint();
    const start = this.pos;
    this.pos += length;
    if (this.pos > this.end) throw new RangeError("truncated field");
    return new Reader(this.buf, start, start + length);
  }

  string(): string {
    const r = this.sub();
    return new TextDecoder().decode(this.buf.subarray(r.pos, r.end));
  }

  skip(wireType: number) {
    if (wireType === 0) this.varint();
    else if (wireType === 1) this.pos += 8;
    else if (wireType === 2) this.sub();
    else if (wireType === 5) this.pos += 4;
    else throw new RangeError(`unsupported wire type ${wireType}`);
    if (this.pos > this.end) throw new RangeError("truncated field");
  }

  fields(onField: (field: number, wireType: number) => boolean) {
    while (!this.done) {
      const key = this.varint();
      const field = Math.floor(key / 8);
      const wireType = key % 8;
      if (!onField(field, wireType)) this.skip(wireType);
    }
  }
}

function readEventTime(r: Reader): number | null {
  let time: number | null = null;
  r.fields((field, wireType) => {
    if (field === 2 && wireType === 0) {
      time = r.varint();
      return true;
    }
    return false;
  });
  return time;
}

function readStopTimeUpdate(r: Reader): DecodedStop | null {
  let stopId = "";
  let arrival: number | null = null;
  let departure: number | null = null;
  r.fields((field, wireType) => {
    if (wireType !== 2) return false;
    if (field === 2) arrival = readEventTime(r.sub());
    else if (field === 3) departure = readEventTime(r.sub());
    else if (field === 4) stopId = r.string();
    else return false;
    return true;
  });
  const time = arrival ?? departure;
  return stopId && time ? { stopId, time } : null;
}

function readTripUpdate(r: Reader): DecodedTrip | null {
  let routeId = "";
  const stops: DecodedStop[] = [];
  r.fields((field, wireType) => {
    if (wireType !== 2) return false;
    if (field === 1) {
      const trip = r.sub();
      trip.fields((f, wt) => {
        if (f === 5 && wt === 2) {
          routeId = trip.string();
          return true;
        }
        return false;
      });
    } else if (field === 2) {
      const stop = readStopTimeUpdate(r.sub());
      if (stop) stops.push(stop);
    } else return false;
    return true;
  });
  return routeId ? { routeId, stops } : null;
}

export function decodeTripUpdates(buf: Uint8Array): DecodedTrip[] {
  const trips: DecodedTrip[] = [];
  try {
    const feed = new Reader(buf);
    feed.fields((field, wireType) => {
      if (field !== 2 || wireType !== 2) return false;
      const entity = feed.sub();
      entity.fields((f, wt) => {
        if (f !== 3 || wt !== 2) return false;
        const trip = readTripUpdate(entity.sub());
        if (trip) trips.push(trip);
        return true;
      });
      return true;
    });
  } catch {
    return [];
  }
  return trips;
}
