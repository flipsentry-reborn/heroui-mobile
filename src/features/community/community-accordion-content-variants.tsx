import { Image } from "expo-image";
import type { JSX, ReactNode } from "react";
import { ScrollView, View } from "react-native";
import {
  Accordion,
  Button,
  Chip,
  PressableFeedback,
  Separator,
  Surface,
  Typography,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { CommunityHunterAvatar } from "@/features/community/community-hunter-avatar";
import {
  formatDaysAgo,
  type CommunityHunterFeed,
} from "@/mocks/services/community";

const StyledImage = withUniwind(Image);

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

type ContentProps = {
  feed: CommunityHunterFeed;
  onPressListing: (id: string) => void;
  onPressHunter: (id: string) => void;
};

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
    <View className="mb-7">
      <View className="mb-2 px-3">
        <Typography type="body-sm" weight="semibold">
          A{id}. {title}
        </Typography>
        <Typography type="body-xs" className="text-muted">
          {hint}
        </Typography>
      </View>
      {children}
    </View>
  );
}

function CardShell({
  feed,
  onPressListing,
  onPressHunter,
  defaultExpanded = true,
  children,
}: ContentProps & {
  defaultExpanded?: boolean;
  children: ReactNode;
}): JSX.Element | null {
  const row = feed.clicks[0];
  if (!row) return null;
  const { hunter } = feed;
  const imageUrl =
    row.feedItem.images.imageUrlHostedByUs ||
    row.feedItem.images.mainImageUrl.imageUrl;

  return (
    <Surface className="mx-3 overflow-hidden rounded-2xl p-0">
      <Accordion
        selectionMode="single"
        variant="default"
        hideSeparator
        defaultValue={defaultExpanded ? `${hunter.id}-a` : undefined}
      >
        <Accordion.Item value={`${hunter.id}-a`}>
          <View className="flex-row">
            <PressableFeedback
              onPress={() => onPressListing(row.feedItem.id)}
              className="w-[38%]"
            >
              <StyledImage
                source={{ uri: imageUrl }}
                className="h-[108px] w-full bg-surface-secondary"
                contentFit="cover"
              />
            </PressableFeedback>
            <View className="w-[62%] justify-between gap-1 px-2.5 py-2">
              <PressableFeedback onPress={() => onPressHunter(hunter.id)}>
                <View className="flex-row items-center gap-1.5">
                  <CommunityHunterAvatar hunter={hunter} size="sm" />
                  <View className="min-w-0 flex-1">
                    <Typography type="body-xs" weight="semibold" numberOfLines={1}>
                      {hunter.displayName}
                    </Typography>
                    <Typography
                      type="body-xs"
                      className="text-[11px] text-muted"
                      numberOfLines={1}
                    >
                      @{hunter.handle}
                    </Typography>
                  </View>
                </View>
              </PressableFeedback>
              <PressableFeedback onPress={() => onPressListing(row.feedItem.id)}>
                <Typography type="body-xs" numberOfLines={1}>
                  {row.feedItem.title}
                </Typography>
                <Typography type="body-xs" className="text-[11px] text-muted">
                  {formatPrice(row.feedItem.price, row.feedItem.currencySymbol)}
                  {" · "}
                  {formatDaysAgo(row.event.daysAgo)}
                </Typography>
              </PressableFeedback>
              <Accordion.Trigger className="items-center gap-1 py-0">
                <Typography
                  type="body-xs"
                  className="min-w-0 flex-1 text-[11px] text-muted"
                  numberOfLines={1}
                >
                  {hunter.lastOnlineLabel}
                </Typography>
                <Accordion.Indicator />
              </Accordion.Trigger>
            </View>
          </View>
          <Accordion.Content className="px-3 pb-2 pt-0.5">
            {children}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </Surface>
  );
}

function Panel({ children }: { children: ReactNode }): JSX.Element {
  return (
    <View className="gap-1.5 rounded-xl bg-surface-secondary/60 px-2 py-2">
      {children}
    </View>
  );
}

function SeeProfile({
  onPress,
}: {
  onPress: () => void;
}): JSX.Element {
  return (
    <Button variant="primary" size="sm" className="h-7 rounded-2xl" onPress={onPress}>
      See profile
    </Button>
  );
}

