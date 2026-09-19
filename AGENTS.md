# AGENTS.md

Bun + TypeScript weather CLI (course project). Entry point is `src/index.ts`, which just calls `main()` from `src/presentation/menu.ts`; the app is fully functional. Modules under `src/` (see `references/file-system.md`): `types/` (shared types: `City`, `Weather`, `Settings`, `AppState`, `MenuOption`), `api/` (`geocoding.ts` for OpenMeteo geocoding, `weather.ts` for current weather + 7-day forecast), `storage/` (`state.ts` owns the `state.json` file in `~/.config/weather-cli/`, honoring `XDG_CONFIG_HOME`, and migrates legacy `~/.weather-cli.json` on first load; `citiesStorage.ts`/`settingsStorage.ts` are domain facades over it), `actions/` (one user action per file, each exporting `run(state)`), `presentation/` (`menu.ts` renders the menu and runs the loop; `output.ts`/`input.ts` wrap `@clack/prompts`; colors via `picocolors`), `utils/` (`format.ts`, `constants.ts`, `colors.ts`). Menu entries are a `MENU_OPTIONS` registry — adding a feature = adding one action file + one entry. Tests live in `test/` (`bun:test`, mocked `fetch`, isolated `HOME`/`XDG_CONFIG_HOME` sandbox per test, `@clack/prompts` mocked via `mock.module` with shared queues in `test/helpers.ts`), mirroring the `src/` layout (`test/actions/`, `test/api/`, `test/storage/`, `test/presentation/`, `test/utils/`).

## Commands

- Run the app (interactive menu CLI): `bun src/index.ts`
- Compile the executable (always outputs to `out/`): `bun run build` → `out/weather` (runs `bun test test` first — the build aborts if any test fails)
- Install deps: `bun install`; add packages: `bun add <pkg>`
- Typecheck: `bunx tsc --noEmit` (TypeScript 7 is a peerDependency, not a devDependency)
- Tests: `bun run test` (`bun test` over `test/`); never run tests against the real home — they sandbox via `HOME`/`XDG_CONFIG_HOME`.
- No lint tooling is configured — verify changes by running the app.
- Only `build`/`start`/`dev`/`test` scripts are defined; this is a Bun-only project (no node/npm invocations).

## TypeScript conventions (tsconfig.json)

- `verbatimModuleSyntax`: type-only imports must use `import type`.
- `allowImportingTsExtensions`: relative imports may include the `.ts` extension.
- `noEmit` + strict, incl. `noUncheckedIndexedAccess` (indexed access returns `T | undefined`).

## Project spec

- `README.md` (Spanish) is the spec: numbered menu (default city, all cities weather, list cities, search/add, delete, set default, 7-day forecast, settings °C/°F).
- Data flow is two-step OpenMeteo: geocoding API to resolve city → forecast API for weather. No API key required.
- Final deliverable is a compiled executable: `bun run build` (i.e. `bun build --compile src/index.ts --outfile out/weather`); `out/`, `dist/` are gitignored.
- User-facing strings and menu labels are in Spanish.
