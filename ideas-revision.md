# Revisión Weather CLI

- [x] **Colores:** no hay ninguno; falta definir cyan (menú), amarillo (temp), verde/rojo (ok/error).
- [x] **AGENTS.md:** dice que `index.ts` es stub, pero la app ya funciona — hay que actualizarlo.
- [x] **Ciudades:** geocoding solo trae 1 resultado; nombres ambiguos pueden fallar.
- [x] **Tests:** `bun test` con `tests/storage.test.ts` (roundtrip, JSON corrupto, migración del legado, respeto de `XDG_CONFIG_HOME`), `tests/geocoding.test.ts` y `tests/forecast.test.ts` (mocks de `fetch`); script `test` en `package.json`.
- [x] **Binario:** estado en `~/.config/weather-cli/state.json` (respeta `XDG_CONFIG_HOME`); el legado `~/.weather-cli.json` se migra solo en la primera carga. Verificado con el binario compilado y `HOME` aislado.
- [x] **Escalabilidad:** menú convertido en registro `COMMANDS` (`src/menu.ts`) con numeración automática; nueva funcionalidad = una entrada `{ value, label, hint?, run? }`.
- [x] **Carga:** ya estaba cubierto — las 4 operaciones async (clima, todas, búsqueda, pronóstico) usan `p.spinner()`; sin cambios.
- [x] **7 days forecast:** agregar la posibilidad de obtener el pronósitco del clima para los próximos 7 días.