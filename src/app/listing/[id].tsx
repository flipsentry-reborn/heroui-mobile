import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { View } from "react-native";
import { Button, SkeletonGroup } from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { FeedDetail } from "@/features/feed/feed-detail";
import agent from "@/api/agent";
import { peekFeedById } from "@/mocks/services/feed";
import { debugLog } from "@/lib/debug-log";
import type { FeedItem } from "@/models/feed";
import { useStore } from "@/store/store";

const StyledIonicons = withUniwind(Ionicons);
const FEED_OPEN_LOG = "FeedOpen";

const ListingDetailScreen = observer(function ListingDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { feedStore } = useStore();
  const listingId = String(id ?? "");
  const storeItem = feedStore.items.get(listingId) ?? null;
  const mountAtRef = useRef(Date.now());
  // Seed sync so the open transition paints content, not a skeleton flash.
  const [item, setItem] = useState<FeedItem | null>(
    () => storeItem ?? peekFeedById(listingId),
  );
  const [loading, setLoading] = useState(
    () => storeItem == null && peekFeedById(listingId) == null,
  );
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    mountAtRef.current = Date.now();
    const seed = storeItem ?? peekFeedById(listingId);
    debugLog.info(FEED_OPEN_LOG, "detail mount", {
      id: listingId,
      cacheHit: seed != null,
      fromStore: storeItem != null,
      loading: seed == null,
      t: mountAtRef.current,
    });
    // storeItem intentionally omitted — log once per listingId change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  useEffect(() => {
    let alive = true;
    const cached = feedStore.items.get(listingId) ?? peekFeedById(listingId);
    if (cached) {
      setItem(cached);
      setMissing(false);
      setLoading(false);
    } else {
      setLoading(true);
      setMissing(false);
    }
    const fetchStarted = Date.now();
    void (async () => {
      const data = await agent.Feed.getDetails(listingId);
      if (!alive) return;
      debugLog.info(FEED_OPEN_LOG, "getDetails resolved", {
        id: listingId,
        ok: data != null,
        ms: Date.now() - fetchStarted,
        sinceMountMs: Date.now() - mountAtRef.current,
        t: Date.now(),
      });
      if (data) feedStore.upsertItem(data);
      setItem(data);
      setMissing(!data);
      setLoading(false);
      void feedStore.markViewed(listingId);
    })();
    return () => {
      alive = false;
    };
  }, [feedStore, listingId]);

  // Sync store patches for this id only (favorite / image update).
  useEffect(() => {
    if (storeItem) setItem(storeItem);
  }, [storeItem]);

  const handleFavorite = useCallback(async () => {
    if (!item) return;
    const updated = await feedStore.toggleFavorite(item.id);
    if (updated) setItem(updated);
  }, [feedStore, item]);

  const handleBack = useCallback(() => {
    debugLog.info(FEED_OPEN_LOG, "detail back", {
      id: listingId,
      t: Date.now(),
    });
    router.back();
  }, [listingId, router]);

  if (loading) {
    return (
      <View className="flex-1 bg-background px-4 pt-16">
        <SkeletonGroup isLoading className="gap-3">
          <SkeletonGroup.Item className="h-80 w-full rounded-2xl" />
          <SkeletonGroup.Item className="h-8 w-1/3 rounded-md" />
          <SkeletonGroup.Item className="h-6 w-4/5 rounded-md" />
          <SkeletonGroup.Item className="h-24 w-full rounded-xl" />
        </SkeletonGroup>
      </View>
    );
  }

  if (missing || !item) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <StyledIonicons
                name="alert-circle-outline"
                size={20}
                className="text-muted"
              />
            </EmptyState.Media>
            <EmptyState.Title>Listing not found</EmptyState.Title>
            <EmptyState.Description>
              This mock item is missing or the link is invalid.
            </EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button variant="secondary" onPress={handleBack}>
              <Button.Label>Back to Feed</Button.Label>
            </Button>
          </EmptyState.Content>
        </EmptyState>
      </View>
    );
  }

  return (
    <FeedDetail
      item={item}
      onBack={handleBack}
      onToggleFavorite={() => {
        void handleFavorite();
      }}
    />
  );
});

export default ListingDetailScreen;
