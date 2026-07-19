import { Image } from "expo-image";
import type { JSX, ReactNode } from "react";
import { View } from "react-native";
import {
  Accordion,
  Card,
  Chip,
  ListGroup,
  PressableFeedback,
  Separator,
  Surface,
  Typography,
} from "heroui-native";
import { Badge, Timeline } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { CommunityHunterAvatar } from "@/features/community/community-hunter-avatar";
import {
  formatDaysAgo,
  type CommunityHunterFeed,
} from "@/mocks/services/community";

const StyledImage = withUniwind(Image);

export type VariantFeedProps = {
  feeds: CommunityHunterFeed[];
  onPressListing: (feedItemId: string) => void;
  onPressHunter: (hunterId: string) => void;
};

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

function listingImage(feed: CommunityHunterFeed): string {
  const item = feed.clicks[0]?.feedItem;
  if (!item) return "";
  return item.images.imageUrlHostedByUs || item.images.mainImageUrl.imageUrl;
}

function latest(feed: CommunityHunterFeed) {
  return feed.clicks[0];
}

function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <View className="mb-8">
      <View className="mb-2 px-3">
        <Typography type="body-sm" weight="semibold">
          {id}. {title}
        </Typography>
        <Typography type="body-xs" className="text-muted">
          {hint}
        </Typography>
      </View>
      {children}
    </View>
  );
}

/** V1 — 50/50 Surface: hunter left, product right */
function VariantSplitSurface({
  feeds,
  onPressListing,
  onPressHunter,
}: VariantFeedProps): JSX.Element {
  return (
    <View className="gap-2 px-3">
      {feeds.map((feed) => {
        const row = latest(feed);
        if (!row) return null;
        return (
          <Surface
            key={feed.hunter.id}
            className="overflow-hidden rounded-2xl p-0"
          >
            <View className="flex-row">
              <PressableFeedback
                onPress={() => onPressHunter(feed.hunter.id)}
                className="w-1/2 justify-center gap-2 p-3"
              >
                <CommunityHunterAvatar hunter={feed.hunter} size="md" />
                <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                  {feed.hunter.displayName}
                </Typography>
                <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                  {feed.hunter.city}
                  {feed.hunter.distanceMiles != null
                    ? ` · ${feed.hunter.distanceMiles} mi`
                    : ""}
                </Typography>
                <Chip size="sm" variant="secondary">
                  <Chip.Label className="text-[10px]">
                    {feed.clicks.length} clicks
                  </Chip.Label>
                </Chip>
              </PressableFeedback>
              <PressableFeedback
                onPress={() => onPressListing(row.feedItem.id)}
                className="w-1/2"
              >
                <StyledImage
                  source={{ uri: listingImage(feed) }}
                  className="h-36 w-full bg-surface-secondary"
                  contentFit="cover"
                />
              </PressableFeedback>
            </View>
          </Surface>
        );
      })}
    </View>
  );
}

