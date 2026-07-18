import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { View } from "react-native";
import { Segment } from "heroui-native-pro";
import { withUniwind } from "uniwind";

export type SearchStatusFilter = "all" | "active" | "paused";

const StyledIonicons = withUniwind(Ionicons);

interface SearchStatusSegmentProps {
  value: SearchStatusFilter;
  onValueChange: (value: SearchStatusFilter) => void;
  allCount: number;
  activeCount: number;
  pausedCount: number;
}

export function SearchStatusSegment({
  value,
  onValueChange,
  allCount,
  activeCount,
  pausedCount,
}: SearchStatusSegmentProps): JSX.Element {
  return (
    <View className="bg-background px-3 pb-3 pt-1">
      <Segment
        value={value}
        size="md"
        className="w-full"
        onValueChange={(next) => onValueChange(next as SearchStatusFilter)}
      >
        <Segment.Group className="w-full">
          <Segment.Indicator />
          <Segment.Item
            value="all"
            className="min-h-10 flex-1 flex-row items-center justify-center gap-1.5"
          >
            {({ isSelected }) => (
              <>
                <StyledIonicons
                  name="layers-outline"
                  size={16}
                  className={
                    isSelected ? "text-segment-foreground" : "text-muted"
                  }
                />
                <Segment.Label>{`All (${allCount})`}</Segment.Label>
              </>
            )}
          </Segment.Item>
          <Segment.Separator betweenValues={["all", "active"]} />
          <Segment.Item
            value="active"
            className="min-h-10 flex-1 flex-row items-center justify-center gap-1.5"
          >
            {({ isSelected }) => (
              <>
                <StyledIonicons
                  name="play-circle-outline"
                  size={16}
                  className={
                    isSelected ? "text-segment-foreground" : "text-muted"
                  }
                />
                <Segment.Label>{`Active (${activeCount})`}</Segment.Label>
              </>
            )}
          </Segment.Item>
          <Segment.Separator betweenValues={["active", "paused"]} />
          <Segment.Item
            value="paused"
            className="min-h-10 flex-1 flex-row items-center justify-center gap-1.5"
          >
            {({ isSelected }) => (
              <>
                <StyledIonicons
                  name="pause-circle-outline"
                  size={16}
                  className={
                    isSelected ? "text-segment-foreground" : "text-muted"
                  }
                />
                <Segment.Label>{`Paused (${pausedCount})`}</Segment.Label>
              </>
            )}
          </Segment.Item>
        </Segment.Group>
      </Segment>
    </View>
  );
}
