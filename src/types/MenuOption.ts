import type { AppState } from "./AppState.ts";

export interface MenuOption {
  value: string;
  label: (state: AppState) => string;
  hint?: (state: AppState) => string | undefined;
  run?: (state: AppState) => Promise<void>;
}
