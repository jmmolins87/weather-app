import type { City } from "./City.ts";
import type { Settings } from "./Settings.ts";

export interface AppState {
  cities: City[];
  settings: Settings;
  defaultCityId?: number;
}
