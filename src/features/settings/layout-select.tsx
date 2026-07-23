import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { Segment } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import {
  isFeedLayoutMode,
  type FeedLayoutMode,
} from "@/features/feed/layout-mode";

const StyledIonicons = withUniwind(Ionicons);

interface LayoutSelectProps {
  value: FeedLayoutMode;
  onChange: (mode: FeedLayoutMode) => void;
}

/** Compact List / Grid segment for Settings. */
export function LayoutSelect({ value, onChange }: LayoutSelectProps): JSX.Element {
  return (
    <Segment
      value={value}
      onValueChange={(next) => {
        if (isFeedLayoutMode(next)) onChange(next);
      }}
      size="sm"
    >
      <Segment.Group className="rounded-2xl">
        <Segment.Indicator className="rounded-xl" />
        <Segment.Item
          value="list"
          accessibilityLabel="List view"
          className="rounded-xl px-2.5"
        >
          <StyledIonicons
            name="list-outline"
            size={16}
            className="text-foreground"
          />
        </Segment.Item>
        <Segment.Item
          value="grid"
          accessibilityLabel="Grid view"
          className="rounded-xl px-2.5"
        >
          <StyledIonicons
            name="grid-outline"
            size={16}
            className="text-foreground"
          />
        </Segment.Item>
      </Segment.Group>
    </Segment>
  );
}
