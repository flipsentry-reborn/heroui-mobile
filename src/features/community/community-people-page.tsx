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
import { EmptyState, Segment } from "heroui-native-pro";

import { CommunityHunterAvatar } from "@/features/community/community-hunter-avatar";
import type { CommunityHunter } from "@/mocks/data/community";
import { getCommunityHunters } from "@/mocks/services/community";

type PeopleScope = "nearby" | "all";

interface CommunityPeoplePageProps {
  onPressHunter: (hunterId: string) => void;
}

export function CommunityPeoplePage({
  onPressHunter,
}: CommunityPeoplePageProps): JSX.Element {
  const [scope, setScope] = useState<PeopleScope>("nearby");
  const [hunters, setHunters] = useState<CommunityHunter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (next: PeopleScope) => {
    const data = await getCommunityHunters(next);
    setHunters(data);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      await load(scope);
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [load, scope]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(scope);
    setRefreshing(false);
  };

  return (
    <View className="flex-1">
      <View className="px-3 pb-2 pt-1">
        <Segment
          value={scope}
          onValueChange={(v) => setScope(v as PeopleScope)}
          size="sm"
        >
          <Segment.Group>
            <Segment.Indicator />
            <Segment.Item value="nearby">
              <Segment.Label>Nearby</Segment.Label>
            </Segment.Item>
            <Segment.Item value="all">
              <Segment.Label>All</Segment.Label>
            </Segment.Item>
          </Segment.Group>
        </Segment>
      </View>

      {loading ? (
        <SkeletonGroup isLoading isSkeletonOnly className="px-3 pt-2">
          {[0, 1, 2, 3].map((k) => (
            <SkeletonGroup.Item key={k} className="mb-2 h-14 w-full rounded-xl" />
          ))}
        </SkeletonGroup>
      ) : hunters.length === 0 ? (
        <EmptyState className="flex-1 justify-center px-6">
          <EmptyState.Header>
            <EmptyState.Title>
              {scope === "nearby" ? "No hunters nearby" : "No hunters yet"}
            </EmptyState.Title>
            <EmptyState.Description>
              {scope === "nearby"
                ? "Try All to see hunters outside your radius."
                : "Community activity will show hunters here."}
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-[110px] px-3"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
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
                          {hunter.distanceMiles != null
                            ? ` · ${hunter.distanceMiles} mi`
                            : ""}
                          {" · "}
                          {hunter.clicksYesterday} clicks yesterday
                        </ListGroup.ItemDescription>
                      </ListGroup.ItemContent>
                      <ListGroup.ItemSuffix />
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
      )}
    </View>
  );
}
