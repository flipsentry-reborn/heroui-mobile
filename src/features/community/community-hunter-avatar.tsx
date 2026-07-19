import type { JSX } from "react";
import { Avatar } from "heroui-native";

import type { CommunityHunter } from "@/mocks/data/community";

export function CommunityHunterAvatar({
  hunter,
  size = "md",
}: {
  hunter: CommunityHunter;
  size?: "sm" | "md" | "lg";
}): JSX.Element {
  return (
    <Avatar size={size} color="accent" variant="soft" alt={hunter.displayName}>
      <Avatar.Fallback>{hunter.initials}</Avatar.Fallback>
    </Avatar>
  );
}
