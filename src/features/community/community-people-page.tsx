import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import {
  ListGroup,
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
import type { CommunityHunter } from "@/mocks/data/community";
import { getCommunityHunters } from "@/mocks/services/community";

interface CommunityPeoplePageProps {
  onPressHunter: (hunterId: string) => void;
}

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
      <SkeletonGroup isLoading isSkeletonOnly className="px-3 pt-2">
        {[0, 1, 2, 3].map((k) => (
          <SkeletonGroup.Item key={k} className="mb-2 h-14 w-full rounded-xl" />
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
      contentContainerClassName="pb-[110px] px-3 pt-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Typography type="body-xs" className="mb-2 px-1 text-muted">
        Hunters near you · similar activity
      </Typography>
      <ListGroup>
        {hunters.map((hunter, index) => (
          <View key={hunter.id}>
            <PressableFeedback
              onPress={() => onPressHunter(hunter.id)}
              animation={false}
            >
              <PressableFeedback.Scale>
                <ListGroup.Item disabled className="py-2.5">
                  <ListGroup.ItemPrefix>
                    <CommunityHunterAvatar hunter={hunter} size="md" />
                  </ListGroup.ItemPrefix>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle className="text-[15px] font-normal">
                      {hunter.displayName}
                    </ListGroup.ItemTitle>
                    <ListGroup.ItemDescription className="text-xs text-muted">
                      {hunter.city}
                      {" · "}
                      {isHunterOnline(hunter)
                        ? "Online"
                        : hunter.lastOnlineLabel}
                      {" · "}
                      {hunter.clicksYesterday} clicks yesterday
                    </ListGroup.ItemDescription>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix>
                    {isHunterOnline(hunter) ? <CommunityActiveBadge /> : null}
                  </ListGroup.ItemSuffix>
                </ListGroup.Item>
              </PressableFeedback.Scale>
              <PressableFeedback.Highlight />
            </PressableFeedback>
            {index < hunters.length - 1 ? (
              <Separator className="ml-14 bg-muted/30" />
            ) : null}
          </View>
        ))}
      </ListGroup>
    </ScrollView>
  );
}
