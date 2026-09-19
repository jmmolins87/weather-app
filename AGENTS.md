# AGENTS.md

Bun + TypeScript weather CLI (course project). Entry point is `index.ts` (repo root), which just calls `main()` from `src/menu.ts`; the app is fully functional. Modules under `src/`: `types.ts` (shared types), `geocoding.ts` (OpenMeteo geocoding), `forecast.ts` (OpenMeteo current weather + 7-day forecast), `storage.ts` (persistent state in `~/.config/weather-cli/state.json`, honoring `XDG_CONFIG_HOME`; migrates legacy `~/.weather-cli.json` on first load), `menu.ts` (interactive menu loop, `@clack/prompts`, colors via `picocolors`; menu entries are a `COMMANDS` registry — adding a feature = adding one entry). Tests live in `tests/` (`bun:test`, mocked `fetch`, isolated `HOME`/`XDG_CONFIG_HOME` sandbox per test).

## Commands

- Run the app (interactive menu CLI): `bun index.ts`
- Compile the executable (always outputs to `out/`): `bun run build` → `out/weather`
- Install deps: `bun install`; add packages: `bun add <pkg>`
- Typecheck: `bunx tsc --noEmit` (TypeScript 7 is a peerDependency, not a devDependency)
- Tests: `bun run test` (`bun test` over `tests/`); never run tests against the real home — they sandbox via `HOME`/`XDG_CONFIG_HOME`.
- No lint tooling is configured — verify changes by running the app.
- Only `build`/`start`/`dev`/`test` scripts are defined; this is a Bun-only project (no node/npm invocations).

## TypeScript conventions (tsconfig.json)

- `verbatimModuleSyntax`: type-only imports must use `import type`.
- `allowImportingTsExtensions`: relative imports may include the `.ts` extension.
- `noEmit` + strict, incl. `noUncheckedIndexedAccess` (indexed access returns `T | undefined`).

## Project spec

- `README.md` (Spanish) is the spec: numbered menu (default city, saved cities, search/add, delete, set default, 7-day forecast, settings °C/°F).
- Data flow is two-step OpenMeteo: geocoding API to resolve city → forecast API for weather. No API key required.
- Final deliverable is a compiled executable: `bun run build` (i.e. `bun build --compile index.ts --outfile out/weather`); `out/`, `dist/` are gitignored.
- User-facing strings and menu labels are in Spanish.
