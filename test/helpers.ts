// Helpers compartidos por todos los tests de test/.
//
// MOCK DE @clack/prompts: Bun solo aplica `mock.module()` cuando la llamada
// literal aparece en el propio archivo *.test.ts (la eleva por encima de los
// imports estáticos). Por eso cada archivo de test que toque la UI debe
// incluir estas dos líneas ANTES de importar módulos de src/:
//
//   import { mock } from "bun:test";
//   import { promptsMockFactory } from "./helpers.ts"; // o ../helpers.ts
//   mock.module("@clack/prompts", () => promptsMockFactory());
//
// El factory es el mismo en todos los archivos y opera sobre `promptsState`
// (singletons de este módulo), así que el orden de ejecución de archivos da
// igual: todos comparten las mismas colas, reiniciadas en cada test.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach } from "bun:test";

/* ------------------------------------------------------------------ */
/* Sandbox de HOME / XDG_CONFIG_HOME                                   */
/* ------------------------------------------------------------------ */

let sandboxDir = "";
let savedHome: string | undefined;
let savedXdg: string | undefined;

async function setupSandbox(): Promise<void> {
  sandboxDir = await mkdtemp(join(tmpdir(), "weather-cli-test-"));
  savedHome = process.env.HOME;
  savedXdg = process.env.XDG_CONFIG_HOME;
  process.env.HOME = join(sandboxDir, "home");
  process.env.XDG_CONFIG_HOME = join(sandboxDir, "config");
}

