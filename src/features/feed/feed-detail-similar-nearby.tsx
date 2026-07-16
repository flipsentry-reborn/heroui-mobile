import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Chip, SkeletonGroup, Typography } from "heroui-native";
import { EmptyState, FAB } from "heroui-native-pro";

import { FeedItem } from "@/features/feed/feed-item";
import type { FeedItem as FeedModel } from "@/models/feed";

const DAYS_OPTIONS = [1, 2, 3] as const;

function SimilarNearbySkeleton(): JSX.Element {
  return (
    <SkeletonGroup isLoading isSkeletonOnly className="flex-row flex-wrap px-0.5">
      {[0, 1, 2, 3].map((key) => (
        <View key={key} className="mb-1.5 w-1/2 px-0.5">
          <View className="overflow-hidden rounded-xl">
            <SkeletonGroup.Item className="h-[168px] w-full rounded-xl" />
            <View className="gap-0.5 px-1.5 pb-1.5 pt-1">
              <View className="flex-row items-center gap-1.5">
                <SkeletonGroup.Item className="h-4 w-14 rounded-md" />
                <SkeletonGroup.Item className="h-3 w-16 rounded-md" />
              </View>
              <SkeletonGroup.Item className="h-4 w-full rounded-md" />
              <SkeletonGroup.Item className="h-3 w-28 rounded-md" />
            </View>
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}

interface FeedDetailSimilarNearbyProps {
  items: FeedModel[];
  loading: boolean;
  sameYear: boolean;
  days: number;
  onSameYearToggle: () => void;
  onDaysChange: (days: number) => void;
  onPressItem: (id: string) => void;
}

export function FeedDetailSimilarNearby({
  items,
  loading,
  sameYear,
  days,
  onSameYearToggle,
  onDaysChange,
  onPressItem,
}: FeedDetailSimilarNearbyProps): JSX.Element | null {
  const [hasShownItems, setHasShownItems] = useState(false);

  useEffect(() => {
    if (items.length > 0) setHasShownItems(true);
  }, [items.length]);

  if (!loading && items.length === 0 && !hasShownItems) return null;

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Typography
          type="body"
          weight="semibold"
          className="min-w-0 flex-1 text-[17px] leading-5 text-foreground"
          numberOfLines={1}
        >
          Similar Nearby
        </Typography>
        <View className="shrink-0 flex-row items-center gap-1.5">
          <Chip
            size="sm"
            variant={sameYear ? "primary" : "secondary"}
            color={sameYear ? "accent" : "default"}
            onPress={onSameYearToggle}
            className="h-7 rounded-full px-2.5"
          >
            <Chip.Label className="text-xs font-medium">Same Year</Chip.Label>
          </Chip>
          <FAB placement="bottom" align="end">
            <FAB.Trigger
              accessibilityLabel={`Days range ${days} day`}
              className="h-7 w-[68px] rounded-full px-2.5"
              animation={{ rotate: { value: [0, 0, 0] } }}
            >
              <Typography
                type="body-xs"
                weight="medium"
                numberOfLines={1}
                className="text-xs text-accent-foreground"
              >
                {days} day
              </Typography>
            </FAB.Trigger>
            <FAB.Portal>
              <FAB.Overlay />
              <FAB.Content>
                {DAYS_OPTIONS.map((d) => (
                  <FAB.Item key={d} onPress={() => onDaysChange(d)}>
                    <FAB.ItemLabel className="text-xs font-medium">
                      {d} day
                    </FAB.ItemLabel>
                  </FAB.Item>
                ))}
              </FAB.Content>
            </FAB.Portal>
          </FAB>
        </View>
      </View>

      {loading ? (
        <SimilarNearbySkeleton />
      ) : items.length === 0 ? (
        <EmptyState className="gap-3 px-4 py-4">
          <EmptyState.Header className="gap-1">
            <EmptyState.Title>No similar listings</EmptyState.Title>
            <EmptyState.Description>
              Nothing matches these filters. Try a wider day range or turn off Same
              Year.
            </EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content className="mt-0 gap-0 pt-0">
            <Button
              variant="primary"
              onPress={() => {
                if (sameYear) onSameYearToggle();
                onDaysChange(3);
              }}
            >
              <Button.Label>Clear filters</Button.Label>
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : (
        <View className="-mx-0.5 flex-row flex-wrap">
          {items.map((feed) => (
            <View key={feed.id} className="w-1/2">
              <FeedItem feed={feed} layout="grid" onPress={onPressItem} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function useSimilarNearbyFilters(): {
  sameYear: boolean;
  days: number;
  toggleSameYear: () => void;
  setDays: (days: number) => void;
} {
  const [sameYear, setSameYear] = useState(false);
  const [days, setDays] = useState(3);

  const toggleSameYear = useCallback(() => {
    setSameYear((v) => !v);
  }, []);

  return { sameYear, days, toggleSameYear, setDays };
}
