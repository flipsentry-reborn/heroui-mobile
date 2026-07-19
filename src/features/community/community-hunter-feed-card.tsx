import { Image } from "expo-image";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, {
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  Accordion,
  Button,
  cn,
  Separator,
  Typography,
  useAccordion,
  useAccordionItem,
} from "heroui-native";
import { withUniwind } from "uniwind";

import {
  CommunityOnlineDot,
  isHunterOnline,
} from "@/features/community/community-presence-badge";
import {
  formatDaysAgo,
  type CommunityHunterFeed,
} from "@/mocks/services/community";

const StyledImage = withUniwind(Image);
const StyledAnimatedView = withUniwind(Animated.View);

/** Matches home `SearchCards` / HeroUI AccordionWithDepthEffect spring. */
const DEPTH_LAYOUT_TRANSITION = LinearTransition.springify()
  .damping(70)
  .stiffness(1000)
  .mass(2);

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

interface CommunityHunterFeedDepthListProps {
  feeds: CommunityHunterFeed[];
  onPressListing: (feedItemId: string) => void;
  onPressHunter: (hunterId: string) => void;
}

/** Recently clicked — same depth accordion stack as home search cards. */
export function CommunityHunterFeedDepthList({
  feeds,
  onPressListing,
  onPressHunter,
}: CommunityHunterFeedDepthListProps): JSX.Element {
  const [expandedValue, setExpandedValue] = useState<string | undefined>();
  const feedIds = useMemo(() => feeds.map((f) => f.hunter.id), [feeds]);

  useEffect(() => {
    if (expandedValue != null && !feedIds.includes(expandedValue)) {
      setExpandedValue(undefined);
    }
  }, [expandedValue, feedIds]);

  return (
    <Accordion
      value={expandedValue}
      onValueChange={(next: string | string[] | undefined) => {
        const nextValue = Array.isArray(next) ? next[0] : next;
        setExpandedValue(
          typeof nextValue === "string" && nextValue.length > 0
            ? nextValue
            : undefined,
        );
      }}
      selectionMode="single"
      isCollapsible
      hideSeparator
      className="mx-3 w-auto overflow-visible"
      animation={{
        layout: {
          value: DEPTH_LAYOUT_TRANSITION,
        },
      }}
    >
      {feeds.map((feed, index) => (
        <Accordion.Item
          key={feed.hunter.id}
          value={feed.hunter.id}
          className="overflow-visible"
        >
          <CommunityFeedDepthItem
            feed={feed}
            index={index}
            feedCount={feeds.length}
            feedIds={feedIds}
            onPressListing={onPressListing}
            onPressHunter={onPressHunter}
          />
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

/** @deprecated Use CommunityHunterFeedDepthList — kept name for imports. */
export function CommunityHunterFeedCard({
  feed,
  onPressListing,
  onPressHunter,
}: {
  feed: CommunityHunterFeed;
  onPressListing: (feedItemId: string) => void;
  onPressHunter: (hunterId: string) => void;
}): JSX.Element {
  return (
    <CommunityHunterFeedDepthList
      feeds={[feed]}
      onPressListing={onPressListing}
      onPressHunter={onPressHunter}
    />
  );
}

function CommunityFeedDepthItem({
  feed,
  index,
  feedCount,
  feedIds,
  onPressListing,
  onPressHunter,
}: {
  feed: CommunityHunterFeed;
  index: number;
  feedCount: number;
  feedIds: string[];
  onPressListing: (feedItemId: string) => void;
  onPressHunter: (hunterId: string) => void;
}): JSX.Element | null {
  const row = feed.clicks[0];
  const { value } = useAccordion();
  const { isExpanded } = useAccordionItem();
  const scale = useSharedValue(isExpanded ? 1 : 0.97);

  useEffect(() => {
    scale.value = withTiming(isExpanded ? 1 : 0.97, { duration: 200 });
  }, [isExpanded, scale]);

  const depthStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const expandedIds = useMemo(() => {
    if (Array.isArray(value)) return new Set(value);
    if (typeof value === "string" && value.length > 0) return new Set([value]);
    return new Set<string>();
  }, [value]);

  if (!row) return null;

  const { hunter } = feed;
  const imageUrl =
    row.feedItem.images.imageUrlHostedByUs ||
    row.feedItem.images.mainImageUrl.imageUrl;
  const cityShort = hunter.city.split(",")[0] ?? hunter.city;

  const prevId = index > 0 ? feedIds[index - 1] : undefined;
  const nextId = index < feedCount - 1 ? feedIds[index + 1] : undefined;
  const isBeforeSelected = nextId != null && expandedIds.has(nextId);
  const isAfterSelected = prevId != null && expandedIds.has(prevId);

  const showDivider =
    index < feedCount - 1 && !isExpanded && !isBeforeSelected;

  return (
    <StyledAnimatedView
      layout={DEPTH_LAYOUT_TRANSITION}
      style={depthStyle}
    >
      <StyledAnimatedView
        layout={DEPTH_LAYOUT_TRANSITION}
        className={cn(
          "overflow-hidden bg-surface",
          index === 0 && !isExpanded && "rounded-t-2xl",
          index === feedCount - 1 &&
            !isExpanded &&
            !isBeforeSelected &&
            "rounded-b-3xl",
          isBeforeSelected && "rounded-b-2xl",
          isExpanded && "rounded-2xl",
          isAfterSelected && "rounded-t-2xl",
          isExpanded && index === 0 && "mb-2",
          isExpanded && index > 0 && index < feedCount - 1 && "my-2",
          isExpanded && index === feedCount - 1 && "mt-2",
        )}
      >
        <Accordion.Trigger className="gap-3 px-3 py-2.5">
          <StyledImage
            source={{ uri: imageUrl }}
            className="h-14 w-14 rounded-md bg-surface-secondary"
            contentFit="cover"
          />
          <View className="min-w-0 flex-1 gap-0.5">
            <Typography type="body-sm" weight="semibold" numberOfLines={1}>
              {row.feedItem.title}
            </Typography>
            <Typography type="body-xs" className="text-muted" numberOfLines={1}>
              {hunter.displayName}
              {" · "}
              {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
              {" · "}
              {formatDaysAgo(row.event.daysAgo)}
            </Typography>
          </View>
          <Accordion.Indicator />
        </Accordion.Trigger>

        <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
          <View className="flex-row gap-2">
            <Kpi label="Clicks" value={String(hunter.clicksYesterday)} />
            {isHunterOnline(hunter) ? (
              <View className="min-w-0 flex-1 items-center gap-0.5 py-1">
                <CommunityOnlineDot />
                <Typography type="body-xs" className="text-[10px] text-muted">
                  Last online
                </Typography>
              </View>
            ) : (
              <Kpi label="Last online" value={hunter.lastOnlineLabel} />
            )}
            <Kpi label="City" value={cityShort} />
          </View>
          <View className="flex-row gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 flex-1"
              onPress={() => onPressListing(row.feedItem.id)}
            >
              View listing
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="h-8 flex-1"
              onPress={() => onPressHunter(hunter.id)}
            >
              See profile
            </Button>
          </View>
        </Accordion.Content>
      </StyledAnimatedView>

      {showDivider ? (
        <StyledAnimatedView
          layout={DEPTH_LAYOUT_TRANSITION}
          entering={FadeIn.duration(200)}
          className="-mb-3 bg-surface px-3 pb-3"
        >
          <Separator />
        </StyledAnimatedView>
      ) : null}
    </StyledAnimatedView>
  );
}

function Kpi({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View className="min-w-0 flex-1 items-center gap-0.5 py-1">
      <Typography type="body-sm" weight="semibold" numberOfLines={1}>
        {value}
      </Typography>
      <Typography type="body-xs" className="text-[10px] text-muted">
        {label}
      </Typography>
    </View>
  );
}
