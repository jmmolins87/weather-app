import { homedir } from "node:os";
import { join } from "node:path";
import type { AppState } from "./types.ts";

const STORAGE_PATH = join(homedir(), ".weather-cli.json");

function emptyState(): AppState {
  return { cities: [], settings: { unit: "celsius" } };
}

export async function loadState(): Promise<AppState> {
  const file = Bun.file(STORAGE_PATH);
  if (!(await file.exists())) {
    return emptyState();
  }
  try {
    const parsed = (await file.json()) as Partial<AppState>;
    return {
      cities: Array.isArray(parsed.cities) ? parsed.cities : [],
      settings: {
        unit: parsed.settings?.unit === "fahrenheit" ? "fahrenheit" : "celsius",
      },
      defaultCityId:
        typeof parsed.defaultCityId === "number" ? parsed.defaultCityId : undefined,
    };
  } catch {
    return emptyState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  await Bun.write(STORAGE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}
