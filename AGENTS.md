# AGENTS.md

Bun + TypeScript weather CLI (course project). The whole app lives in `index.ts` (repo root).

## Commands

- Run the app (interactive menu CLI): `bun index.ts`
- Install deps: `bun install`; add packages: `bun add <pkg>`
- Typecheck: `bunx tsc --noEmit` (TypeScript 7 is a peerDependency, not a devDependency)
- No test or lint tooling is configured — verify changes by running the app.
- No npm scripts are defined; this is a Bun-only project (no node/npm invocations).

## TypeScript conventions (tsconfig.json)

- `verbatimModuleSyntax`: type-only imports must use `import type`.
- `allowImportingTsExtensions`: relative imports may include the `.ts` extension.
- `noEmit` + strict, incl. `noUncheckedIndexedAccess` (indexed access returns `T | undefined`).

## Project spec

- `README.md` (Spanish) is the spec: numbered menu (default city, saved cities, search/add, delete, set default, settings °C).
- Data flow is two-step OpenMeteo: geocoding API to resolve city → forecast API for weather. No API key required.
- Final deliverable is a compiled executable: `bun build --compile index.ts --outfile <name>` (`out/`, `dist/` are gitignored).
- User-facing strings and menu labels are in Spanish.
