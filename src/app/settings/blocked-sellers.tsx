import type { JSX } from "react";
import { View } from "react-native";
import { EmptyState } from "heroui-native-pro";
import { Typography } from "heroui-native";

export default function BlockedSellersScreen(): JSX.Element {
  return (
    <View className="flex-1 bg-background px-4 pt-6">
      <EmptyState>
        <EmptyState.Title>No blocked sellers</EmptyState.Title>
        <EmptyState.Description>
          When you block a seller from the feed, they&apos;ll appear here.
        </EmptyState.Description>
      </EmptyState>
      <Typography type="body-xs" className="mt-4 text-center text-muted">
        0 sellers blocked
      </Typography>
    </View>
  );
}
