import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import type { JSX } from "react";
import { useCallback, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { EmptyState } from "heroui-native-pro";
import {
  Button,
  ScrollShadow,
  Spinner,
  Typography,
  useThemeColor,
} from "heroui-native";
import { withUniwind } from "uniwind";

import agent from "@/api/agent";
import type { BlockedSeller } from "@/api/http/catalogs";

const StyledIonicons = withUniwind(Ionicons);

export default function BlockedSellersScreen(): JSX.Element {
  const background = useThemeColor("background");
  const [items, setItems] = useState<BlockedSeller[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await agent.BlockedSellers.list();
      setItems(result.data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onUnblock = (seller: BlockedSeller) => {
    Alert.alert("Unblock seller", `Unblock ${seller.sellerName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unblock",
        style: "destructive",
        onPress: () => {
          void agent.BlockedSellers.unblock(seller.id).then(() => load());
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollShadow
        className="flex-1"
        LinearGradientComponent={LinearGradient}
        color={background}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName={
            items.length === 0
              ? "flex-grow items-center justify-center px-6 pb-10 pt-6"
              : "gap-2 px-4 pb-10 pt-4"
          }
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Spinner size="lg" />
          ) : items.length === 0 ? (
            <EmptyState>
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <StyledIonicons
                    name="ban-outline"
                    size={20}
                    className="text-muted"
                  />
                </EmptyState.Media>
                <EmptyState.Title>No blocked sellers</EmptyState.Title>
                <EmptyState.Description>
                  When you block a seller from the feed, they will appear here.
                </EmptyState.Description>
              </EmptyState.Header>
            </EmptyState>
          ) : (
            items.map((seller) => (
              <View
                key={seller.id}
                className="flex-row items-center gap-3 rounded-2xl bg-surface px-3 py-3"
              >
                <View className="flex-1 gap-0.5">
                  <Typography className="text-foreground text-sm font-medium">
                    {seller.sellerName || "Unknown seller"}
                  </Typography>
                  <Typography className="text-muted text-xs">
                    {seller.source}
                  </Typography>
                </View>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => onUnblock(seller)}
                >
                  <Button.Label>Unblock</Button.Label>
                </Button>
              </View>
            ))
          )}
        </ScrollView>
      </ScrollShadow>
    </View>
  );
}
