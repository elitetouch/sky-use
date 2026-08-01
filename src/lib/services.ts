// The SkyFots service levels offered across the app, in display order.
// Values must match the ServiceLevel enum on the API.
export const SERVICE_OPTIONS = [
  { value: "air_cargo", label: "SkyFots Air Cargo" },
  { value: "saver", label: "SkyFots Saver" },
  { value: "express_saver", label: "SkyFots Express Saver" },
  { value: "express", label: "SkyFots Express" },
  { value: "sea_cargo", label: "SkyFots Sea Cargo" },
] as const;

export const DEFAULT_SERVICE = SERVICE_OPTIONS[0].value;
