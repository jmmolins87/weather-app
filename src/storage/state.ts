import { mkdir, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import type { AppState } from "../types/AppState.ts";

const CONFIG_DIR_NAME = "weather-cli";
const STATE_FILE_NAME = "state.json";
const LEGACY_FILE_NAME = ".weather-cli.json";

function homeDir(): string {
  // Se lee process.env.HOME en cada llamada (no homedir() cacheado) para que
  // los tests puedan aislar el home y nunca toquen los datos reales.
  const home = process.env.HOME;
  if (home !== undefined && home !== "") {
    return home;
  }
  return homedir();
}

export function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base =
    xdg !== undefined && xdg !== "" && isAbsolute(xdg) ? xdg : join(homeDir(), ".config");
  return join(base, CONFIG_DIR_NAME);
}

export function storagePath(): string {
  return join(configDir(), STATE_FILE_NAME);
}

export function legacyStoragePath(): string {
  return join(homeDir(), LEGACY_FILE_NAME);
}

function emptyState(): AppState {
  return { cities: [], settings: { unit: "celsius" } };
}

function parseState(value: unknown): AppState {
  const parsed = (value ?? {}) as Partial<AppState>;
  return {
    cities: Array.isArray(parsed.cities) ? parsed.cities : [],
    settings: {
      unit: parsed.settings?.unit === "fahrenheit" ? "fahrenheit" : "celsius",
    },
    defaultCityId:
      typeof parsed.defaultCityId === "number" ? parsed.defaultCityId : undefined,
  };
}

async function readStateFile(path: string): Promise<AppState | undefined> {
  const file = Bun.file(path);
  if (!(await file.exists())) {
    return undefined;
  }
  try {
    return parseState(await file.json());
  } catch {
    return undefined;
  }
}

async function migrateLegacy(): Promise<AppState | undefined> {
  const legacy = await readStateFile(legacyStoragePath());
  if (legacy === undefined) {
    return undefined;
  }
  await saveState(legacy);
  try {
    await unlink(legacyStoragePath());
  } catch {
    // Los datos ya quedaron copiados; si el archivo viejo no se puede borrar, no pasa nada.
  }
  return legacy;
}

export async function loadState(): Promise<AppState> {
  const path = storagePath();
  if (await Bun.file(path).exists()) {
    return (await readStateFile(path)) ?? emptyState();
  }
  return (await migrateLegacy()) ?? emptyState();
}

export async function saveState(state: AppState): Promise<void> {
  const path = storagePath();
  await mkdir(dirname(path), { recursive: true });
  await Bun.write(path, `${JSON.stringify(state, null, 2)}\n`);
}
