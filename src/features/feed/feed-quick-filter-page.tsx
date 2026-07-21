import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { View } from "react-native";
import { Button } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

/** Quick Filter page (opened from feed header top-right). */
export function FeedQuickFilterPage(): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <EmptyState>
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <StyledIonicons
              name="options-outline"
              size={20}
              className="text-muted"
            />
          </EmptyState.Media>
          <EmptyState.Title>Quick Filter</EmptyState.Title>
          <EmptyState.Description>
            Save custom filters and jump to them from here. This is a mock
            placeholder for now.
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button variant="secondary" isDisabled>
            <Button.Label>Coming soon</Button.Label>
          </Button>
        </EmptyState.Content>
      </EmptyState>
    </View>
  );
}
