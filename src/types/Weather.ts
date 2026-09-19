export type TemperatureUnit = "celsius" | "fahrenheit";

export interface CurrentWeather {
  temperature: number;
  unit: string;
}

export interface DailyForecast {
  date: string;
  max: number;
  min: number;
  unit: string;
}
