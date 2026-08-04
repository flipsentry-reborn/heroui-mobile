import type { JSX } from "react";
import { View } from "react-native";
import { Chip, Typography } from "heroui-native";
import { FAB } from "heroui-native-pro";

export type BestPicksSortBy = "buysignal" | "distance" | "listed";

const HOURS_OPTIONS = [1, 3, 6] as const;

const SORT_OPTIONS: { key: BestPicksSortBy; label: string }[] = [
  { key: "buysignal", label: "Score" },
  { key: "distance", label: "Distance" },
  { key: "listed", label: "Listed" },
];

function formatHoursLabel(hours: number): string {
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

interface FeedBestPicksControlsProps {
  sortBy: BestPicksSortBy;
  maxHours: number | null;
  onSortChange: (sortBy: BestPicksSortBy) => void;
  onHoursChange: (hours: number | null) => void;
}

/** Score / Distance / Listed + hours range — same Chip/FAB language as Sold. */
export function FeedBestPicksControls({
  sortBy,
  maxHours,
  onSortChange,
  onHoursChange,
}: FeedBestPicksControlsProps): JSX.Element {
  // Unset → "Hours"; otherwise "1 hour" / "3 hours" / "6 hours".
  const hoursLabel =
    maxHours != null ? formatHoursLabel(maxHours) : "Hours";

  return (
    <View className="flex-row items-center gap-1.5 px-3 pb-2 pt-1">
      {SORT_OPTIONS.map((option) => {
        const active = sortBy === option.key;
        return (
          <Chip
            key={option.key}
            size="sm"
            variant={active ? "primary" : "secondary"}
            color={active ? "accent" : "default"}
            onPress={() => {
              if (!active) onSortChange(option.key);
            }}
            className="h-7 rounded-full px-2.5"
          >
            <Chip.Label className="text-xs font-medium">{option.label}</Chip.Label>
          </Chip>
        );
      })}

      <View className="flex-1" />

      <FAB placement="bottom" align="end">
        <FAB.Trigger
          accessibilityLabel={`Hours range ${hoursLabel}`}
          className="h-7 min-w-[72px] rounded-full px-2.5"
          animation={{ rotate: { value: [0, 0, 0] } }}
        >
          <Typography
            type="body-xs"
            weight="medium"
            numberOfLines={1}
            className="text-xs text-accent-foreground"
          >
            {hoursLabel}
          </Typography>
        </FAB.Trigger>
        <FAB.Portal>
          <FAB.Overlay />
          <FAB.Content>
            {HOURS_OPTIONS.map((h) => (
              <FAB.Item
                key={h}
                onPress={() => onHoursChange(maxHours === h ? null : h)}
              >
                <FAB.ItemLabel className="text-xs font-medium">
                  {formatHoursLabel(h)}
                </FAB.ItemLabel>
              </FAB.Item>
            ))}
          </FAB.Content>
        </FAB.Portal>
      </FAB>
    </View>
  );
}
