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
        size="lg"
        className="w-full"
        onValueChange={(next) => onValueChange(next as SearchStatusFilter)}
      >
        <Segment.Group className="w-full gap-1">
          <Segment.Indicator />
          <Segment.Item
            value="all"
            className="min-h-11 flex-1 flex-row items-center justify-center gap-2"
          >
            {({ isSelected }) => (
              <>
                <StyledIonicons
                  name="layers-outline"
                  size={18}
                  className={
                    isSelected ? "text-segment-foreground" : "text-muted"
                  }
                />
                <Segment.Label className="text-[16.5px]">{`All (${allCount})`}</Segment.Label>
              </>
            )}
          </Segment.Item>
          <Segment.Separator betweenValues={["all", "active"]} />
          <Segment.Item
            value="active"
            className="min-h-11 flex-1 flex-row items-center justify-center gap-2"
          >
            {({ isSelected }) => (
              <>
                <StyledIonicons
                  name="play-circle-outline"
                  size={18}
                  className={
                    isSelected ? "text-segment-foreground" : "text-muted"
                  }
                />
                <Segment.Label className="text-[16.5px]">{`Active (${activeCount})`}</Segment.Label>
              </>
            )}
          </Segment.Item>
          <Segment.Separator betweenValues={["active", "paused"]} />
          <Segment.Item
            value="paused"
            className="min-h-11 flex-1 flex-row items-center justify-center gap-2"
          >
            {({ isSelected }) => (
              <>
                <StyledIonicons
                  name="pause-circle-outline"
                  size={18}
                  className={
                    isSelected ? "text-segment-foreground" : "text-muted"
                  }
                />
                <Segment.Label className="text-[16.5px]">{`Paused (${pausedCount})`}</Segment.Label>
              </>
            )}
          </Segment.Item>
        </Segment.Group>
      </Segment>
    </View>
  );
}
