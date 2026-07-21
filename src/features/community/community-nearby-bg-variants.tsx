import type { JSX, ReactNode } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";

import { CommunityHuntersRail } from "@/features/community/community-hunters-rail";
import { CommunitySectionHeader } from "@/features/community/community-section-header";
import type { CommunityHunter } from "@/mocks/data/community";

export type NearbyBgVariantId = "band" | "borders" | "inset" | "header-band";

export const NEARBY_BG_VARIANTS: {
  id: NearbyBgVariantId;
  label: string;
  hint: string;
}[] = [
  {
    id: "band",
    label: "1 · Soft band",
    hint: "Title outside · rail only bg-surface-secondary",
  },
  {
    id: "borders",
    label: "2 · Hairline rules",
    hint: "Title outside · rail border-y, no fill",
  },
  {
    id: "inset",
    label: "3 · Inset surface",
    hint: "Title + rail inside rounded bg-surface panel",
  },
  {
    id: "header-band",
    label: "4 · Header + rail band",
    hint: "Title and rail share one bg-surface-secondary",
  },
];

function RailShell({
  variant,
  children,
}: {
  variant: NearbyBgVariantId;
  children: ReactNode;
}): JSX.Element {
  switch (variant) {
    case "band":
      return <View className="bg-surface-secondary py-4">{children}</View>;
    case "borders":
      return (
        <View className="border-y border-muted/20 py-4">{children}</View>
      );
    default:
      return <>{children}</>;
  }
}

export function CommunityNearbyBgVariant({
  variant,
  hunters,
  onPressHunter,
  showLabel = false,
}: {
  variant: NearbyBgVariantId;
  hunters: CommunityHunter[];
  onPressHunter: (hunterId: string) => void;
  showLabel?: boolean;
}): JSX.Element {
  const meta = NEARBY_BG_VARIANTS.find((v) => v.id === variant);
  const rail = (
    <CommunityHuntersRail hunters={hunters} onPressHunter={onPressHunter} />
  );

  return (
    <View className="gap-2">
      {showLabel && meta ? (
        <View className="gap-0.5 px-4">
          <Typography type="body-sm" weight="semibold">
            {meta.label}
          </Typography>
          <Typography type="body-xs" color="muted">
            {meta.hint}
          </Typography>
        </View>
      ) : null}

      {variant === "header-band" ? (
        <View className="bg-surface-secondary py-4">
          <CommunitySectionHeader title="Rivals nearby" />
          {rail}
        </View>
      ) : null}

      {variant === "inset" ? (
        <View className="mx-3 rounded-2xl bg-surface px-1 py-3">
          <View className="mb-3 gap-0.5 px-3">
            <Typography type="h3" weight="bold">
              Rivals nearby
            </Typography>
          </View>
          {rail}
        </View>
      ) : null}

      {variant === "band" || variant === "borders" ? (
        <View>
          <CommunitySectionHeader title="Rivals nearby" />
          <RailShell variant={variant}>{rail}</RailShell>
        </View>
      ) : null}
    </View>
  );
}
