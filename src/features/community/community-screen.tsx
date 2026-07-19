import type { JSX } from "react";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Typography } from "heroui-native";
import { Segment } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { CommunityActivityPage } from "@/features/community/community-activity-page";
import {
  communityHunterHref,
  communityItemHref,
} from "@/features/community/community-nav";
import { CommunityPeoplePage } from "@/features/community/community-people-page";
import { CommunityProfilePage } from "@/features/community/community-profile-page";
import { CURRENT_HUNTER_ID } from "@/mocks/data/community";

const StyledSafeAreaView = withUniwind(SafeAreaView);

type CommunityTab = "activity" | "people" | "you";

export function CommunityScreen(): JSX.Element {
  const router = useRouter();
  const [tab, setTab] = useState<CommunityTab>("activity");

  const openListing = useCallback(
    (feedItemId: string) => {
      router.push(communityItemHref(feedItemId));
    },
    [router],
  );

  const openHunter = useCallback(
    (hunterId: string) => {
      if (hunterId === CURRENT_HUNTER_ID) {
        setTab("you");
        return;
      }
      router.push(communityHunterHref(hunterId));
    },
    [router],
  );

  return (
    <StyledSafeAreaView
      edges={["top"]}
      className="flex-1 bg-background"
    >
      <View className="px-3 pb-2 pt-1">
        <Typography type="body" weight="semibold" className="mb-2">
          Community
        </Typography>
        <Segment
          value={tab}
          onValueChange={(v) => setTab(v as CommunityTab)}
          size="sm"
        >
          <Segment.Group>
            <Segment.Indicator />
            <Segment.Item value="activity">
              <Segment.Label>Activity</Segment.Label>
            </Segment.Item>
            <Segment.Item value="people">
              <Segment.Label>Similar nearby</Segment.Label>
            </Segment.Item>
            <Segment.Item value="you">
              <Segment.Label>You</Segment.Label>
            </Segment.Item>
          </Segment.Group>
        </Segment>
      </View>

      {tab === "activity" ? (
        <CommunityActivityPage
          onPressListing={openListing}
          onPressHunter={openHunter}
        />
      ) : null}
      {tab === "people" ? (
        <CommunityPeoplePage onPressHunter={openHunter} />
      ) : null}
      {tab === "you" ? (
        <CommunityProfilePage
          hunterId={CURRENT_HUNTER_ID}
          isSelf
          onPressListing={openListing}
          onPressHunter={openHunter}
        />
      ) : null}
    </StyledSafeAreaView>
  );
}
