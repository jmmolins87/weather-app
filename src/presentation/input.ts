import * as p from "@clack/prompts";
import type { Option } from "@clack/prompts";
import { cityLabel } from "../utils/format.ts";
import type { City } from "../types/City.ts";

export async function selectOption<T>(
  message: string,
  options: Option<T>[],
): Promise<T | undefined> {
  const picked = await p.select({ message, options });
  if (p.isCancel(picked)) {
    return undefined;
  }
  return picked;
}

export async function selectCity(
  message: string,
  cities: City[],
  hint?: (city: City) => string | undefined,
): Promise<City | undefined> {
  return selectOption(message, cities.map((city) => ({
    value: city,
    label: cityLabel(city),
    hint: hint?.(city),
  })));
}

export async function promptText(
  message: string,
  placeholder: string,
  emptyError: string,
): Promise<string | undefined> {
  const value = await p.text({
    message,
    placeholder,
    validate(input) {
      if (input === undefined || input.trim() === "") {
        return emptyError;
      }
    },
  });
  if (p.isCancel(value)) {
    return undefined;
  }
  return value.trim();
}