/** A1 — Chips + Yesterday + Focus (no Visible) */
function A1({ feed, onPressListing, onPressHunter }: ContentProps): JSX.Element | null {
  const { hunter } = feed;
  return (
    <CardShell
      feed={feed}
      onPressListing={onPressListing}
      onPressHunter={onPressHunter}
    >
      <Panel>
        <View className="flex-row flex-wrap gap-1">
          <Chip size="sm" variant="soft" className="h-5 px-1.5">
            <Chip.Label className="text-[10px]">{hunter.city}</Chip.Label>
          </Chip>
          <Chip size="sm" variant="soft" color="accent" className="h-5 px-1.5">
            <Chip.Label className="text-[10px]">{hunter.huntsFocus}</Chip.Label>
          </Chip>
          <Chip size="sm" variant="secondary" className="h-5 px-1.5">
            <Chip.Label className="text-[10px]">Since {hunter.memberSince}</Chip.Label>
          </Chip>
        </View>
        <View className="flex-row gap-1">
          <MiniStat label="Yesterday" value={String(hunter.clicksYesterday)} />
          <MiniStat label="Focus" value={hunter.huntsFocus} />
        </View>
        <SeeProfile onPress={() => onPressHunter(hunter.id)} />
      </Panel>
    </CardShell>
  );
}

/** A2 — Chips only + CTA */
function A2({ feed, onPressListing, onPressHunter }: ContentProps): JSX.Element | null {
  const { hunter } = feed;
  return (
    <CardShell
      feed={feed}
      onPressListing={onPressListing}
      onPressHunter={onPressHunter}
    >
      <Panel>
        <View className="flex-row flex-wrap gap-1">
          <Chip size="sm" variant="soft" className="h-5 px-1.5">
            <Chip.Label className="text-[10px]">{hunter.city}</Chip.Label>
          </Chip>
          <Chip size="sm" variant="soft" color="accent" className="h-5 px-1.5">
            <Chip.Label className="text-[10px]">{hunter.huntsFocus}</Chip.Label>
          </Chip>
          <Chip size="sm" variant="secondary" className="h-5 px-1.5">
            <Chip.Label className="text-[10px]">Since {hunter.memberSince}</Chip.Label>
          </Chip>
          <Chip size="sm" variant="secondary" className="h-5 px-1.5">
            <Chip.Label className="text-[10px]">
              {hunter.clicksYesterday} yesterday
            </Chip.Label>
          </Chip>
        </View>
        <SeeProfile onPress={() => onPressHunter(hunter.id)} />
      </Panel>
    </CardShell>
  );
}

/** A3 — 3 KPI columns */
function A3({ feed, onPressListing, onPressHunter }: ContentProps): JSX.Element | null {
  const { hunter } = feed;
  return (
    <CardShell
      feed={feed}
      onPressListing={onPressListing}
      onPressHunter={onPressHunter}
    >
      <Panel>
        <View className="flex-row gap-1">
          <Kpi label="Clicks" value={String(hunter.clicksYesterday)} />
          <Kpi label="Since" value={hunter.memberSince} />
          <Kpi label="City" value={hunter.city.split(",")[0] ?? hunter.city} />
        </View>
        <SeeProfile onPress={() => onPressHunter(hunter.id)} />
      </Panel>
    </CardShell>
  );
}

/** A4 — One-liner bio + CTA */
function A4({ feed, onPressListing, onPressHunter }: ContentProps): JSX.Element | null {
  const { hunter } = feed;
  return (
    <CardShell
      feed={feed}
      onPressListing={onPressListing}
      onPressHunter={onPressHunter}
    >
      <Panel>
        <Typography type="body-xs" className="text-[11px] text-muted">
          Hunts {hunter.huntsFocus.toLowerCase()} from {hunter.city}. Active
          since {hunter.memberSince} · {hunter.clicksYesterday} clicks yesterday.
        </Typography>
        <SeeProfile onPress={() => onPressHunter(hunter.id)} />
      </Panel>
    </CardShell>
  );
}