/** V2 — Product-first split: big image left, meta right */
function VariantProductFirst({
  feeds,
  onPressListing,
  onPressHunter,
}: VariantFeedProps): JSX.Element {
  return (
    <View className="gap-2 px-3">
      {feeds.map((feed) => {
        const row = latest(feed);
        if (!row) return null;
        return (
          <Surface
            key={feed.hunter.id}
            className="overflow-hidden rounded-2xl p-0"
          >
            <View className="flex-row">
              <PressableFeedback
                onPress={() => onPressListing(row.feedItem.id)}
                className="w-[42%]"
              >
                <StyledImage
                  source={{ uri: listingImage(feed) }}
                  className="h-40 w-full bg-surface-secondary"
                  contentFit="cover"
                />
              </PressableFeedback>
              <View className="w-[58%] justify-between gap-2 p-3">
                <PressableFeedback onPress={() => onPressHunter(feed.hunter.id)}>
                  <View className="flex-row items-center gap-2">
                    <CommunityHunterAvatar hunter={feed.hunter} size="sm" />
                    <View className="min-w-0 flex-1">
                      <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                        {feed.hunter.displayName}
                      </Typography>
                      <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                        @{feed.hunter.handle}
                      </Typography>
                    </View>
                  </View>
                </PressableFeedback>
                <PressableFeedback onPress={() => onPressListing(row.feedItem.id)}>
                  <Typography type="body-sm" numberOfLines={2}>
                    {row.feedItem.title}
                  </Typography>
                  <Typography type="body-xs" className="mt-1 text-muted">
                    {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
                    {" · "}
                    {formatDaysAgo(row.event.daysAgo)}
                  </Typography>
                </PressableFeedback>
                <Typography type="body-xs" className="text-accent">
                  See all ({feed.clicks.length})
                </Typography>
              </View>
            </View>
          </Surface>
        );
      })}
    </View>
  );
}

/** V3 — One row, 2 users (image-top tiles) */
function VariantTwoColTiles({
  feeds,
  onPressListing,
  onPressHunter,
}: VariantFeedProps): JSX.Element {
  return (
    <View className="flex-row gap-2 px-3">
      {feeds.map((feed) => {
        const row = latest(feed);
        if (!row) return null;
        return (
          <Surface
            key={feed.hunter.id}
            className="min-w-0 flex-1 overflow-hidden rounded-2xl p-0"
          >
            <PressableFeedback onPress={() => onPressListing(row.feedItem.id)}>
              <StyledImage
                source={{ uri: listingImage(feed) }}
                className="h-28 w-full bg-surface-secondary"
                contentFit="cover"
              />
            </PressableFeedback>
            <PressableFeedback
              onPress={() => onPressHunter(feed.hunter.id)}
              className="gap-1 p-2.5"
            >
              <View className="flex-row items-center gap-2">
                <CommunityHunterAvatar hunter={feed.hunter} size="sm" />
                <Typography type="body-xs" weight="semibold" numberOfLines={1} className="flex-1">
                  {feed.hunter.displayName.split(" ")[0]}
                </Typography>
              </View>
              <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
              </Typography>
            </PressableFeedback>
          </Surface>
        );
      })}
    </View>
  );
}

/** V4 — Accordion trigger always shows product peek */
function VariantAccordionPeek({
  feeds,
  onPressListing,
  onPressHunter,
}: VariantFeedProps): JSX.Element {
  return (
    <Accordion selectionMode="single" variant="surface" className="gap-2 px-3">
      {feeds.map((feed) => {
        const row = latest(feed);
        if (!row) return null;
        const more = feed.clicks.slice(1, 3);
        return (
          <Accordion.Item key={feed.hunter.id} value={feed.hunter.id}>
            <Accordion.Trigger className="gap-2 px-3 py-2.5">
              <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
                <CommunityHunterAvatar hunter={feed.hunter} size="md" />
                <View className="min-w-0 flex-1">
                  <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                    {feed.hunter.displayName}
                  </Typography>
                  <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                    {feed.clicks.length} clicks · {formatDaysAgo(row.event.daysAgo)}
                  </Typography>
                </View>
                <PressableFeedback
                  onPress={() => onPressListing(row.feedItem.id)}
                >
                  <StyledImage
                    source={{ uri: listingImage(feed) }}
                    className="h-12 w-12 rounded-lg bg-surface-secondary"
                    contentFit="cover"
                  />
                </PressableFeedback>
              </View>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
              {more.map((r) => (
                <PressableFeedback
                  key={r.event.id}
                  onPress={() => onPressListing(r.feedItem.id)}
                  className="flex-row items-center gap-2 rounded-xl bg-surface-secondary/80 px-2 py-2"
                >
                  <StyledImage
                    source={{
                      uri:
                        r.feedItem.images.imageUrlHostedByUs ||
                        r.feedItem.images.mainImageUrl.imageUrl,
                    }}
                    className="h-12 w-12 rounded-lg"
                    contentFit="cover"
                  />
                  <Typography type="body-sm" className="flex-1" numberOfLines={1}>
                    {r.feedItem.title}
                  </Typography>
                </PressableFeedback>
              ))}
              <PressableFeedback onPress={() => onPressHunter(feed.hunter.id)}>
                <Typography type="body-sm" className="py-1 text-center text-accent">
                  See all
                </Typography>
              </PressableFeedback>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

/** V5 — ListGroup with product suffix */
function VariantListGroupSuffix({
  feeds,
  onPressListing,
  onPressHunter,
}: VariantFeedProps): JSX.Element {
  return (
    <View className="px-3">
      <ListGroup>
        {feeds.map((feed, index) => {
          const row = latest(feed);
          if (!row) return null;
          return (
            <View key={feed.hunter.id}>
              <PressableFeedback
                animation={false}
                onPress={() => onPressHunter(feed.hunter.id)}
              >
                <PressableFeedback.Scale>
                  <ListGroup.Item disabled className="py-2.5">
                    <ListGroup.ItemPrefix>
                      <CommunityHunterAvatar hunter={feed.hunter} size="md" />
                    </ListGroup.ItemPrefix>
                    <ListGroup.ItemContent>
                      <ListGroup.ItemTitle className="text-[15px] font-normal">
                        {feed.hunter.displayName}
                      </ListGroup.ItemTitle>
                      <ListGroup.ItemDescription className="text-xs text-muted">
                        {formatPrice(
                          row.feedItem.price,
                          row.feedItem.currencySymbol,
                        )}
                        {" · "}
                        {formatDaysAgo(row.event.daysAgo)}
                      </ListGroup.ItemDescription>
                    </ListGroup.ItemContent>
                    <ListGroup.ItemSuffix>
                      <PressableFeedback
                        onPress={() => onPressListing(row.feedItem.id)}
                      >
                        <StyledImage
                          source={{ uri: listingImage(feed) }}
                          className="h-14 w-14 rounded-xl bg-surface-secondary"
                          contentFit="cover"
                        />
                      </PressableFeedback>
                    </ListGroup.ItemSuffix>
                  </ListGroup.Item>
                </PressableFeedback.Scale>
                <PressableFeedback.Highlight />
              </PressableFeedback>
              {index < feeds.length - 1 ? (
                <Separator className="ml-14 bg-muted/30" />
              ) : null}
            </View>
          );
        })}
      </ListGroup>
    </View>
  );
}

/** V6 — Pair of Card covers in one row (2 users) */
function VariantCardCoverPair({
  feeds,
  onPressListing,
  onPressHunter,
}: VariantFeedProps): JSX.Element {
  return (
    <View className="flex-row gap-2 px-3">
      {feeds.map((feed) => {
        const row = latest(feed);
        if (!row) return null;
        return (
          <Card key={feed.hunter.id} className="min-w-0 flex-1 overflow-hidden p-0">
            <PressableFeedback onPress={() => onPressListing(row.feedItem.id)}>
              <StyledImage
                source={{ uri: listingImage(feed) }}
                className="h-28 w-full bg-surface-secondary"
                contentFit="cover"
              />
            </PressableFeedback>
            <Card.Footer className="gap-1 px-2 py-2">
              <PressableFeedback
                onPress={() => onPressHunter(feed.hunter.id)}
                className="flex-row items-center gap-1.5"
              >
                <CommunityHunterAvatar hunter={feed.hunter} size="sm" />
                <Typography type="body-xs" weight="semibold" numberOfLines={1} className="flex-1">
                  {feed.hunter.displayName.split(" ")[0]}
                </Typography>
              </PressableFeedback>
              <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
              </Typography>
            </Card.Footer>
          </Card>
        );
      })}
    </View>
  );
}

/** V7 — Badge count on avatar + horizontal product row */
function VariantBadgeRow({
  feeds,
  onPressListing,
  onPressHunter,
}: VariantFeedProps): JSX.Element {
  return (
    <View className="gap-2 px-3">
      {feeds.map((feed) => {
        const row = latest(feed);
        if (!row) return null;
        return (
          <Surface
            key={feed.hunter.id}
            className="flex-row items-center gap-3 rounded-2xl p-2.5"
          >
            <PressableFeedback onPress={() => onPressHunter(feed.hunter.id)}>
              <Badge.Anchor>
                <CommunityHunterAvatar hunter={feed.hunter} size="lg" />
                <Badge color="accent" size="sm" placement="top-right">
                  {feed.clicks.length}
                </Badge>
              </Badge.Anchor>
            </PressableFeedback>
            <View className="min-w-0 flex-1 gap-0.5">
              <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                {feed.hunter.displayName}
              </Typography>
              <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                {row.feedItem.title}
              </Typography>
              <Typography type="body-xs" className="text-muted">
                {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
              </Typography>
            </View>
            <PressableFeedback onPress={() => onPressListing(row.feedItem.id)}>
              <StyledImage
                source={{ uri: listingImage(feed) }}
                className="h-16 w-16 rounded-xl bg-surface-secondary"
                contentFit="cover"
              />
            </PressableFeedback>
          </Surface>
        );
      })}
    </View>
  );
}

/** V8 — Timeline activity with product thumb */
function VariantTimeline({
  feeds,
  onPressListing,
  onPressHunter,
}: VariantFeedProps): JSX.Element {
  return (
    <View className="px-3">
      <Timeline size="sm" density="compact">
        {feeds.map((feed, index) => {
          const row = latest(feed);
          if (!row) return null;
          return (
            <Timeline.Item
              key={feed.hunter.id}
              status={index === 0 ? "current" : "default"}
            >
              <Timeline.Leading>
                <Typography type="body-xs" className="w-8 text-muted">
                  {row.event.daysAgo}d
                </Typography>
              </Timeline.Leading>
              <Timeline.Rail />
              <Timeline.Content>
                <PressableFeedback
                  onPress={() => onPressHunter(feed.hunter.id)}
                  className="mb-1.5 flex-row items-center gap-2"
                >
                  <CommunityHunterAvatar hunter={feed.hunter} size="sm" />
                  <Timeline.Title>{feed.hunter.displayName}</Timeline.Title>
                </PressableFeedback>
                <PressableFeedback
                  onPress={() => onPressListing(row.feedItem.id)}
                  className="flex-row items-center gap-2 rounded-xl bg-surface-secondary/80 p-2"
                >
                  <StyledImage
                    source={{ uri: listingImage(feed) }}
                    className="h-14 w-14 rounded-lg"
                    contentFit="cover"
                  />
                  <View className="min-w-0 flex-1">
                    <Typography type="body-sm" numberOfLines={1}>
                      {row.feedItem.title}
                    </Typography>
                    <Typography type="body-xs" className="text-muted">
                      {formatPrice(
                        row.feedItem.price,
                        row.feedItem.currencySymbol,
                      )}
                    </Typography>
                  </View>
                </PressableFeedback>
              </Timeline.Content>
            </Timeline.Item>
          );
        })}
      </Timeline>
    </View>
  );
}

/** V9 — Compact pair: 2 hunters side by side (avatar + product) */
function VariantCompactPair({
  feeds,
  onPressListing,
  onPressHunter,
}: VariantFeedProps): JSX.Element {
  return (
    <View className="flex-row gap-2 px-3">
      {feeds.map((feed) => {
        const row = latest(feed);
        if (!row) return null;
        return (
          <Surface
            key={feed.hunter.id}
            className="min-w-0 flex-1 gap-2 rounded-2xl p-2.5"
          >
            <PressableFeedback
              onPress={() => onPressHunter(feed.hunter.id)}
              className="flex-row items-center gap-2"
            >
              <CommunityHunterAvatar hunter={feed.hunter} size="sm" />
              <Typography type="body-xs" weight="semibold" numberOfLines={1} className="flex-1">
                {feed.hunter.displayName.split(" ")[0]}
              </Typography>
            </PressableFeedback>
            <PressableFeedback onPress={() => onPressListing(row.feedItem.id)}>
              <StyledImage
                source={{ uri: listingImage(feed) }}
                className="h-20 w-full rounded-xl bg-surface-secondary"
                contentFit="cover"
              />
              <Typography type="body-xs" className="mt-1 text-muted" numberOfLines={1}>
                {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
              </Typography>
            </PressableFeedback>
          </Surface>
        );
      })}
    </View>
  );
}

/** V10 — Stacked columns: avatar rail + product card column */
function VariantStackedColumns({
  feeds,
  onPressListing,
  onPressHunter,
}: VariantFeedProps): JSX.Element {
  return (
    <View className="gap-2 px-3">
      {feeds.map((feed) => {
        const row = latest(feed);
        if (!row) return null;
        return (
          <View key={feed.hunter.id} className="flex-row gap-2">
            <PressableFeedback
              onPress={() => onPressHunter(feed.hunter.id)}
              className="w-16 items-center gap-1 pt-1"
            >
              <CommunityHunterAvatar hunter={feed.hunter} size="lg" />
              <Typography type="body-xs" className="text-center" numberOfLines={1}>
                {feed.hunter.displayName.split(" ")[0]}
              </Typography>
            </PressableFeedback>
            <PressableFeedback
              onPress={() => onPressListing(row.feedItem.id)}
              className="min-w-0 flex-1"
            >
              <Surface className="overflow-hidden rounded-2xl p-0">
                <View className="flex-row">
                  <StyledImage
                    source={{ uri: listingImage(feed) }}
                    className="h-24 w-24 bg-surface-secondary"
                    contentFit="cover"
                  />
                  <View className="min-w-0 flex-1 justify-center gap-1 p-2.5">
                    <Typography type="body-sm" numberOfLines={2}>
                      {row.feedItem.title}
                    </Typography>
                    <Typography type="body-xs" weight="semibold">
                      {formatPrice(
                        row.feedItem.price,
                        row.feedItem.currencySymbol,
                      )}
                    </Typography>
                    <Typography type="body-xs" className="text-muted">
                      {formatDaysAgo(row.event.daysAgo)} · See all
                    </Typography>
                  </View>
                </View>
              </Surface>
            </PressableFeedback>
          </View>
        );
      })}
    </View>
  );
}

export const COMMUNITY_FEED_VARIANTS: {
  id: string;
  title: string;
  hint: string;
  /** How many hunters to show for this sample (1 = single, 2 = one row / pair). */
  users: 1 | 2;
  Component: (props: VariantFeedProps) => JSX.Element;
}[] = [
  {
    id: "1",
    title: "Split Surface 50/50",
    hint: "1 user · hunter left / product right",
    users: 1,
    Component: VariantSplitSurface,
  },
  {
    id: "2",
    title: "Product-first split",
    hint: "1 user · tall product left",
    users: 1,
    Component: VariantProductFirst,
  },
  {
    id: "3",
    title: "2-user tiles",
    hint: "1 row · 2 users · image on top",
    users: 2,
    Component: VariantTwoColTiles,
  },
  {
    id: "4",
    title: "Accordion + peek",
    hint: "1 user · product thumb in trigger",
    users: 1,
    Component: VariantAccordionPeek,
  },
  {
    id: "5",
    title: "ListGroup suffix",
    hint: "1 user · product as ItemSuffix",
    users: 1,
    Component: VariantListGroupSuffix,
  },
  {
    id: "6",
    title: "2-user cards",
    hint: "1 row · 2 Card covers side by side",
    users: 2,
    Component: VariantCardCoverPair,
  },
  {
    id: "7",
    title: "Badge row",
    hint: "1 user · Badge count + product",
    users: 1,
    Component: VariantBadgeRow,
  },
  {
    id: "8",
    title: "Timeline",
    hint: "1 user · Timeline + product",
    users: 1,
    Component: VariantTimeline,
  },
  {
    id: "9",
    title: "2-user compact",
    hint: "1 row · 2 hunters · avatar + product",
    users: 2,
    Component: VariantCompactPair,
  },
  {
    id: "10",
    title: "Stacked columns",
    hint: "1 user · avatar column + product",
    users: 1,
    Component: VariantStackedColumns,
  },
];

function pickSample(
  feeds: CommunityHunterFeed[],
  count: 1 | 2,
  offset: number,
): CommunityHunterFeed[] {
  if (feeds.length === 0) return [];
  const out: CommunityHunterFeed[] = [];
  for (let i = 0; i < count; i++) {
    out.push(feeds[(offset + i) % feeds.length]!);
  }
  return out;
}

export function CommunityHunterFeedVariantsGallery({
  feeds,
  onPressListing,
  onPressHunter,
}: VariantFeedProps): JSX.Element {
  return (
    <View>
      {COMMUNITY_FEED_VARIANTS.map(({ id, title, hint, users, Component }, index) => (
        <Section key={id} id={id} title={title} hint={hint}>
          <Component
            feeds={pickSample(feeds, users, index)}
            onPressListing={onPressListing}
            onPressHunter={onPressHunter}
          />
        </Section>
      ))}
    </View>
  );
}
