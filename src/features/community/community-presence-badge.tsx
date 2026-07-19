import type { JSX } from "react";
import { Badge } from "heroui-native-pro";

import type { CommunityHunter } from "@/mocks/data/community";

/** Same Active badge pattern as search cards (`Badge` success soft). */
export function isHunterOnline(hunter: CommunityHunter): boolean {
  return hunter.lastOnlineLabel === "Online now";
}

export function CommunityActiveBadge(): JSX.Element {
  return (
    <Badge color="success" variant="soft" size="sm">
      Active
    </Badge>
  );
}

/** Active when online; otherwise muted last-online label (caller renders text). */
export function CommunityPresenceBadge({
  hunter,
}: {
  hunter: CommunityHunter;
}): JSX.Element | null {
  if (!isHunterOnline(hunter)) return null;
  return <CommunityActiveBadge />;
}
