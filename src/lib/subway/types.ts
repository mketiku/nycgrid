export interface SubwayStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routes: string[];
  northLabel: string | null;
  southLabel: string | null;
}
