import type { JSX } from "react";
import { View } from "react-native";
import { Chip, Typography } from "heroui-native";
import { FAB } from "heroui-native-pro";

export type SoldStatusFilter = "all" | "sold" | "pending";

const DAYS_OPTIONS = [1, 2, 3] as const;

interface FeedSoldControlsProps {
  statusFilter: SoldStatusFilter;
  maxDays: number | null;
  onStatusChange: (status: SoldStatusFilter) => void;
  onDaysChange: (days: number | null) => void;
}

/** Sold / Pending + day range — same Chip/FAB language as Similar Nearby. */
export function FeedSoldControls({
  statusFilter,
  maxDays,
  onStatusChange,
  onDaysChange,
}: FeedSoldControlsProps): JSX.Element {
  const toggleStatus = (status: "sold" | "pending") => {
    onStatusChange(statusFilter === status ? "all" : status);
  };

  const daysLabel = maxDays != null ? `${maxDays} day` : "Days";

  return (
    <View className="flex-row items-center gap-1.5 px-3 pb-2 pt-1">
      <Chip
        size="sm"
        variant={statusFilter === "sold" ? "primary" : "secondary"}
        color={statusFilter === "sold" ? "accent" : "default"}
        onPress={() => toggleStatus("sold")}
        className="h-7 rounded-full px-2.5"
      >
        <Chip.Label className="text-xs font-medium">Sold</Chip.Label>
      </Chip>
      <Chip
        size="sm"
        variant={statusFilter === "pending" ? "primary" : "secondary"}
        color={statusFilter === "pending" ? "accent" : "default"}
        onPress={() => toggleStatus("pending")}
        className="h-7 rounded-full px-2.5"
      >
        <Chip.Label className="text-xs font-medium">Pending</Chip.Label>
      </Chip>

      <View className="flex-1" />

      <FAB placement="bottom" align="end">
        <FAB.Trigger
          accessibilityLabel={`Days range ${daysLabel}`}
          className="h-7 min-w-[68px] rounded-full px-2.5"
          animation={{ rotate: { value: [0, 0, 0] } }}
        >
          <Typography
            type="body-xs"
            weight="medium"
            numberOfLines={1}
            className="text-xs text-accent-foreground"
          >
            {daysLabel}
          </Typography>
        </FAB.Trigger>
        <FAB.Portal>
          <FAB.Overlay />
          <FAB.Content>
            {DAYS_OPTIONS.map((d) => (
              <FAB.Item
                key={d}
                onPress={() => onDaysChange(maxDays === d ? null : d)}
              >
                <FAB.ItemLabel className="text-xs font-medium">
                  {d} day
                </FAB.ItemLabel>
              </FAB.Item>
            ))}
          </FAB.Content>
        </FAB.Portal>
      </FAB>
    </View>
  );
}
