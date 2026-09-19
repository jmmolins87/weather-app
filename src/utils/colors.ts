import pc from "picocolors";

export function colorTemperature(text: string): string {
  return pc.yellow(text);
}

export function colorSuccess(text: string): string {
  return pc.green(text);
}

export function colorError(text: string): string {
  return pc.red(text);
}

export function colorTitle(text: string): string {
  return pc.bold(pc.cyan(text));
}
