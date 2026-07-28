// Country name/alias -> ISO 3166-1 alpha-2 code.
// Used to restrict Google Places autocomplete to the selected country.
// Unknown names simply mean "no country restriction" (global suggestions).

const NAME_TO_CODE: Record<string, string> = {
  nigeria: "NG",
  ng: "NG",
  ghana: "GH",
  benin: "BJ",
  togo: "TG",
  "cote d'ivoire": "CI",
  "ivory coast": "CI",
  cameroon: "CM",
  senegal: "SN",
  kenya: "KE",
  "south africa": "ZA",
  egypt: "EG",
  morocco: "MA",
  ethiopia: "ET",
  tanzania: "TZ",
  uganda: "UG",
  rwanda: "RW",
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  us: "US",
  america: "US",
  canada: "CA",
  "united kingdom": "GB",
  uk: "GB",
  "great britain": "GB",
  england: "GB",
  ireland: "IE",
  france: "FR",
  germany: "DE",
  spain: "ES",
  portugal: "PT",
  italy: "IT",
  netherlands: "NL",
  belgium: "BE",
  switzerland: "CH",
  sweden: "SE",
  norway: "NO",
  denmark: "DK",
  finland: "FI",
  poland: "PL",
  turkey: "TR",
  "united arab emirates": "AE",
  uae: "AE",
  dubai: "AE",
  "saudi arabia": "SA",
  qatar: "QA",
  india: "IN",
  china: "CN",
  "hong kong": "HK",
  japan: "JP",
  "south korea": "KR",
  singapore: "SG",
  malaysia: "MY",
  indonesia: "ID",
  thailand: "TH",
  vietnam: "VN",
  philippines: "PH",
  australia: "AU",
  "new zealand": "NZ",
  brazil: "BR",
  mexico: "MX",
  argentina: "AR",
};

export function countryCode(name: string | null | undefined): string | null {
  if (!name) {
    return null;
  }

  const key = name.trim().toLowerCase();

  if (key === "") {
    return null;
  }

  // Allow passing an ISO code straight through (e.g. "NG").
  if (/^[a-z]{2}$/.test(key)) {
    return key.toUpperCase();
  }

  return NAME_TO_CODE[key] ?? null;
}
