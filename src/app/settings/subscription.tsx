import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { Linking, Platform, ScrollView, View } from "react-native";
import { Button, Surface, Typography, useToast } from "heroui-native";

export default function SubscriptionScreen(): JSX.Element {
  const { toast } = useToast();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pb-10">
      <LinearGradient
        colors={["#1DB954", "#169c46"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 16, padding: 20 }}
      >
        <Typography type="body-xs" weight="semibold" className="mb-2 uppercase text-white/70">
          Subscribe to Flipsentry
        </Typography>
        <Typography type="h4" weight="bold" className="text-white">
          {"Start Flipping Today,\nDon't Miss Deals"}
        </Typography>
      </LinearGradient>

      <Surface variant="secondary" className="gap-3 rounded-2xl p-4">
        <Typography type="body-sm" weight="semibold" className="text-foreground">
          Pro Weekly
        </Typography>
        <Typography type="h3" weight="bold" className="text-foreground">
          $9.99
          <Typography type="body-sm" className="text-muted">
            {" "}
            / week
          </Typography>
        </Typography>
        <Typography type="body-xs" className="text-muted">
          Instant deal alerts · Unlimited searches · Valuation scores
        </Typography>
        <Button
          variant="primary"
          className="rounded-xl"
          style={{ backgroundColor: "#1DB954" }}
          onPress={() =>
            toast.show({
              variant: "accent",
              label: "Subscribe Now",
              description: "Mock only — no IAP in this build.",
              duration: 2800,
            })
          }
        >
          <Button.Label style={{ color: "#04140A" }}>Subscribe Now</Button.Label>
        </Button>
      </Surface>

      <View className="flex-row gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          onPress={() =>
            toast.show({
              variant: "success",
              label: "Restore Purchases",
              description: "Mock only.",
              duration: 2200,
            })
          }
        >
          <Button.Label>Restore Purchases</Button.Label>
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onPress={() => {
            const url =
              Platform.OS === "ios"
                ? "https://apps.apple.com/account/subscriptions"
                : "https://play.google.com/store/account/subscriptions";
            void Linking.openURL(url);
          }}
        >
          <Button.Label>Manage</Button.Label>
        </Button>
      </View>
    </ScrollView>
  );
}
