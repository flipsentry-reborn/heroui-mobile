import type { JSX } from "react";
import { View } from "react-native";
import { Avatar, PressableFeedback, Typography } from "heroui-native";

import { CommunityHunterAvatar } from "@/features/community/community-hunter-avatar";
import type { CommunityClicker } from "@/mocks/services/community";

const MAX_DISKS = 10;
/** Static z classes — Uniwind needs full class names in source. */
const Z_CLASSES = [
  "z-10",
  "z-9",
  "z-8",
  "z-7",
  "z-6",
  "z-5",
  "z-4",
  "z-3",
  "z-2",
  "z-1",
] as const;

interface CommunityClickersStackProps {
  total: number;
  clickers: CommunityClicker[];
  onPressHunter: (id: string) => void;
}

export function CommunityClickersStack({
  total,
  clickers,
  onPressHunter,
}: CommunityClickersStackProps): JSX.Element {
  const visible = clickers.filter((c) => c.visible);
  const showOverflow = total > MAX_DISKS;
  const avatarSlots = showOverflow ? MAX_DISKS - 1 : Math.min(total, MAX_DISKS);
  const overflowCount = showOverflow ? total - (MAX_DISKS - 1) : 0;

  const disks: (
    | { kind: "hunter"; clicker: CommunityClicker }
    | { kind: "anon"; key: string }
  )[] = [];

  for (let i = 0; i < avatarSlots; i += 1) {
    const entry = visible[i];
    if (entry) {
      disks.push({ kind: "hunter", clicker: entry });
    } else {
      disks.push({ kind: "anon", key: `anon-${i}` });
    }
  }

  if (total === 0) {
    return (
      <Typography type="body-xs" className="text-muted">
        No clicks yet
      </Typography>
    );
  }

  return (
    <View className="flex-row items-center">
      {disks.map((disk, index) => (
        <View
          key={disk.kind === "hunter" ? disk.clicker.hunter.id : disk.key}
          className={`rounded-full border-2 border-background ${
            Z_CLASSES[index] ?? "z-0"
          } ${index === 0 ? "" : "-ml-2.5"}`}
        >
          {disk.kind === "hunter" ? (
            <PressableFeedback
              onPress={() => onPressHunter(disk.clicker.hunter.id)}
              accessibilityLabel={disk.clicker.hunter.displayName}
              animation={{ scale: { value: 0.94 } }}
            >
              <CommunityHunterAvatar hunter={disk.clicker.hunter} size="sm" />
            </PressableFeedback>
          ) : (
            <Avatar size="sm" color="default" variant="soft" alt="Hunter">
              <Avatar.Fallback />
            </Avatar>
          )}
        </View>
      ))}
      {overflowCount > 0 ? (
        <View className="z-0 -ml-2.5 h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-surface-secondary">
          <Typography type="body-xs" className="text-[10px] text-muted">
            +{overflowCount}
          </Typography>
        </View>
      ) : null}
    </View>
  );
}
