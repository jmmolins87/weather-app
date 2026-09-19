export interface City {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  population?: number;
}

export type TemperatureUnit = "celsius" | "fahrenheit";

export interface Settings {
  unit: TemperatureUnit;
}

export interface AppState {
  cities: City[];
  settings: Settings;
  defaultCityId?: number;
}