/** A5 — Recent listing thumbs */
function A5({
  feed,
  onPressListing,
  onPressHunter,
}: ContentProps): JSX.Element | null {
  const { hunter, clicks } = feed;
  const thumbs = clicks.slice(0, 3);
  return (
    <CardShell
      feed={feed}
      onPressListing={onPressListing}
      onPressHunter={onPressHunter}
    >
      <Panel>
        <Typography type="body-xs" className="text-[10px] text-muted">
          Recent clicks
        </Typography>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-1.5"
        >
          {thumbs.map((r) => (
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
                className="h-12 w-12 rounded-lg bg-surface"
                contentFit="cover"
              />
            </PressableFeedback>
          ))}
        </ScrollView>
        <SeeProfile onPress={() => onPressHunter(hunter.id)} />
      </Panel>
    </CardShell>
  );
}

/** A6 — Dual actions */
function A6({
  feed,
  onPressListing,
  onPressHunter,
}: ContentProps): JSX.Element | null {
  const row = feed.clicks[0];
  if (!row) return null;
  return (
    <CardShell
      feed={feed}
      onPressListing={onPressListing}
      onPressHunter={onPressHunter}
    >
      <Panel>
        <Typography type="body-xs" className="text-[11px] text-muted">
          {feed.hunter.huntsFocus} · {feed.hunter.city}
        </Typography>
        <View className="flex-row gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            className="h-7 flex-1 rounded-2xl"
            onPress={() => onPressListing(row.feedItem.id)}
          >
            View listing
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="h-7 flex-1 rounded-2xl"
            onPress={() => onPressHunter(feed.hunter.id)}
          >
            See profile
          </Button>
        </View>
      </Panel>
    </CardShell>
  );
}

/** A7 — Clean meta list */
function A7({ feed, onPressListing, onPressHunter }: ContentProps): JSX.Element | null {
  const { hunter } = feed;
  return (
    <CardShell
      feed={feed}
      onPressListing={onPressListing}
      onPressHunter={onPressHunter}
    >
      <Panel>
        <MetaLine label="City" value={hunter.city} />
        <Separator className="bg-border/40" />
        <MetaLine label="Focus" value={hunter.huntsFocus} />
        <Separator className="bg-border/40" />
        <MetaLine label="Member" value={hunter.memberSince} />
        <Separator className="bg-border/40" />
        <MetaLine label="Yesterday" value={`${hunter.clicksYesterday} clicks`} />
        <SeeProfile onPress={() => onPressHunter(hunter.id)} />
      </Panel>
    </CardShell>
  );
}

/** A8 — Centered identity */
function A8({ feed, onPressListing, onPressHunter }: ContentProps): JSX.Element | null {
  const { hunter } = feed;
  return (
    <CardShell
      feed={feed}
      onPressListing={onPressListing}
      onPressHunter={onPressHunter}
    >
      <Panel>
        <View className="items-center gap-1 py-1">
          <CommunityHunterAvatar hunter={hunter} size="md" />
          <Typography type="body-xs" weight="semibold">
            {hunter.displayName}
          </Typography>
          <Typography type="body-xs" className="text-[10px] text-muted">
            {hunter.huntsFocus} · since {hunter.memberSince}
          </Typography>
        </View>
        <SeeProfile onPress={() => onPressHunter(hunter.id)} />
      </Panel>
    </CardShell>
  );
}

/** A9 — Activity intensity bar */
function A9({ feed, onPressListing, onPressHunter }: ContentProps): JSX.Element | null {
  const { hunter } = feed;
  const pct = Math.min(100, hunter.clicksYesterday * 9);
  return (
    <CardShell
      feed={feed}
      onPressListing={onPressListing}
      onPressHunter={onPressHunter}
    >
      <Panel>
        <View className="flex-row items-center justify-between">
          <Typography type="body-xs" className="text-[10px] text-muted">
            Hunt intensity
          </Typography>
          <Typography type="body-xs" weight="semibold">
            {hunter.clicksYesterday} yesterday
          </Typography>
        </View>
        <View className="h-1.5 overflow-hidden rounded-full bg-surface">
          <View
            className="h-full rounded-full bg-accent"
            // Dynamic fill width — Uniwind can't express runtime %
            style={{ width: `${pct}%` }}
          />
        </View>
        <Typography type="body-xs" className="text-[10px] text-muted">
          {hunter.huntsFocus} · {hunter.city}
        </Typography>
        <SeeProfile onPress={() => onPressHunter(hunter.id)} />
      </Panel>
    </CardShell>
  );
}

