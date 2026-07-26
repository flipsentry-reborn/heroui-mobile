import type { Href } from "expo-router";

import { needsOnboarding } from "@/features/onboarding/onboarding-storage";
import type SearchStore from "@/store/searchStore";

/** Resolve destination after phone-verified auth. */
export async function resolvePostAuthHref(
  searchStore: SearchStore,
): Promise<Href> {
  if (!searchStore.hasLoaded) {
    await searchStore.loadSearchGroups();
  }
  const show = await needsOnboarding(searchStore.searchGroups.length);
  return (show ? "/(onboarding)/what" : "/feed") as Href;
}
