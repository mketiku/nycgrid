export interface CollisionSummary {
  crashes: number;
  injured: number;
  killed: number;
  pedestriansInjured: number;
  cyclistsInjured: number;
}

export interface ComplaintSummary {
  total: number;
  top: { label: string; count: number }[];
}
