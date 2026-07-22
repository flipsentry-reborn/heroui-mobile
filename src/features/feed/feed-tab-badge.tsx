import type { JSX } from "react";
import { View } from "react-native";

/** Small red unread indicator for feed category tabs / shelf headers. */
export function FeedTabBadge({
  count,
}: {
  count: number;
}): JSX.Element | null {
  if (count <= 0) return null;
  return (
    <View
      accessibilityLabel={`${count} new listings`}
      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger"
    />
  );
}
