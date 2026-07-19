import type { JSX } from "react";
import { Avatar } from "heroui-native";
import { Badge } from "heroui-native-pro";

import { isHunterOnline } from "@/features/community/community-presence-badge";
import type { CommunityHunter } from "@/mocks/data/community";

export function CommunityHunterAvatar({
  hunter,
  size = "md",
}: {
  hunter: CommunityHunter;
  size?: "sm" | "md" | "lg";
}): JSX.Element {
  const avatar = (
    <Avatar
      size={size}
      color="accent"
      variant="soft"
      alt={hunter.displayName}
      animation="disable-all"
    >
      <Avatar.Fallback animation="disabled">{hunter.initials}</Avatar.Fallback>
    </Avatar>
  );

  if (!isHunterOnline(hunter)) return avatar;

  return (
    <Badge.Anchor>
      {avatar}
      <Badge color="success" size="sm" placement="top-right" />
    </Badge.Anchor>
  );
}
