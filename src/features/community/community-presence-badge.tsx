import type { JSX } from "react";
import { Badge } from "heroui-native-pro";

import type { CommunityHunter } from "@/mocks/data/community";

export function isHunterOnline(hunter: CommunityHunter): boolean {
  return hunter.lastOnlineLabel === "Online now";
}

/** Green status bubble only — no “Active” label (soft text was hard to see). */
export function CommunityOnlineDot({
  size = "sm",
}: {
  size?: "sm" | "md" | "lg";
}): JSX.Element {
  return <Badge color="success" size={size} />;
}

/** @deprecated Use CommunityOnlineDot — kept for older imports. */
export function CommunityActiveBadge(): JSX.Element {
  return <CommunityOnlineDot />;
}

export function CommunityPresenceBadge({
  hunter,
}: {
  hunter: CommunityHunter;
}): JSX.Element | null {
  if (!isHunterOnline(hunter)) return null;
  return <CommunityOnlineDot />;
}
