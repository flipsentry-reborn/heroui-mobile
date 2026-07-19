import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import {
  PressableFeedback,
  Separator,
  SkeletonGroup,
  Typography,
} from "heroui-native";
import { EmptyState } from "heroui-native-pro";

import { CommunityHunterAvatar } from "@/features/community/community-hunter-avatar";
import {
  CommunityActiveBadge,
  isHunterOnline,
} from "@/features/community/community-presence-badge";
import { CommunitySectionHeader } from "@/features/community/community-section-header";
import type { CommunityHunter } from "@/mocks/data/community";
import { getCommunityHunters } from "@/mocks/services/community";

interface CommunityPeoplePageProps {
  onPressHunter: (hunterId: string) => void;
}

/** Spotify library / artist list — large avatar, bold name, muted meta. */
export function CommunityPeoplePage({
  onPressHunter,
}: CommunityPeoplePageProps): JSX.Element {
  const [hunters, setHunters] = useState<CommunityHunter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getCommunityHunters("nearby");
    setHunters(data);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      await load();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SkeletonGroup isLoading isSkeletonOnly className="px-4 pt-2">
        {[0, 1, 2, 3].map((k) => (
          <View key={k} className="mb-4 flex-row items-center gap-3">
            <SkeletonGroup.Item className="h-14 w-14 rounded-full" />
            <View className="flex-1 gap-2">
              <SkeletonGroup.Item className="h-4 w-36 rounded-md" />
              <SkeletonGroup.Item className="h-3 w-48 rounded-md" />
            </View>
          </View>
        ))}
      </SkeletonGroup>
    );
  }

  if (hunters.length === 0) {
    return (
      <EmptyState className="flex-1 justify-center px-6">
        <EmptyState.Header>
          <EmptyState.Title>No similar hunters nearby</EmptyState.Title>
          <EmptyState.Description>
            Hunters within your local radius will show up here.
          </EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-[110px] pt-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <CommunitySectionHeader
        title="Similar nearby"
        subtitle="Hunters near you with similar activity"
      />

      {hunters.map((hunter, index) => (
        <View key={hunter.id}>
          <PressableFeedback
            onPress={() => onPressHunter(hunter.id)}
            className="flex-row items-center gap-3 px-4 py-2.5"
            animation={{ scale: { value: 0.98 } }}
          >
            <CommunityHunterAvatar hunter={hunter} size="lg" />
            <View className="min-w-0 flex-1 gap-0.5">
              <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                {hunter.displayName}
              </Typography>
              <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                {hunter.city}
                {" · "}
                {hunter.clicksYesterday} clicks yesterday
              </Typography>
            </View>
            {isHunterOnline(hunter) ? <CommunityActiveBadge /> : null}
          </PressableFeedback>
          {index < hunters.length - 1 ? (
            <Separator className="ml-[76px] bg-muted/25" />
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
