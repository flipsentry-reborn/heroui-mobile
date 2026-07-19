import type { Href } from "expo-router";

export function communityItemHref(id: string): Href {
  return {
    pathname: "/community/item/[id]",
    params: { id },
  } as unknown as Href;
}

export function communityHunterHref(id: string): Href {
  return {
    pathname: "/community/hunter/[id]",
    params: { id },
  } as unknown as Href;
}
