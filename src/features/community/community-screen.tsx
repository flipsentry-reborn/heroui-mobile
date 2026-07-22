import type { JSX } from "react";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { cn, Typography } from "heroui-native";
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

type VisitedTabs = Record<CommunityTab, boolean>;

export function CommunityScreen(): JSX.Element {
  const router = useRouter();
  const [tab, setTab] = useState<CommunityTab>("activity");
  const [visited, setVisited] = useState<VisitedTabs>({
    activity: true,
    people: false,
    you: false,
  });

  const selectTab = useCallback((next: CommunityTab) => {
    setTab(next);
    setVisited((prev) => (prev[next] ? prev : { ...prev, [next]: true }));
  }, []);

  const openListing = useCallback(
    (feedItemId: string) => {
      router.push(communityItemHref(feedItemId));
    },
    [router],
  );

  const openHunter = useCallback(
    (hunterId: string) => {
      if (hunterId === CURRENT_HUNTER_ID) {
        selectTab("you");
        return;
      }
      router.push(communityHunterHref(hunterId));
    },
    [router, selectTab],
  );

  return (
    <StyledSafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="gap-3 px-4 pb-3 pt-2">
        <Typography type="h2" weight="bold">
          Community
        </Typography>
        <Segment
          value={tab}
          onValueChange={(v) => selectTab(v as CommunityTab)}
          size="sm"
        >
          <Segment.Group className="rounded-2xl">
            <Segment.Indicator className="rounded-xl" />
            <Segment.Item value="activity" className="rounded-xl">
              <Segment.Label>Activity</Segment.Label>
            </Segment.Item>
            <Segment.Item value="people" className="rounded-xl">
              <Segment.Label>Competitors nearby</Segment.Label>
            </Segment.Item>
            <Segment.Item value="you" className="rounded-xl">
              <Segment.Label>You</Segment.Label>
            </Segment.Item>
          </Segment.Group>
        </Segment>
      </View>

      {visited.activity ? (
        <View className={cn("flex-1", tab !== "activity" && "hidden")}>
          <CommunityActivityPage
            onPressListing={openListing}
            onPressHunter={openHunter}
          />
        </View>
      ) : null}
      {visited.people ? (
        <View className={cn("flex-1", tab !== "people" && "hidden")}>
          <CommunityPeoplePage onPressHunter={openHunter} />
        </View>
      ) : null}
      {visited.you ? (
        <View className={cn("flex-1", tab !== "you" && "hidden")}>
          <CommunityProfilePage
            hunterId={CURRENT_HUNTER_ID}
            isSelf
            onPressListing={openListing}
            onPressHunter={openHunter}
          />
        </View>
      ) : null}
    </StyledSafeAreaView>
  );
}
