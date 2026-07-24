export const DEFAULT_YOUR_SEARCHES_EXPANDED = false;

export const YOUR_SEARCHES_EXPANDED_STORAGE_KEY = "yourSearchesExpanded";

export function parseYourSearchesExpanded(
  value: string | null,
): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}