/** A10 — Hot streak + next tip */
function A10({ feed, onPressListing, onPressHunter }: ContentProps): JSX.Element | null {
  const { hunter } = feed;
  const hot = hunter.clicksYesterday >= 6;
  return (
    <CardShell
      feed={feed}
      onPressListing={onPressListing}
      onPressHunter={onPressHunter}
    >
      <Panel>
        <View className="flex-row items-center gap-1.5">
          <Chip
            size="sm"
            variant="soft"
            color={hot ? "success" : "default"}
            className="h-5 px-1.5"
          >
            <Chip.Label className="text-[10px]">
              {hot ? "Hot streak" : "Warming up"}
            </Chip.Label>
          </Chip>
          <Typography type="body-xs" className="flex-1 text-[10px] text-muted">
            {hunter.clicksYesterday} clicks yesterday
          </Typography>
        </View>
        <Typography type="body-xs" className="text-[11px]">
          Usually hunting {hunter.huntsFocus.toLowerCase()} in {hunter.city}.
        </Typography>
        <SeeProfile onPress={() => onPressHunter(hunter.id)} />
      </Panel>
    </CardShell>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}): JSX.Element {
  return (
    <View className="min-w-0 flex-1 flex-row items-center justify-between rounded-md bg-surface px-2 py-1">
      <Typography type="body-xs" className="text-[10px] text-muted">
        {label}
      </Typography>
      <Typography type="body-xs" weight="semibold" numberOfLines={1}>
        {value}
      </Typography>
    </View>
  );
}

function Kpi({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View className="min-w-0 flex-1 items-center rounded-md bg-surface px-1 py-1.5">
      <Typography type="body-xs" weight="semibold" numberOfLines={1}>
        {value}
      </Typography>
      <Typography type="body-xs" className="text-[10px] text-muted">
        {label}
      </Typography>
    </View>
  );
}

function MetaLine({
  label,
  value,
}: {
  label: string;
  value: string;
}): JSX.Element {
  return (
    <View className="flex-row items-center justify-between py-0.5">
      <Typography type="body-xs" className="text-[10px] text-muted">
        {label}
      </Typography>
      <Typography type="body-xs" weight="semibold" numberOfLines={1}>
        {value}
      </Typography>
    </View>
  );
}

const VARIANTS: {
  id: string;
  title: string;
  hint: string;
  Component: (p: ContentProps) => JSX.Element | null;
}[] = [
  {
    id: "1",
    title: "Chips + Yesterday / Focus",
    hint: "Visible kaldırıldı · Focus ikinci tile",
    Component: A1,
  },
  {
    id: "2",
    title: "Chips only",
    hint: "Sadece chip’ler + See profile",
    Component: A2,
  },
  {
    id: "3",
    title: "3 KPI columns",
    hint: "Clicks / Since / City",
    Component: A3,
  },
  {
    id: "4",
    title: "Bio one-liner",
    hint: "Tek cümle özet + CTA",
    Component: A4,
  },
  {
    id: "5",
    title: "Recent thumbs",
    hint: "Son tıklanan listing görselleri",
    Component: A5,
  },
  {
    id: "6",
    title: "Dual actions",
    hint: "View listing + See profile",
    Component: A6,
  },
  {
    id: "7",
    title: "Meta list",
    hint: "City / Focus / Member satırları",
    Component: A7,
  },
  {
    id: "8",
    title: "Centered identity",
    hint: "Avatar + isim ortalı",
    Component: A8,
  },
  {
    id: "9",
    title: "Intensity bar",
    hint: "Hunt intensity progress",
    Component: A9,
  },
  {
    id: "10",
    title: "Hot streak",
    hint: "Streak chip + kısa not",
    Component: A10,
  },
];

export function CommunityAccordionContentVariantsGallery({
  feed,
  onPressListing,
  onPressHunter,
}: ContentProps): JSX.Element {
  return (
    <View>
      {VARIANTS.map(({ id, title, hint, Component }) => (
        <Section key={id} id={id} title={title} hint={hint}>
          <Component
            feed={feed}
            onPressListing={onPressListing}
            onPressHunter={onPressHunter}
          />
        </Section>
      ))}
    </View>
  );
}
