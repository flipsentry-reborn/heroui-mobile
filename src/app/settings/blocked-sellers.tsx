import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import { EmptyState } from "heroui-native-pro";
import { ScrollShadow, Typography, useThemeColor } from "heroui-native";

export default function BlockedSellersScreen(): JSX.Element {
  const background = useThemeColor("background");

  return (
    <View className="flex-1 bg-background">
      <ScrollShadow
        className="flex-1"
        LinearGradientComponent={LinearGradient}
        color={background}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-4 pb-10 pt-6"
          showsVerticalScrollIndicator={false}
        >
          <EmptyState>
            <EmptyState.Title>No blocked sellers</EmptyState.Title>
            <EmptyState.Description>
              When you block a seller from the feed, they&apos;ll appear here.
            </EmptyState.Description>
          </EmptyState>
          <Typography type="body-xs" className="mt-4 text-center text-muted">
            0 sellers blocked
          </Typography>
        </ScrollView>
      </ScrollShadow>
    </View>
  );
}