async function teardownSandbox(): Promise<void> {
  if (savedHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = savedHome;
  }
  if (savedXdg === undefined) {
    delete process.env.XDG_CONFIG_HOME;
  } else {
    process.env.XDG_CONFIG_HOME = savedXdg;
  }
  await rm(sandboxDir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------ */
/* Mock global de @clack/prompts                                       */
/* ------------------------------------------------------------------ */

// Encola este símbolo como respuesta de `select`/`text` para simular que el
// usuario cancela (equivale a pulsar Ctrl+C en la CLI real).
export const CANCEL = Symbol("clack-cancel");

export interface SelectCall {
  message: string;
  options: Array<{ value: unknown; label: string; hint?: string }>;
}

export interface TextCall {
  message: string;
  placeholder?: string;
  validate?: (input: string | undefined) => string | undefined;
}

export interface LogEntry {
  level: "info" | "success" | "warn" | "error";
  message: string;
}

export interface PromptsState {
  selectResponses: unknown[];
  textResponses: unknown[];
  selectCalls: SelectCall[];
  textCalls: TextCall[];
  logs: LogEntry[];
  spinnerStarts: string[];
  spinnerStops: Array<string | undefined>;
  outros: string[];
}

function emptyPromptsState(): PromptsState {
  return {
    selectResponses: [],
    textResponses: [],
    selectCalls: [],
    textCalls: [],
    logs: [],
    spinnerStarts: [],
    spinnerStops: [],
    outros: [],
  };
}

// Estado único compartido por todos los archivos de test.
export const promptsState: PromptsState = emptyPromptsState();

function resetPrompts(): void {
  const fresh = emptyPromptsState();
  promptsState.selectResponses = fresh.selectResponses;
  promptsState.textResponses = fresh.textResponses;
  promptsState.selectCalls = fresh.selectCalls;
  promptsState.textCalls = fresh.textCalls;
  promptsState.logs = fresh.logs;
  promptsState.spinnerStarts = fresh.spinnerStarts;
  promptsState.spinnerStops = fresh.spinnerStops;
  promptsState.outros = fresh.outros;
}

// Respuestas encoladas: cada llamada a `select`/`text` consume la primera.
export function answerSelect(...responses: unknown[]): void {
  promptsState.selectResponses.push(...responses);
}

export function answerText(...responses: unknown[]): void {
  promptsState.textResponses.push(...responses);
}

// Las capturas de `log`/`spinner` se normalizan sin secuencias ANSI: las
// funciones `success`/`error` de output.ts colorean con picocolors y los
// códigos emitidos dependen del entorno (TTY, CI, NO_COLOR...). Comparar el
// texto visible hace los tests deterministas en cualquier terminal.
function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

// Factory del mock: lo invoca Bun de forma perezosa al resolver
// `@clack/prompts`, cuando este módulo ya está evaluado.
export function promptsMockFactory(): Record<string, unknown> {
  return {
    select: async (opts: SelectCall): Promise<unknown> => {
      promptsState.selectCalls.push({
        message: opts.message,
        options: opts.options,
      });
      if (promptsState.selectResponses.length === 0) {
        throw new Error("test: no hay respuestas encoladas para select()");
      }
      return promptsState.selectResponses.shift();
    },
    text: async (opts: TextCall): Promise<unknown> => {
      promptsState.textCalls.push({
        message: opts.message,
        placeholder: opts.placeholder,
        validate: opts.validate,
      });
      if (promptsState.textResponses.length === 0) {
        throw new Error("test: no hay respuestas encoladas para text()");
      }
      return promptsState.textResponses.shift();
    },
    isCancel: (value: unknown): boolean => value === CANCEL,
    spinner: () => ({
      start: (message: string): void => {
        promptsState.spinnerStarts.push(message);
      },
      stop: (message?: string): void => {
        promptsState.spinnerStops.push(message === undefined ? message : stripAnsi(message));
      },
    }),
    log: {
      info: (message: string): void => {
        promptsState.logs.push({ level: "info", message: stripAnsi(message) });
      },
      success: (message: string): void => {
        promptsState.logs.push({ level: "success", message: stripAnsi(message) });
      },
      warn: (message: string): void => {
        promptsState.logs.push({ level: "warn", message: stripAnsi(message) });
      },
      error: (message: string): void => {
        promptsState.logs.push({ level: "error", message: stripAnsi(message) });
      },
    },
    outro: (message: string): void => {
      promptsState.outros.push(message);
    },
    intro: (): void => undefined,
    note: (): void => undefined,
    cancel: (): void => undefined,
    confirm: async (): Promise<undefined> => undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Mock de fetch                                                       */
/* ------------------------------------------------------------------ */

const realFetch = globalThis.fetch;

export interface MockFetch {
  urls: string[];
}

type FetchResponder =
  | unknown
  | ((url: string, call: number) => { body: unknown; status?: number } | unknown);

// Sustituye globalThis.fetch por un mock que devuelve JSON. `respond` puede ser
// el cuerpo fijo o una función (url, nº de llamada) que devuelve el cuerpo o
// `{ body, status }`. El fetch real se restaura en el afterEach de
// `useIsolatedTestEnv()`.
export function mockFetchJson(respond: FetchResponder, status = 200): MockFetch {
  const state: MockFetch = { urls: [] };
  let calls = 0;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input);
    state.urls.push(url);
    calls += 1;
    const result = typeof respond === "function" ? respond(url, calls) : respond;
    const body =
      result !== null && typeof result === "object" && "body" in result
        ? (result as { body: unknown }).body
        : result;
    const code =
      result !== null && typeof result === "object" && "status" in result
        ? Number((result as { status: unknown }).status)
        : status;
    return new Response(JSON.stringify(body), {
      status: code,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return state;
}

export function mockFetchError(status: number): MockFetch {
  return mockFetchJson({}, status);
}

/* ------------------------------------------------------------------ */
/* Aislamiento por test                                                */
/* ------------------------------------------------------------------ */

// Llamar una vez en el nivel superior de cada archivo *.test.ts. Prepara un
// HOME/XDG temporal, reinicia las colas del mock de prompts y restaura fetch
// y las variables de entorno al terminar cada test.
export function useIsolatedTestEnv(): void {
  beforeEach(async () => {
    await setupSandbox();
    resetPrompts();
  });
  afterEach(async () => {
    globalThis.fetch = realFetch;
    await teardownSandbox();
  });
}
