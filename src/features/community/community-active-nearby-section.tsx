import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { View } from "react-native";
import { Typography, useThemeColor } from "heroui-native";
import { withUniwind } from "uniwind";

import { CommunityHuntersRail } from "@/features/community/community-hunters-rail";
import type { CommunityHunter } from "@/mocks/data/community";

const StyledLinearGradient = withUniwind(LinearGradient);

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith("oklch(")) {
    const inner = color.slice(5, -1).trim();
    if (inner.includes("/")) {
      return `oklch(${inner.replace(/\/\s*[\d.]+%?/, `/ ${alpha}`)})`;
    }
    return `oklch(${inner} / ${alpha})`;
  }
  if (color.startsWith("rgba(")) return color;
  const hex = color.replace("#", "");
  if (hex.length !== 6) return color;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface CommunityActiveNearbySectionProps {
  hunters: CommunityHunter[];
  onPressHunter: (hunterId: string) => void;
}

/**
 * Inset shelf with left→right fade: stronger surface on the left, dissolves right.
 */
export function CommunityActiveNearbySection({
  hunters,
  onPressHunter,
}: CommunityActiveNearbySectionProps): JSX.Element {
  const [surface, surfaceSecondary] = useThemeColor([
    "surface",
    "surface-secondary",
  ]);

  return (
    <View className="mx-3 overflow-hidden rounded-2xl">
      <StyledLinearGradient
        colors={[
          withAlpha(surfaceSecondary, 0.95),
          withAlpha(surface, 0.55),
          withAlpha(surface, 0.12),
          withAlpha(surface, 0),
        ]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        className="absolute inset-0"
        pointerEvents="none"
      />
      <View className="px-1 py-3">
        <View className="mb-3 gap-0.5 px-3">
          <Typography type="h3" weight="bold">
            Active nearby
          </Typography>
        </View>
        <CommunityHuntersRail
          hunters={hunters}
          onPressHunter={onPressHunter}
        />
      </View>
    </View>
  );
}
