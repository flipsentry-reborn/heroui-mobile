import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import { EmptyState } from "heroui-native-pro";
import { ScrollShadow, useThemeColor } from "heroui-native";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

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
          contentContainerClassName="flex-grow items-center justify-center px-6 pb-10 pt-6"
          showsVerticalScrollIndicator={false}
        >
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <StyledIonicons name="ban-outline" size={20} className="text-muted" />
              </EmptyState.Media>
              <EmptyState.Title>No blocked sellers</EmptyState.Title>
              <EmptyState.Description>
                When you block a seller from the feed, they will appear here.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        </ScrollView>
      </ScrollShadow>
    </View>
  );
}
