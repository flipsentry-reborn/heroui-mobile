import { Image } from "expo-image";
import type { JSX } from "react";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Button,
  Chip,
  PressableFeedback,
  Separator,
  Surface,
  Tabs,
  Typography,
} from "heroui-native";
import {
  ProgressCircle,
  Rating,
  TrendChip,
} from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { CommunityHunterAvatar } from "@/features/community/community-hunter-avatar";
import {
  formatDaysAgo,
  type CommunityHunterFeed,
} from "@/mocks/services/community";

const StyledImage = withUniwind(Image);

export type Wave2FeedProps = {
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

function clickHeat(feed: CommunityHunterFeed): number {
  return Math.min(5, Math.max(1, feed.hunter.clicksYesterday / 2));
}

function progressPct(feed: CommunityHunterFeed): number {
  return Math.min(100, feed.hunter.clicksYesterday * 9);
}

/** V21 — Progress dial with product as center label */
function VariantProgressDial({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  const row = feed ? latest(feed) : null;
  if (!feed || !row) return <View />;

  return (
    <View className="items-center gap-3 px-3 py-2">
      <PressableFeedback onPress={() => onPressListing(row.feedItem.id)}>
        <ProgressCircle
          value={progressPct(feed)}
          color="accent"
          size={140}
          accessibilityLabel="Click intensity"
        >
          <ProgressCircle.Indicator strokeWidth={8} />
          <ProgressCircle.ValueLabel>
            <StyledImage
              source={{ uri: listingImage(feed) }}
              className="h-16 w-16 rounded-full"
              contentFit="cover"
            />
          </ProgressCircle.ValueLabel>
        </ProgressCircle>
      </PressableFeedback>
      <PressableFeedback
        onPress={() => onPressHunter(feed.hunter.id)}
        className="items-center gap-1"
      >
        <CommunityHunterAvatar hunter={feed.hunter} size="sm" />
        <Typography type="body-sm" weight="semibold">
          {feed.hunter.displayName}
        </Typography>
        <Typography type="body-xs" className="text-muted">
          intensity {progressPct(feed)}% · {formatDaysAgo(row.event.daysAgo)}
        </Typography>
      </PressableFeedback>
    </View>
  );
}

/** V22 — Hunter heat rating + product strip */
function VariantHeatRating({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  const row = feed ? latest(feed) : null;
  if (!feed || !row) return <View />;

  return (
    <Surface className="mx-3 gap-3 rounded-2xl p-3">
      <PressableFeedback
        onPress={() => onPressHunter(feed.hunter.id)}
        className="flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-2">
          <CommunityHunterAvatar hunter={feed.hunter} size="md" />
          <View>
            <Typography type="body-sm" weight="semibold">
              {feed.hunter.displayName}
            </Typography>
            <Typography type="body-xs" className="text-muted">
              hunt heat
            </Typography>
          </View>
        </View>
        <Rating isReadOnly value={clickHeat(feed)} />
      </PressableFeedback>
      <PressableFeedback
        onPress={() => onPressListing(row.feedItem.id)}
        className="overflow-hidden rounded-xl"
      >
        <StyledImage
          source={{ uri: listingImage(feed) }}
          className="h-24 w-full bg-surface-secondary"
          contentFit="cover"
        />
        <Typography type="body-xs" className="bg-surface-secondary px-2 py-1.5">
          {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
          {" · "}
          {row.feedItem.title}
        </Typography>
      </PressableFeedback>
    </Surface>
  );
}

/** V23 — Stock ticker row with TrendChip */
function VariantTicker({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  const row = feed ? latest(feed) : null;
  if (!feed || !row) return <View />;
  const trend =
    feed.hunter.clicksYesterday >= 6
      ? "up"
      : feed.hunter.clicksYesterday <= 2
        ? "down"
        : "neutral";

  return (
    <Surface className="mx-3 flex-row items-center gap-2 rounded-full py-2 pl-2 pr-3">
      <PressableFeedback onPress={() => onPressListing(row.feedItem.id)}>
        <StyledImage
          source={{ uri: listingImage(feed) }}
          className="h-12 w-12 rounded-full"
          contentFit="cover"
        />
      </PressableFeedback>
      <PressableFeedback
        onPress={() => onPressHunter(feed.hunter.id)}
        className="min-w-0 flex-1"
      >
        <Typography type="body-xs" className="font-mono text-muted" numberOfLines={1}>
          {feed.hunter.handle.toUpperCase()}
        </Typography>
        <Typography type="body-sm" weight="semibold" numberOfLines={1}>
          {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
        </Typography>
      </PressableFeedback>
      <TrendChip trend={trend} size="md">
        <TrendChip.Indicator />
        <TrendChip.Value>{feed.clicks.length}</TrendChip.Value>
        <TrendChip.Suffix>clk</TrendChip.Suffix>
      </TrendChip>
    </Surface>
  );
}

/** V25 — Receipt / ticket stub */
function VariantReceipt({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  const row = feed ? latest(feed) : null;
  if (!feed || !row) return <View />;

  return (
    <Surface className="mx-6 gap-2 rounded-sm px-4 py-3">
      <Typography type="body-xs" className="text-center font-mono text-muted">
        ★ COMMUNITY STUB ★
      </Typography>
      <Separator className="border-dashed bg-muted/40" />
      <PressableFeedback
        onPress={() => onPressHunter(feed.hunter.id)}
        className="flex-row items-center justify-between"
      >
        <Typography type="body-sm" className="font-mono">
          HUNTER
        </Typography>
        <Typography type="body-sm" weight="semibold" className="font-mono">
          {feed.hunter.handle}
        </Typography>
      </PressableFeedback>
      <PressableFeedback
        onPress={() => onPressListing(row.feedItem.id)}
        className="flex-row items-center gap-2"
      >
        <StyledImage
          source={{ uri: listingImage(feed) }}
          className="h-14 w-14 rounded-md"
          contentFit="cover"
        />
        <View className="min-w-0 flex-1">
          <Typography type="body-xs" className="font-mono" numberOfLines={2}>
            {row.feedItem.title}
          </Typography>
          <Typography type="body-sm" className="font-mono" weight="semibold">
            {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
          </Typography>
        </View>
      </PressableFeedback>
      <Separator className="border-dashed bg-muted/40" />
      <Typography type="body-xs" className="text-center font-mono text-muted">
        DELAY +24H · {formatDaysAgo(row.event.daysAgo).toUpperCase()}
      </Typography>
    </Surface>
  );
}

/** V26 — Film strip with sprocket holes */
function VariantFilmStrip({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  const row = feed ? latest(feed) : null;
  if (!feed || !row) return <View />;
  const frames = feed.clicks.slice(0, 3);

  return (
    <View className="bg-foreground px-1 py-2">
      <View className="mb-1 flex-row justify-between px-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} className="h-2 w-3 rounded-sm bg-background/40" />
        ))}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-2"
      >
        {frames.map((r) => (
          <PressableFeedback
            key={r.event.id}
            onPress={() => onPressListing(r.feedItem.id)}
          >
            <StyledImage
              source={{
                uri:
                  r.feedItem.images.imageUrlHostedByUs ||
                  r.feedItem.images.mainImageUrl.imageUrl,
              }}
              className="h-28 w-28 border border-background/30"
              contentFit="cover"
            />
          </PressableFeedback>
        ))}
      </ScrollView>
      <View className="mt-1 flex-row justify-between px-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} className="h-2 w-3 rounded-sm bg-background/40" />
        ))}
      </View>
      <PressableFeedback
        onPress={() => onPressHunter(feed.hunter.id)}
        className="mt-2 flex-row items-center justify-center gap-2"
      >
        <CommunityHunterAvatar hunter={feed.hunter} size="sm" />
        <Typography type="body-xs" className="text-background">
          {feed.hunter.displayName} · reel
        </Typography>
      </PressableFeedback>
    </View>
  );
}

/** V27 — Polaroid tilted photo */
function VariantPolaroid({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  const row = feed ? latest(feed) : null;
  if (!feed || !row) return <View />;

  return (
    <View className="items-center px-3 py-4">
      <PressableFeedback
        onPress={() => onPressListing(row.feedItem.id)}
        className="w-[70%] rotate-3 bg-surface p-2 shadow-surface"
      >
        <StyledImage
          source={{ uri: listingImage(feed) }}
          className="aspect-square w-full bg-surface-secondary"
          contentFit="cover"
        />
        <View className="mt-2 flex-row items-center gap-2 px-1 pb-1">
          <PressableFeedback onPress={() => onPressHunter(feed.hunter.id)}>
            <CommunityHunterAvatar hunter={feed.hunter} size="sm" />
          </PressableFeedback>
          <Typography type="body-xs" className="flex-1" numberOfLines={2}>
            {feed.hunter.displayName.split(" ")[0]} found this ·{" "}
            {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
          </Typography>
        </View>
      </PressableFeedback>
    </View>
  );
}

/** V28 — Mosaic: 1 large + 2 small from same hunter */
function VariantMosaic({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  if (!feed || feed.clicks.length === 0) return <View />;
  const [main, a, b] = feed.clicks;

  return (
    <View className="gap-2 px-3">
      <PressableFeedback
        onPress={() => onPressHunter(feed.hunter.id)}
        className="flex-row items-center gap-2"
      >
        <CommunityHunterAvatar hunter={feed.hunter} size="sm" />
        <Typography type="body-sm" weight="semibold">
          {feed.hunter.displayName}
        </Typography>
        <Typography type="body-xs" className="text-muted">
          mosaic
        </Typography>
      </PressableFeedback>
      <View className="h-40 flex-row gap-1.5">
        <PressableFeedback
          onPress={() => onPressListing(main.feedItem.id)}
          className="flex-[2] overflow-hidden rounded-xl"
        >
          <StyledImage
            source={{
              uri:
                main.feedItem.images.imageUrlHostedByUs ||
                main.feedItem.images.mainImageUrl.imageUrl,
            }}
            className="h-full w-full bg-surface-secondary"
            contentFit="cover"
          />
        </PressableFeedback>
        <View className="flex-1 gap-1.5">
          {[a, b].filter(Boolean).map((r) => (
            <PressableFeedback
              key={r.event.id}
              onPress={() => onPressListing(r.feedItem.id)}
              className="flex-1 overflow-hidden rounded-xl"
            >
              <StyledImage
                source={{
                  uri:
                    r.feedItem.images.imageUrlHostedByUs ||
                    r.feedItem.images.mainImageUrl.imageUrl,
                }}
                className="h-full w-full bg-surface-secondary"
                contentFit="cover"
              />
            </PressableFeedback>
          ))}
          {!a ? (
            <View className="flex-1 items-center justify-center rounded-xl bg-surface-secondary">
              <Typography type="body-xs" className="text-muted">
                +
              </Typography>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/** V29 — Full-bleed inverted banner */
function VariantInvertBanner({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  const row = feed ? latest(feed) : null;
  if (!feed || !row) return <View />;

  return (
    <View className="mx-3 overflow-hidden rounded-2xl bg-accent">
      <View className="flex-row">
        <PressableFeedback
          onPress={() => onPressHunter(feed.hunter.id)}
          className="min-w-0 flex-1 justify-center gap-1 p-4"
        >
          <Typography type="body-xs" className="text-accent-foreground/70">
            SIGNAL
          </Typography>
          <Typography
            type="body"
            weight="semibold"
            className="text-accent-foreground"
            numberOfLines={1}
          >
            {feed.hunter.displayName}
          </Typography>
          <Typography type="body-xs" className="text-accent-foreground/80">
            {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
            {" · "}
            {formatDaysAgo(row.event.daysAgo)}
          </Typography>
        </PressableFeedback>
        <PressableFeedback
          onPress={() => onPressListing(row.feedItem.id)}
          className="w-28"
        >
          <StyledImage
            source={{ uri: listingImage(feed) }}
            className="h-28 w-full"
            contentFit="cover"
          />
        </PressableFeedback>
      </View>
    </View>
  );
}

/** V30 — Inner Tabs: Deal | Hunter */
function VariantInnerTabs({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  const row = feed ? latest(feed) : null;
  const [tab, setTab] = useState("deal");
  if (!feed || !row) return <View />;

  return (
    <Surface className="mx-3 overflow-hidden rounded-2xl p-0">
      <Tabs value={tab} onValueChange={setTab} variant="secondary" className="w-full">
        <Tabs.List className="w-full flex-row">
          <Tabs.Indicator />
          <Tabs.Trigger value="deal" className="flex-1 items-center py-2.5">
            {({ isSelected }) => (
              <Tabs.Label className={isSelected ? "font-semibold" : "text-muted"}>
                Deal
              </Tabs.Label>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="hunter" className="flex-1 items-center py-2.5">
            {({ isSelected }) => (
              <Tabs.Label className={isSelected ? "font-semibold" : "text-muted"}>
                Hunter
              </Tabs.Label>
            )}
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs>
      {tab === "deal" ? (
        <PressableFeedback
          onPress={() => onPressListing(row.feedItem.id)}
          className="gap-2 p-3"
        >
          <StyledImage
            source={{ uri: listingImage(feed) }}
            className="h-32 w-full rounded-xl"
            contentFit="cover"
          />
          <Typography type="body-sm" numberOfLines={2}>
            {row.feedItem.title}
          </Typography>
          <Typography type="body-xs" weight="semibold">
            {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
          </Typography>
        </PressableFeedback>
      ) : (
        <PressableFeedback
          onPress={() => onPressHunter(feed.hunter.id)}
          className="items-center gap-2 p-5"
        >
          <CommunityHunterAvatar hunter={feed.hunter} size="lg" />
          <Typography type="body" weight="semibold">
            {feed.hunter.displayName}
          </Typography>
          <Typography type="body-xs" className="text-muted">
            @{feed.hunter.handle} · {feed.hunter.city}
          </Typography>
          <Button size="sm" variant="secondary">
            See all ({feed.clicks.length})
          </Button>
        </PressableFeedback>
      )}
    </Surface>
  );
}

/** V31 — Dual progress dials (2 users) */
function VariantDualDials({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  return (
    <View className="flex-row gap-2 px-3">
      {feeds.map((feed) => {
        const row = latest(feed);
        if (!row) return null;
        return (
          <PressableFeedback
            key={feed.hunter.id}
            onPress={() => onPressListing(row.feedItem.id)}
            className="min-w-0 flex-1 items-center gap-2 rounded-2xl bg-surface py-3"
          >
            <ProgressCircle
              value={progressPct(feed)}
              color="accent"
              size={72}
              accessibilityLabel="clicks"
            >
              <ProgressCircle.Indicator strokeWidth={5} />
              <ProgressCircle.ValueLabel>
                <Typography type="body-xs" weight="semibold">
                  {feed.clicks.length}
                </Typography>
              </ProgressCircle.ValueLabel>
            </ProgressCircle>
            <PressableFeedback onPress={() => onPressHunter(feed.hunter.id)}>
              <Typography type="body-xs" weight="semibold" numberOfLines={1}>
                {feed.hunter.displayName.split(" ")[0]}
              </Typography>
            </PressableFeedback>
            <StyledImage
              source={{ uri: listingImage(feed) }}
              className="h-14 w-14 rounded-lg"
              contentFit="cover"
            />
          </PressableFeedback>
        );
      })}
    </View>
  );
}

/** V32 — Cascading Z-stack of product cards */
function VariantZStack({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  if (!feed) return <View />;
  const stack = feed.clicks.slice(0, 3);

  return (
    <View className="px-3 pb-2 pt-1">
      <PressableFeedback
        onPress={() => onPressHunter(feed.hunter.id)}
        className="mb-3 flex-row items-center gap-2"
      >
        <CommunityHunterAvatar hunter={feed.hunter} size="sm" />
        <Typography type="body-sm" weight="semibold">
          {feed.hunter.displayName}
        </Typography>
        <Typography type="body-xs" className="text-muted">
          stack
        </Typography>
      </PressableFeedback>
      <View className="h-36">
        {stack.map((r, i) => {
          const offset =
            i === 0
              ? "left-0 top-0 z-30 w-[82%]"
              : i === 1
                ? "left-5 top-2.5 z-20 w-[82%]"
                : "left-10 top-5 z-10 w-[82%]";
          return (
            <PressableFeedback
              key={r.event.id}
              onPress={() => onPressListing(r.feedItem.id)}
              className={`absolute overflow-hidden rounded-xl border border-border bg-surface shadow-surface ${offset}`}
            >
              <View className="flex-row">
                <StyledImage
                  source={{
                    uri:
                      r.feedItem.images.imageUrlHostedByUs ||
                      r.feedItem.images.mainImageUrl.imageUrl,
                  }}
                  className="h-24 w-24"
                  contentFit="cover"
                />
                <View className="flex-1 justify-center px-2">
                  <Typography type="body-xs" numberOfLines={2}>
                    {r.feedItem.title}
                  </Typography>
                  <Typography type="body-xs" weight="semibold">
                    {formatPrice(r.feedItem.price, r.feedItem.currencySymbol)}
                  </Typography>
                </View>
              </View>
            </PressableFeedback>
          );
        })}
      </View>
    </View>
  );
}

/** V33 — Map-pin silhouette over product */
function VariantMapPin({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  const row = feed ? latest(feed) : null;
  if (!feed || !row) return <View />;

  return (
    <View className="items-center gap-2 px-3 py-2">
      <PressableFeedback
        onPress={() => onPressListing(row.feedItem.id)}
        className="items-center"
      >
        <View className="h-36 w-28 overflow-hidden rounded-full rounded-b-none border-4 border-accent">
          <StyledImage
            source={{ uri: listingImage(feed) }}
            className="h-full w-full"
            contentFit="cover"
          />
        </View>
        <View className="-mt-1 h-0 w-0 border-l-[14px] border-r-[14px] border-t-[22px] border-l-transparent border-r-transparent border-t-accent" />
      </PressableFeedback>
      <PressableFeedback
        onPress={() => onPressHunter(feed.hunter.id)}
        className="items-center"
      >
        <Typography type="body-sm" weight="semibold">
          {feed.hunter.displayName}
        </Typography>
        <Typography type="body-xs" className="text-muted">
          {feed.hunter.distanceMiles != null
            ? `${feed.hunter.distanceMiles} mi away`
            : feed.hunter.city}
          {" · "}
          {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
        </Typography>
      </PressableFeedback>
    </View>
  );
}

/** V34 — Pulse / morse dots intensity */
function VariantPulseDots({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  const row = feed ? latest(feed) : null;
  if (!feed || !row) return <View />;
  const dots = Math.min(12, Math.max(2, feed.hunter.clicksYesterday));

  return (
    <Surface className="mx-3 gap-3 rounded-2xl p-3">
      <View className="flex-row flex-wrap items-center gap-1.5">
        {Array.from({ length: dots }).map((_, i) => (
          <View
            key={i}
            className={`rounded-full bg-accent ${i % 3 === 0 ? "h-3 w-6" : "h-3 w-3"}`}
          />
        ))}
      </View>
      <View className="flex-row items-center gap-3">
        <PressableFeedback onPress={() => onPressHunter(feed.hunter.id)}>
          <CommunityHunterAvatar hunter={feed.hunter} size="md" />
        </PressableFeedback>
        <PressableFeedback
          onPress={() => onPressListing(row.feedItem.id)}
          className="min-w-0 flex-1 flex-row items-center gap-2"
        >
          <StyledImage
            source={{ uri: listingImage(feed) }}
            className="h-16 w-16 rounded-xl"
            contentFit="cover"
          />
          <View className="min-w-0 flex-1">
            <Typography type="body-sm" weight="semibold" numberOfLines={1}>
              {feed.hunter.displayName}
            </Typography>
            <Typography type="body-xs" className="text-muted" numberOfLines={2}>
              pulse {dots} · {row.feedItem.title}
            </Typography>
          </View>
        </PressableFeedback>
      </View>
    </Surface>
  );
}

/** V35 — Monospace terminal dump */
function VariantTerminal({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  const row = feed ? latest(feed) : null;
  if (!feed || !row) return <View />;

  return (
    <View className="mx-3 overflow-hidden rounded-xl border border-muted/40 bg-background">
      <View className="flex-row gap-1.5 bg-surface px-3 py-2">
        <View className="h-2.5 w-2.5 rounded-full bg-danger" />
        <View className="h-2.5 w-2.5 rounded-full bg-warning" />
        <View className="h-2.5 w-2.5 rounded-full bg-success" />
        <Typography type="body-xs" className="ml-2 font-mono text-muted">
          activity.log
        </Typography>
      </View>
      <PressableFeedback onPress={() => onPressHunter(feed.hunter.id)} className="gap-0.5 px-3 pt-3">
        <Typography type="body-xs" className="font-mono text-success">
          {">"} hunter --id {feed.hunter.handle}
        </Typography>
        <Typography type="body-xs" className="font-mono text-muted">
          city: {feed.hunter.city}
        </Typography>
        <Typography type="body-xs" className="font-mono text-muted">
          clicks: {feed.clicks.length} · delay: 24h
        </Typography>
      </PressableFeedback>
      <PressableFeedback
        onPress={() => onPressListing(row.feedItem.id)}
        className="flex-row items-center gap-2 px-3 py-3"
      >
        <Typography type="body-xs" className="font-mono text-accent">
          {">"} open
        </Typography>
        <StyledImage
          source={{ uri: listingImage(feed) }}
          className="h-10 w-10 rounded"
          contentFit="cover"
        />
        <Typography type="body-xs" className="flex-1 font-mono" numberOfLines={1}>
          {row.feedItem.title}
        </Typography>
      </PressableFeedback>
    </View>
  );
}

/** V36 — Stair cascade (offset steps) */
function VariantStairs({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  if (!feed) return <View />;
  const steps = feed.clicks.slice(0, 3);

  return (
    <View className="gap-1 px-3">
      <PressableFeedback
        onPress={() => onPressHunter(feed.hunter.id)}
        className="mb-1 flex-row items-center gap-2"
      >
        <CommunityHunterAvatar hunter={feed.hunter} size="sm" />
        <Typography type="body-sm" weight="semibold">
          {feed.hunter.displayName}
        </Typography>
      </PressableFeedback>
      {steps.map((r, i) => (
        <PressableFeedback
          key={r.event.id}
          onPress={() => onPressListing(r.feedItem.id)}
          className={`flex-row items-center gap-2 rounded-xl bg-surface py-2 pr-2 ${
            i === 0 ? "ml-0" : i === 1 ? "ml-7" : "ml-14"
          }`}
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
          <Typography type="body-xs" className="flex-1" numberOfLines={1}>
            {formatPrice(r.feedItem.price, r.feedItem.currencySymbol)} · step {i + 1}
          </Typography>
        </PressableFeedback>
      ))}
    </View>
  );
}

/** V37 — Asymmetric bento (2 users, uneven) */
function VariantBentoAsym({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const a = feeds[0];
  const b = feeds[1];
  if (!a || !b) return <View />;
  const rowA = latest(a);
  const rowB = latest(b);
  if (!rowA || !rowB) return <View />;

  return (
    <View className="h-44 flex-row gap-2 px-3">
      <PressableFeedback
        onPress={() => onPressListing(rowA.feedItem.id)}
        className="flex-[3] overflow-hidden rounded-2xl"
      >
        <StyledImage
          source={{ uri: listingImage(a) }}
          className="h-full w-full"
          contentFit="cover"
        />
        <View className="absolute bottom-0 left-0 right-0 bg-background/75 px-2 py-1.5">
          <PressableFeedback onPress={() => onPressHunter(a.hunter.id)}>
            <Typography type="body-xs" weight="semibold" className="text-foreground">
              {a.hunter.displayName.split(" ")[0]}
            </Typography>
          </PressableFeedback>
        </View>
      </PressableFeedback>
      <PressableFeedback
        onPress={() => onPressListing(rowB.feedItem.id)}
        className="flex-[2] overflow-hidden rounded-2xl"
      >
        <StyledImage
          source={{ uri: listingImage(b) }}
          className="h-full w-full"
          contentFit="cover"
        />
        <View className="absolute bottom-0 left-0 right-0 bg-background/75 px-2 py-1.5">
          <PressableFeedback onPress={() => onPressHunter(b.hunter.id)}>
            <Typography type="body-xs" weight="semibold">
              {b.hunter.displayName.split(" ")[0]}
            </Typography>
          </PressableFeedback>
        </View>
      </PressableFeedback>
    </View>
  );
}

/** V38 — Vertical typographic poster */
function VariantPosterType({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  const row = feed ? latest(feed) : null;
  if (!feed || !row) return <View />;
  const name = feed.hunter.displayName.split(" ")[0] ?? "?";

  return (
    <PressableFeedback
      onPress={() => onPressListing(row.feedItem.id)}
      className="mx-3 overflow-hidden rounded-2xl"
    >
      <StyledImage
        source={{ uri: listingImage(feed) }}
        className="h-52 w-full"
        contentFit="cover"
      />
      <View className="absolute inset-0 justify-between bg-background/35 p-4">
        <Typography
          type="body"
          weight="semibold"
          className="text-5xl leading-none text-foreground"
        >
          {name.slice(0, 1)}
        </Typography>
        <View>
          <PressableFeedback onPress={() => onPressHunter(feed.hunter.id)}>
            <Typography type="body" weight="semibold" className="text-foreground">
              {feed.hunter.displayName}
            </Typography>
          </PressableFeedback>
          <Typography type="body-xs" className="text-foreground">
            {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)} CLICKED
          </Typography>
        </View>
      </View>
    </PressableFeedback>
  );
}

/** V39 — Floating action strip + ghost product */
function VariantFabStrip({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  const row = feed ? latest(feed) : null;
  if (!feed || !row) return <View />;

  return (
    <View className="px-3">
      <PressableFeedback onPress={() => onPressListing(row.feedItem.id)}>
        <StyledImage
          source={{ uri: listingImage(feed) }}
          className="h-36 w-full rounded-2xl opacity-40"
          contentFit="cover"
        />
      </PressableFeedback>
      <View className="-mt-8 items-center">
        <Surface className="flex-row items-center gap-3 rounded-full px-3 py-2 shadow-surface">
          <PressableFeedback onPress={() => onPressHunter(feed.hunter.id)}>
            <CommunityHunterAvatar hunter={feed.hunter} size="md" />
          </PressableFeedback>
          <View className="min-w-0 flex-1">
            <Typography type="body-sm" weight="semibold" numberOfLines={1}>
              {feed.hunter.displayName}
            </Typography>
            <Typography type="body-xs" className="text-muted" numberOfLines={1}>
              {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
            </Typography>
          </View>
          <Button
            size="sm"
            variant="primary"
            onPress={() => onPressListing(row.feedItem.id)}
          >
            Open
          </Button>
        </Surface>
      </View>
    </View>
  );
}

/** V40 — Chip ladder + side product column (2 meta lanes) */
function VariantChipLadder({
  feeds,
  onPressListing,
  onPressHunter,
}: Wave2FeedProps): JSX.Element {
  const feed = feeds[0];
  const row = feed ? latest(feed) : null;
  if (!feed || !row) return <View />;

  const ladder = [
    feed.hunter.handle,
    feed.hunter.city.split(",")[0],
    `${feed.clicks.length} clicks`,
    formatDaysAgo(row.event.daysAgo),
    formatPrice(row.feedItem.price, row.feedItem.currencySymbol),
  ];

  return (
    <View className="flex-row gap-3 px-3">
      <View className="flex-1 justify-center gap-1.5">
        <PressableFeedback
          onPress={() => onPressHunter(feed.hunter.id)}
          className="mb-1 flex-row items-center gap-2"
        >
          <CommunityHunterAvatar hunter={feed.hunter} size="sm" />
          <Typography type="body-sm" weight="semibold" numberOfLines={1}>
            {feed.hunter.displayName}
          </Typography>
        </PressableFeedback>
        {ladder.map((label, i) => (
          <Chip
            key={`${label}-${i}`}
            size="sm"
            variant={i === ladder.length - 1 ? "primary" : "secondary"}
            className="self-start"
          >
            <Chip.Label>{label}</Chip.Label>
          </Chip>
        ))}
      </View>
      <PressableFeedback
        onPress={() => onPressListing(row.feedItem.id)}
        className="w-32 overflow-hidden rounded-2xl"
      >
        <StyledImage
          source={{ uri: listingImage(feed) }}
          className="h-48 w-full bg-surface-secondary"
          contentFit="cover"
        />
      </PressableFeedback>
    </View>
  );
}

export const COMMUNITY_FEED_VARIANTS_WAVE2: {
  id: string;
  title: string;
  hint: string;
  users: 1 | 2;
  Component: (props: Wave2FeedProps) => JSX.Element;
}[] = [
  {
    id: "21",
    title: "Progress dial",
    hint: "ProgressCircle · product in center",
    users: 1,
    Component: VariantProgressDial,
  },
  {
    id: "22",
    title: "Heat rating",
    hint: "Rating heat + product strip",
    users: 1,
    Component: VariantHeatRating,
  },
  {
    id: "23",
    title: "Stock ticker",
    hint: "TrendChip pill · market row",
    users: 1,
    Component: VariantTicker,
  },
  {
    id: "25",
    title: "Receipt stub",
    hint: "Monospace ticket / stub",
    users: 1,
    Component: VariantReceipt,
  },
  {
    id: "26",
    title: "Film strip",
    hint: "Cinema reel · sprocket frames",
    users: 1,
    Component: VariantFilmStrip,
  },
  {
    id: "27",
    title: "Polaroid",
    hint: "Tilted photo caption",
    users: 1,
    Component: VariantPolaroid,
  },
  {
    id: "28",
    title: "Mosaic 1+2",
    hint: "Asymmetric image mosaic",
    users: 1,
    Component: VariantMosaic,
  },
  {
    id: "29",
    title: "Invert banner",
    hint: "Full accent signal bar",
    users: 1,
    Component: VariantInvertBanner,
  },
  {
    id: "30",
    title: "Inner tabs",
    hint: "Tabs Deal | Hunter",
    users: 1,
    Component: VariantInnerTabs,
  },
  {
    id: "31",
    title: "Dual dials",
    hint: "1 row · 2 ProgressCircles",
    users: 2,
    Component: VariantDualDials,
  },
  {
    id: "32",
    title: "Z-stack",
    hint: "Overlapping card cascade",
    users: 1,
    Component: VariantZStack,
  },
  {
    id: "33",
    title: "Map pin",
    hint: "Pin silhouette over product",
    users: 1,
    Component: VariantMapPin,
  },
  {
    id: "34",
    title: "Pulse dots",
    hint: "Morse / intensity dots",
    users: 1,
    Component: VariantPulseDots,
  },
  {
    id: "35",
    title: "Terminal log",
    hint: "CLI dump aesthetic",
    users: 1,
    Component: VariantTerminal,
  },
  {
    id: "36",
    title: "Stair cascade",
    hint: "Offset step rows",
    users: 1,
    Component: VariantStairs,
  },
  {
    id: "37",
    title: "Bento asym",
    hint: "1 row · 2 users · uneven bento",
    users: 2,
    Component: VariantBentoAsym,
  },
  {
    id: "38",
    title: "Poster type",
    hint: "Editorial overlay poster",
    users: 1,
    Component: VariantPosterType,
  },
  {
    id: "39",
    title: "Ghost FAB strip",
    hint: "Faded product + floating chip bar",
    users: 1,
    Component: VariantFabStrip,
  },
  {
    id: "40",
    title: "Chip ladder",
    hint: "Meta chip stack + tall product",
    users: 1,
    Component: VariantChipLadder,
  },
];
