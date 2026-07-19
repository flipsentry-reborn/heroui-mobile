import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button, SkeletonGroup, Typography } from "heroui-native";
import { withUniwind } from "uniwind";

import { CommunityAccordionContentVariantsGallery } from "@/features/community/community-accordion-content-variants";
import {
  communityHunterHref,
  communityItemHref,
} from "@/features/community/community-nav";
import {
  getCommunityHunterFeeds,
  type CommunityHunterFeed,
} from "@/mocks/services/community";

const StyledSafeAreaView = withUniwind(SafeAreaView);

export function CommunityAccordionVariantsScreen(): JSX.Element {
  const router = useRouter();
  const [feed, setFeed] = useState<CommunityHunterFeed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const rows = await getCommunityHunterFeeds();
      if (alive) {
        setFeed(rows[0] ?? null);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onPressListing = useCallback(
    (feedItemId: string) => {
      router.push(communityItemHref(feedItemId));
    },
    [router],
  );

  const onPressHunter = useCallback(
    (hunterId: string) => {
      router.push(communityHunterHref(hunterId));
    },
    [router],
  );

  return (
    <StyledSafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="flex-row items-center gap-2 px-3 pb-2 pt-1">
        <Button variant="secondary" size="sm" onPress={() => router.back()}>
          Back
        </Button>
        <View className="min-w-0 flex-1">
          <Typography type="body" weight="semibold">
            Accordion interiors
          </Typography>
          <Typography type="body-xs" className="text-muted">
            10 content variants · same card shell
          </Typography>
        </View>
      </View>

      {loading || !feed ? (
        <SkeletonGroup isLoading isSkeletonOnly className="gap-3 px-3 pt-2">
          <SkeletonGroup.Item className="h-28 w-full rounded-2xl" />
          <SkeletonGroup.Item className="h-28 w-full rounded-2xl" />
        </SkeletonGroup>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-16 pt-2"
        >
          <CommunityAccordionContentVariantsGallery
            feed={feed}
            onPressListing={onPressListing}
            onPressHunter={onPressHunter}
          />
        </ScrollView>
      )}
    </StyledSafeAreaView>
  );
}
