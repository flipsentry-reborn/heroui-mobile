import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PressableFeedback, Typography } from "heroui-native";
import { withUniwind } from "uniwind";

import {
  communityHunterHref,
  communityItemHref,
} from "@/features/community/community-nav";
import { CommunityProfilePage } from "@/features/community/community-profile-page";

const StyledIonicons = withUniwind(Ionicons);
const StyledSafeAreaView = withUniwind(SafeAreaView);

export default function CommunityHunterRoute(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const hunterId = String(id ?? "");

  return (
    <StyledSafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="flex-row items-center gap-1 px-2 pb-1">
        <PressableFeedback
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
        >
          <StyledIonicons
            name="chevron-back"
            size={22}
            className="text-foreground"
          />
        </PressableFeedback>
        <Typography type="body" weight="semibold">
          Hunter
        </Typography>
      </View>
      <CommunityProfilePage
        hunterId={hunterId}
        onPressListing={(feedItemId) =>
          router.push(communityItemHref(feedItemId))
        }
        onPressHunter={(nextId) => {
          if (nextId === hunterId) return;
          router.push(communityHunterHref(nextId));
        }}
      />
    </StyledSafeAreaView>
  );
}
