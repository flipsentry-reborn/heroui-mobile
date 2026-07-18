import type { IntervalOption } from "@/domain/search-rules";

export interface LocationErrorHelp {
  /** Short headline shown in the guide card (usually the error itself). */
  headline: string;
  /** Why it happened and what to try next. */
  body: string;
  /** Optional remaining-capacity summary. */
  capacityLine?: string;
}

function formatRemainingCapacity(
  intervalOptions: IntervalOption[] | undefined,
): string | undefined {
  if (intervalOptions == null || intervalOptions.length === 0) return undefined;
  const parts = intervalOptions.map(
    (option) => `${option.remaining}× ${option.label}`,
  );
  return `Remaining on your plan: ${parts.join(", ")}.`;
}

/**
 * Maps a location validation / assign reason to guide copy for the info dialog.
 */
export function getLocationErrorHelp(
  reason: string,
  intervalOptions?: IntervalOption[],
): LocationErrorHelp {
  const capacityLine = formatRemainingCapacity(intervalOptions);

  if (/^Not enough remaining .+ slots\.?$/i.test(reason)) {
    return {
      headline: reason.replace(/\.$/, ""),
      body:
        "Each selected platform uses one slot per location at that run speed. Facebook can cover several nearby areas (each costs a slot); OfferUp, Craigslist, and Kijiji use only one location.\n\nThis draft needs more slots at that speed than you have left. Try a slower speed, fewer locations or platforms, or free slots from other searches.",
      capacityLine,
    };
  }

  if (/no slots available/i.test(reason)) {
    return {
      headline: reason.replace(/\.$/, ""),
      body:
        "Every speed on your plan is fully used. Free a slot from another search, switch an existing location to a slower speed, or remove a platform/location from this draft.",
      capacityLine,
    };
  }

  if (/not available on your plan/i.test(reason)) {
    return {
      headline: reason.replace(/\.$/, ""),
      body:
        "Your current plan only includes certain run speeds. Pick a speed listed for your tier, or upgrade to unlock faster intervals.",
      capacityLine,
    };
  }

  if (/select at least one platform/i.test(reason)) {
    return {
      headline: "Select at least one platform",
      body:
        "Locations and run speeds only apply after you enable a marketplace. Choose Facebook, OfferUp, Craigslist, or Kijiji first.",
    };
  }

  if (/select at least one location/i.test(reason)) {
    return {
      headline: "Select at least one location",
      body:
        "Set a run speed on your main location or a nearby area. Speed “None” means that place is not included in the search.",
    };
  }

  if (/supports one location only/i.test(reason)) {
    return {
      headline: reason.replace(/\.$/, ""),
      body:
        "Non-Facebook platforms can only run in one place. Keep a single location selected, or enable Facebook to watch multiple nearby areas.",
    };
  }

  if (/finish platforms/i.test(reason)) {
    return {
      headline: "Almost ready to save",
      body:
        "Enable at least one platform and set a run speed on at least one location before saving.",
    };
  }

  return {
    headline: reason.replace(/\.$/, ""),
    body:
      "Something in this location draft conflicts with your plan’s slot limits or platform rules. Adjust platforms, locations, or speeds and try again.",
    capacityLine,
  };
}
