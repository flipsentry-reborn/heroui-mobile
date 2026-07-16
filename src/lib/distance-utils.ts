/**
 * Distance unit conversion & formatting utilities.
 * Ported from mobile-app — backend stores distances/odometer in miles.
 */

import type { DistanceUnit } from "@/mocks/data/settings";

export type { DistanceUnit };

const MI_TO_KM = 1.60934;
const KM_TO_MI = 1 / MI_TO_KM;

/** Convert miles to the display unit value. */
export function milesToDisplay(miles: number, unit: DistanceUnit): number {
  return unit === "km" ? miles * MI_TO_KM : miles;
}

/** Convert a value in the display unit back to miles for the API. */
export function displayToMiles(value: number, unit: DistanceUnit): number {
  return unit === "km" ? value * KM_TO_MI : value;
}

/**
 * Format a distance value for display.
 * e.g. formatDistance(24.6, "mi") → "25 mi"
 *      formatDistance(24.6, "km", 1) → "39.6 km"
 */
export function formatDistance(
  miles: number,
  unit: DistanceUnit,
  decimals: number = 0,
): string {
  const value = milesToDisplay(miles, unit);
  const label = unit === "km" ? "km" : "mi";
  return `${value.toFixed(decimals)} ${label}`;
}

/** Vehicle odometer readings are stored in miles — convert for display. */
export function getOdometerDisplayValue(
  milesInMiles: number,
  unit: DistanceUnit,
): number {
  return Math.round(milesToDisplay(milesInMiles, unit));
}

/** Full odometer label e.g. "50,000 km" */
export function formatOdometer(
  milesInMiles: number,
  unit: DistanceUnit,
): string {
  return `${getOdometerDisplayValue(milesInMiles, unit).toLocaleString()} ${unit}`;
}

/** Compact odometer label e.g. "50k km" */
export function formatOdometerCompact(
  milesInMiles: number,
  unit: DistanceUnit,
): string {
  const value = getOdometerDisplayValue(milesInMiles, unit);
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k ${unit}`;
  }
  return `${value.toLocaleString()} ${unit}`;
}
