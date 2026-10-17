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

export type ServiceOption = { value: string; label: string };

type ApiService = {
  key: string;
  name: string;
  admin_name?: string | null;
  is_active: boolean;
};

/**
 * Admin service options in display order, labelled with the internal name so
 * staff can tell e.g. "SkyFots Express (DHL)" apart. Active only. Falls back to
 * the static list if the services API is unavailable.
 */
export async function fetchAdminServiceOptions(): Promise<ServiceOption[]> {
  try {
    const res = await fetch("/api/admin/services");
    const json = await res.json();
    const list: ApiService[] = Array.isArray(json.data) ? json.data : [];
    const options = list
      .filter((s) => s.is_active)
      .map((s) => ({ value: s.key, label: (s.admin_name && s.admin_name.trim()) || s.name }));
    return options.length ? options : [...SERVICE_OPTIONS];
  } catch {
    return [...SERVICE_OPTIONS];
  }
}
