import { saveState } from "./state.ts";
import type { AppState } from "../types/AppState.ts";
import type { City } from "../types/City.ts";

export function findDefaultCity(state: AppState): City | undefined {
  return state.cities.find((city) => city.id === state.defaultCityId);
}

export async function addCity(state: AppState, city: City): Promise<void> {
  state.cities.push(city);
  await saveState(state);
}

export async function removeCity(state: AppState, id: number): Promise<City | undefined> {
  const city = state.cities.find((c) => c.id === id);
  state.cities = state.cities.filter((c) => c.id !== id);
  if (state.defaultCityId === id) {
    state.defaultCityId = undefined;
  }
  await saveState(state);
  return city;
}

export async function setDefaultCity(
  state: AppState,
  id: number,
): Promise<City | undefined> {
  state.defaultCityId = id;
  await saveState(state);
  return state.cities.find((c) => c.id === id);
}
