/**
 * Title-case a person's name for display: "peter okonmah" / "PETER OKONMAH"
 * both become "Peter Okonmah". The API already returns names title-cased; this
 * is a client-side safety net for greetings and headers so the display is
 * correct even before the API change is deployed.
 */
export function titleCase(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split("-")
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
        .join("-"),
    )
    .join(" ");
}
