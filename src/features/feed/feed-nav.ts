import type { Href } from "expo-router";

/** Dynamic category page for any system or user search key. */
export function feedCategoryHref(category: string): Href {
  return {
    pathname: "/feed/c/[category]",
    params: { category },
  };
}
