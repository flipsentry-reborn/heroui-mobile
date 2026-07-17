import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ComponentProps, JSX, ReactNode } from "react";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Accordion,
  Button,
  Chip,
  ListGroup,
  Menu,
  PressableFeedback,
  Separator,
  Switch,
  Typography,
} from "heroui-native";
import { Badge, Segment } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import PlatformIcon from "@/components/icons/PlatformIcon";
import { homeFixture, type SearchGroup } from "@/mocks/data/home";
import {
  cityFromLocation,
  formatIntervalLabel,
  formatPriceShort,
  groupStatus,
} from "@/mocks/services/home";

const StyledIonicons = withUniwind(Ionicons);

type IonName = ComponentProps<typeof Ionicons>["name"];
type TypeFilter = "all" | "custom" | "car" | "iphone";
type StatusFilter = "all" | "active" | "paused" | "partial";

const SAMPLE_IDS = ["g4", "g1", "g2"] as const;

function sampleGroups(): SearchGroup[] {
  return SAMPLE_IDS.map((id) => {
    const group = homeFixture.groups.find((g) => g.id === id);
    if (!group) throw new Error(`Missing sample group ${id}`);
    return structuredClone(group);
  });
}

function typeIcon(type: SearchGroup["searchType"]): IonName {
  if (type === "car") return "car-outline";
  if (type === "iphone") return "phone-portrait-outline";
  return "search-outline";
}

function groupTitle(group: SearchGroup): string {
  if (group.searchType === "custom") {
    return group.customLabel ?? "Custom search";
  }
  if (group.searchType === "iphone") {
    return group.customLabel ?? "iPhone";
  }
  const makes = group.carQuery?.makes ?? [];
  if (makes.length === 0) return "Vehicles";
  if (makes.length <= 2) return makes.join(", ");
  return `${makes.slice(0, 2).join(", ")} +${makes.length - 2}`;
}

function metaChips(group: SearchGroup): string[] {
  const chips = [
    cityFromLocation(group.locationName),
    `${group.radiusMiles} mi`,
  ];
  const q = group.carQuery;
  if (q) {
    if (q.minPrice != null || q.maxPrice != null) {
      chips.push(
        `${q.minPrice != null ? formatPriceShort(q.minPrice) : "Any"}–${
          q.maxPrice != null ? formatPriceShort(q.maxPrice) : "Any"
        }`,
      );
    }
    if (q.minYear != null || q.maxYear != null) {
      chips.push(`${q.minYear ?? "Any"}–${q.maxYear ?? "Any"}`);
    }
    if (q.minMileage != null || q.maxMileage != null) {
      const min =
        q.minMileage != null ? `${formatPriceShort(q.minMileage)} mi` : "Any";
      const max =
        q.maxMileage != null ? `${formatPriceShort(q.maxMileage)} mi` : "Any";
      chips.push(`${min}–${max}`);
    }
  }
  return chips;
}

function fastestInterval(group: SearchGroup): string {
  const min = Math.min(...group.settings.map((s) => s.runIntervalSeconds));
  return formatIntervalLabel(min);
}

function statusChipClass(tone: ReturnType<typeof groupStatus>["tone"]): string {
  if (tone === "success") return "bg-success/15";
  if (tone === "warning") return "bg-warning/15";
  return "bg-muted/20";
}

function statusLabelClass(
  tone: ReturnType<typeof groupStatus>["tone"],
): string {
  if (tone === "success") return "text-success";
  if (tone === "warning") return "text-warning";
  return "text-muted";
}

function filterByType(groups: SearchGroup[], filter: TypeFilter): SearchGroup[] {
  if (filter === "all") return groups;
  return groups.filter((g) => g.searchType === filter);
}

function filterByStatus(
  groups: SearchGroup[],
  filter: StatusFilter,
): SearchGroup[] {
  if (filter === "all") return groups;
  return groups.filter((g) => {
    const tone = groupStatus(g).tone;
    if (filter === "active") return tone === "success";
    if (filter === "paused") return tone === "muted";
    return tone === "warning";
  });
}

function TypeSegment({
  value,
  onValueChange,
}: {
  value: TypeFilter;
  onValueChange: (v: TypeFilter) => void;
}): JSX.Element {
  return (
    <Segment
      value={value}
      onValueChange={(next) => onValueChange(next as TypeFilter)}
    >
      <Segment.Group>
        <Segment.Indicator />
        <Segment.Item value="all">
          <Segment.Label>All</Segment.Label>
        </Segment.Item>
        <Segment.Item value="custom">
          <Segment.Label>Custom</Segment.Label>
        </Segment.Item>
        <Segment.Item value="car">
          <Segment.Label>Car</Segment.Label>
        </Segment.Item>
        <Segment.Item value="iphone">
          <Segment.Label>iPhone</Segment.Label>
        </Segment.Item>
      </Segment.Group>
    </Segment>
  );
}

function ExampleHeader({
  index,
  title,
  subtitle,
}: {
  index: number;
  title: string;
  subtitle: string;
}): JSX.Element {
  return (
    <View className="mb-3 gap-1 px-1">
      <Typography type="body-xs" className="text-muted">
        Accordion {index}
      </Typography>
      <Typography type="body" weight="semibold">
        {title}
      </Typography>
      <Typography type="body-xs" className="text-muted">
        {subtitle}
      </Typography>
    </View>
  );
}

function ExampleBlock({
  index,
  title,
  subtitle,
  children,
}: {
  index: number;
  title: string;
  subtitle: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <View className="mb-8">
      <ExampleHeader index={index} title={title} subtitle={subtitle} />
      <View className="gap-3">{children}</View>
    </View>
  );
}

function MetaChipRow({ group }: { group: SearchGroup }): JSX.Element {
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {metaChips(group).map((label) => (
        <Chip key={label} size="sm" variant="secondary">
          <Chip.Label className="text-[10px] text-muted">{label}</Chip.Label>
        </Chip>
      ))}
    </View>
  );
}

function PlatformRows({ group }: { group: SearchGroup }): JSX.Element {
  return (
    <View>
      {group.settings.map((setting, index) => (
        <View key={setting.id}>
          <View
            className={`flex-row items-center py-2 ${
              setting.isActive ? "opacity-100" : "opacity-50"
            }`}
          >
            <View className="mr-2.5 h-6 w-6 items-center justify-center">
              <PlatformIcon platform={setting.platform} size={18} />
            </View>
            <Typography type="body-sm" className="mr-2 flex-1" numberOfLines={1}>
              {cityFromLocation(setting.locationName)}
            </Typography>
            <Typography type="body-xs" className="mr-2 text-muted">
              {formatIntervalLabel(setting.runIntervalSeconds)}
            </Typography>
            <Badge
              color={setting.isActive ? "success" : "default"}
              size="sm"
            />
          </View>
          {index < group.settings.length - 1 ? (
            <Separator className="bg-muted/30" />
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** A1 — Baseline: Segment + Accordion + platform rows + Edit */
function AccordionBaseline({ groups }: { groups: SearchGroup[] }): JSX.Element {
  return (
    <Accordion selectionMode="multiple" variant="surface" className="gap-2">
      {groups.map((group) => {
        const status = groupStatus(group);
        return (
          <Accordion.Item key={group.id} value={group.id}>
            <Accordion.Trigger className="gap-2 px-3 py-3">
              <View className="min-w-0 flex-1 flex-row items-center gap-2">
                <StyledIonicons
                  name={typeIcon(group.searchType)}
                  size={18}
                  className="text-foreground"
                />
                <View className="min-w-0 flex-1">
                  <Typography type="body" numberOfLines={1}>
                    {groupTitle(group)}
                  </Typography>
                  <Typography
                    type="body-xs"
                    className="text-muted"
                    numberOfLines={1}
                  >
                    {cityFromLocation(group.locationName)} ·{" "}
                    {group.settings.length} searches
                  </Typography>
                </View>
                <Chip
                  size="sm"
                  variant="secondary"
                  className={statusChipClass(status.tone)}
                >
                  <Chip.Label
                    className={`text-[10px] ${statusLabelClass(status.tone)}`}
                  >
                    {status.label}
                  </Chip.Label>
                </Chip>
              </View>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
              <MetaChipRow group={group} />
              <PlatformRows group={group} />
              <Button size="sm" variant="secondary" className="mt-1 self-start">
                <Button.Label>Edit search</Button.Label>
              </Button>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

/** A2 — Segment + Accordion; platforms as ListGroup + per-row Switch + Menu */
function AccordionListGroup({
  groups,
}: {
  groups: SearchGroup[];
}): JSX.Element {
  const [settingsMap, setSettingsMap] = useState(() =>
    Object.fromEntries(
      groups.map((g) => [
        g.id,
        Object.fromEntries(g.settings.map((s) => [s.id, s.isActive])),
      ]),
    ),
  );

  return (
    <Accordion selectionMode="multiple" variant="surface" className="gap-2">
      {groups.map((group) => {
        const status = groupStatus(group);
        return (
          <Accordion.Item key={group.id} value={group.id}>
            <Accordion.Trigger className="gap-2 px-3 py-3">
              <View className="min-w-0 flex-1 flex-row items-center gap-2">
                <View className="min-w-0 flex-1">
                  <Typography type="body" numberOfLines={1}>
                    {groupTitle(group)}
                  </Typography>
                  <Typography type="body-xs" className="text-muted">
                    {group.settings.length} platforms ·{" "}
                    {cityFromLocation(group.locationName)}
                  </Typography>
                </View>
                <Chip
                  size="sm"
                  variant="secondary"
                  className={statusChipClass(status.tone)}
                >
                  <Chip.Label
                    className={`text-[10px] ${statusLabelClass(status.tone)}`}
                  >
                    {status.label}
                  </Chip.Label>
                </Chip>
              </View>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
              <MetaChipRow group={group} />
              <ListGroup>
                {group.settings.map((setting, index) => {
                  const on = settingsMap[group.id]?.[setting.id] ?? setting.isActive;
                  return (
                    <View key={setting.id}>
                      <ListGroup.Item disabled className="py-2">
                        <ListGroup.ItemPrefix>
                          <PlatformIcon platform={setting.platform} size={18} />
                        </ListGroup.ItemPrefix>
                        <ListGroup.ItemContent>
                          <ListGroup.ItemTitle className="text-sm font-normal">
                            {cityFromLocation(setting.locationName)}
                          </ListGroup.ItemTitle>
                          <ListGroup.ItemDescription className="text-xs text-muted">
                            {formatIntervalLabel(setting.runIntervalSeconds)}
                          </ListGroup.ItemDescription>
                        </ListGroup.ItemContent>
                        <ListGroup.ItemSuffix>
                          <Switch
                            isSelected={on}
                            onSelectedChange={(next) =>
                              setSettingsMap((prev) => ({
                                ...prev,
                                [group.id]: {
                                  ...prev[group.id],
                                  [setting.id]: next,
                                },
                              }))
                            }
                          />
                        </ListGroup.ItemSuffix>
                      </ListGroup.Item>
                      {index < group.settings.length - 1 ? (
                        <Separator className="ml-12 bg-muted/30" />
                      ) : null}
                    </View>
                  );
                })}
              </ListGroup>
              <View className="flex-row items-center justify-between pt-1">
                <Button size="sm" variant="secondary">
                  <Button.Label>Edit search</Button.Label>
                </Button>
                <Menu>
                  <Menu.Trigger asChild>
                    <Button size="sm" variant="ghost">
                      <StyledIonicons
                        name="ellipsis-horizontal"
                        size={18}
                        className="text-foreground"
                      />
                    </Button>
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Overlay />
                    <Menu.Content presentation="popover" width={170} placement="top">
                      <Menu.Item>
                        <StyledIonicons
                          name="play-outline"
                          size={18}
                          className="text-foreground"
                        />
                        <Menu.ItemTitle>Start all</Menu.ItemTitle>
                      </Menu.Item>
                      <Menu.Item>
                        <StyledIonicons
                          name="pause-outline"
                          size={18}
                          className="text-foreground"
                        />
                        <Menu.ItemTitle>Pause all</Menu.ItemTitle>
                      </Menu.Item>
                      <Menu.Item variant="danger">
                        <StyledIonicons
                          name="trash-outline"
                          size={18}
                          className="text-danger"
                        />
                        <Menu.ItemTitle>Delete</Menu.ItemTitle>
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Portal>
                </Menu>
              </View>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

/** A3 — Status Segment + Badge.Anchor on icon + dual actions */
function AccordionStatusFilter({
  groups,
}: {
  groups: SearchGroup[];
}): JSX.Element {
  return (
    <Accordion selectionMode="multiple" variant="surface" className="gap-2">
      {groups.map((group) => {
        const status = groupStatus(group);
        const activeCount = group.settings.filter((s) => s.isActive).length;
        return (
          <Accordion.Item key={group.id} value={group.id}>
            <Accordion.Trigger className="gap-2 px-3 py-3">
              <View className="min-w-0 flex-1 flex-row items-center gap-3">
                <Badge.Anchor>
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-secondary">
                    <StyledIonicons
                      name={typeIcon(group.searchType)}
                      size={18}
                      className="text-foreground"
                    />
                  </View>
                  <Badge
                    color={
                      status.tone === "success"
                        ? "success"
                        : status.tone === "warning"
                          ? "warning"
                          : "default"
                    }
                    size="sm"
                    placement="bottom-right"
                  />
                </Badge.Anchor>
                <View className="min-w-0 flex-1">
                  <Typography type="body" numberOfLines={1}>
                    {groupTitle(group)}
                  </Typography>
                  <Typography type="body-xs" className="text-muted">
                    {activeCount}/{group.settings.length} active ·{" "}
                    {cityFromLocation(group.locationName)}
                  </Typography>
                </View>
              </View>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
              <MetaChipRow group={group} />
              <PlatformRows group={group} />
              <View className="mt-1 flex-row gap-2">
                <Button size="sm" variant="secondary" className="flex-1">
                  <Button.Label>
                    {status.tone === "muted" ? "Start all" : "Pause all"}
                  </Button.Label>
                </Button>
                <Button size="sm" variant="primary" className="flex-1">
                  <Button.Label>Edit</Button.Label>
                </Button>
              </View>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

/** A4 — Dense trigger: platform icon strip + chips in header; expand = details */
function AccordionDenseTrigger({
  groups,
}: {
  groups: SearchGroup[];
}): JSX.Element {
  return (
    <Accordion selectionMode="single" variant="surface" className="gap-2">
      {groups.map((group) => {
        const status = groupStatus(group);
        return (
          <Accordion.Item key={group.id} value={group.id}>
            <Accordion.Trigger className="gap-2 px-3 py-3">
              <View className="min-w-0 flex-1 gap-2">
                <View className="flex-row items-center gap-2">
                  <Typography type="body" className="min-w-0 flex-1" numberOfLines={1}>
                    {groupTitle(group)}
                  </Typography>
                  <Chip
                    size="sm"
                    variant="secondary"
                    className={statusChipClass(status.tone)}
                  >
                    <Chip.Label
                      className={`text-[10px] ${statusLabelClass(status.tone)}`}
                    >
                      {status.label}
                    </Chip.Label>
                  </Chip>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="flex-row items-center gap-1.5">
                    {group.settings.map((s) => (
                      <View
                        key={s.id}
                        className={s.isActive ? "opacity-100" : "opacity-35"}
                      >
                        <PlatformIcon platform={s.platform} size={16} />
                      </View>
                    ))}
                  </View>
                  <Typography type="body-xs" className="flex-1 text-muted" numberOfLines={1}>
                    {metaChips(group).slice(0, 2).join(" · ")}
                  </Typography>
                </View>
              </View>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
              <MetaChipRow group={group} />
              <PlatformRows group={group} />
              <View className="flex-row gap-2">
                <Button size="sm" variant="secondary" className="flex-1">
                  <Button.Label>Edit</Button.Label>
                </Button>
                <Button size="sm" variant="danger-soft" className="flex-1">
                  <Button.Label>Delete</Button.Label>
                </Button>
              </View>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

/** A5 — Edit always on trigger; expand only for platforms */
function AccordionTriggerEdit({
  groups,
}: {
  groups: SearchGroup[];
}): JSX.Element {
  return (
    <Accordion selectionMode="multiple" variant="surface" className="gap-2">
      {groups.map((group) => {
        const status = groupStatus(group);
        return (
          <Accordion.Item key={group.id} value={group.id}>
            <Accordion.Trigger className="gap-2 px-3 py-3">
              <View className="min-w-0 flex-1 flex-row items-center gap-2">
                <StyledIonicons
                  name={typeIcon(group.searchType)}
                  size={18}
                  className="text-foreground"
                />
                <View className="min-w-0 flex-1">
                  <Typography type="body" numberOfLines={1}>
                    {groupTitle(group)}
                  </Typography>
                  <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                    {cityFromLocation(group.locationName)} ·{" "}
                    {group.settings.length} searches
                  </Typography>
                </View>
                <Chip
                  size="sm"
                  variant="secondary"
                  className={statusChipClass(status.tone)}
                >
                  <Chip.Label
                    className={`text-[10px] ${statusLabelClass(status.tone)}`}
                  >
                    {status.label}
                  </Chip.Label>
                </Chip>
                <View
                  onStartShouldSetResponder={() => true}
                  onTouchEnd={(e) => e.stopPropagation()}
                >
                  <Button size="sm" variant="secondary">
                    <Button.Label>Edit</Button.Label>
                  </Button>
                </View>
              </View>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
              <MetaChipRow group={group} />
              <PlatformRows group={group} />
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

/** A6 — Flat default Accordion (no surface cards) + count Badge */
function AccordionFlatList({ groups }: { groups: SearchGroup[] }): JSX.Element {
  return (
    <Accordion selectionMode="multiple" className="overflow-hidden rounded-2xl bg-surface">
      {groups.map((group, index) => {
        const status = groupStatus(group);
        return (
          <View key={group.id}>
            <Accordion.Item value={group.id}>
              <Accordion.Trigger className="gap-2 px-3 py-3">
                <View className="min-w-0 flex-1 flex-row items-center gap-2">
                  <Badge.Anchor>
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-surface-secondary">
                      <StyledIonicons
                        name={typeIcon(group.searchType)}
                        size={16}
                        className="text-foreground"
                      />
                    </View>
                    <Badge color="accent" size="sm" placement="top-right">
                      {group.settings.length}
                    </Badge>
                  </Badge.Anchor>
                  <View className="min-w-0 flex-1">
                    <Typography type="body" numberOfLines={1}>
                      {groupTitle(group)}
                    </Typography>
                    <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                      {metaChips(group).slice(0, 3).join(" · ")}
                    </Typography>
                  </View>
                  <Typography
                    type="body-xs"
                    className={statusLabelClass(status.tone)}
                  >
                    {status.label}
                  </Typography>
                </View>
                <Accordion.Indicator />
              </Accordion.Trigger>
              <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
                <PlatformRows group={group} />
                <Button size="sm" variant="secondary" className="self-start">
                  <Button.Label>Edit search</Button.Label>
                </Button>
              </Accordion.Content>
            </Accordion.Item>
            {index < groups.length - 1 ? (
              <Separator className="mx-3 bg-muted/30" />
            ) : null}
          </View>
        );
      })}
    </Accordion>
  );
}

/** A7 — Interval-first trigger; platforms grouped by interval inside */
function AccordionIntervalFirst({
  groups,
}: {
  groups: SearchGroup[];
}): JSX.Element {
  return (
    <Accordion selectionMode="multiple" variant="surface" className="gap-2">
      {groups.map((group) => {
        const status = groupStatus(group);
        const byInterval = group.settings.reduce<
          Record<number, typeof group.settings>
        >((acc, setting) => {
          const key = setting.runIntervalSeconds;
          (acc[key] ??= []).push(setting);
          return acc;
        }, {});
        const intervals = Object.keys(byInterval)
          .map(Number)
          .sort((a, b) => a - b);

        return (
          <Accordion.Item key={group.id} value={group.id}>
            <Accordion.Trigger className="gap-2 px-3 py-3">
              <View className="min-w-0 flex-1 flex-row items-center gap-2">
                <StyledIonicons
                  name={typeIcon(group.searchType)}
                  size={18}
                  className="text-foreground"
                />
                <View className="min-w-0 flex-1">
                  <Typography type="body" numberOfLines={1}>
                    {groupTitle(group)}
                  </Typography>
                  <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                    Fastest {fastestInterval(group)} ·{" "}
                    {cityFromLocation(group.locationName)}
                  </Typography>
                </View>
                <Chip size="sm" variant="secondary">
                  <Chip.Label className="text-[10px] text-muted">
                    {fastestInterval(group)}
                  </Chip.Label>
                </Chip>
                <Chip
                  size="sm"
                  variant="secondary"
                  className={statusChipClass(status.tone)}
                >
                  <Chip.Label
                    className={`text-[10px] ${statusLabelClass(status.tone)}`}
                  >
                    {status.label}
                  </Chip.Label>
                </Chip>
              </View>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
              <MetaChipRow group={group} />
              {intervals.map((seconds) => (
                <View key={seconds} className="gap-1">
                  <Typography type="body-xs" className="text-muted">
                    {formatIntervalLabel(seconds)}
                  </Typography>
                  {(byInterval[seconds] ?? []).map((setting) => (
                    <View
                      key={setting.id}
                      className={`flex-row items-center py-1.5 ${
                        setting.isActive ? "opacity-100" : "opacity-50"
                      }`}
                    >
                      <View className="mr-2.5 h-6 w-6 items-center justify-center">
                        <PlatformIcon platform={setting.platform} size={18} />
                      </View>
                      <Typography
                        type="body-sm"
                        className="flex-1"
                        numberOfLines={1}
                      >
                        {cityFromLocation(setting.locationName)}
                      </Typography>
                      <Badge
                        color={setting.isActive ? "success" : "default"}
                        size="sm"
                      />
                    </View>
                  ))}
                </View>
              ))}
              <Button size="sm" variant="secondary" className="mt-1 self-start">
                <Button.Label>Edit search</Button.Label>
              </Button>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

export function HomeCardExamplesScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const groups = useMemo(() => sampleGroups(), []);

  const [filter1, setFilter1] = useState<TypeFilter>("all");
  const [filter2, setFilter2] = useState<TypeFilter>("all");
  const [filter3, setFilter3] = useState<StatusFilter>("all");
  const [filter4, setFilter4] = useState<TypeFilter>("all");
  const [filter5, setFilter5] = useState<TypeFilter>("all");
  const [filter6, setFilter6] = useState<TypeFilter>("all");
  const [filter7, setFilter7] = useState<TypeFilter>("all");

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-2 px-3 pb-2 pt-2">
        <PressableFeedback onPress={() => router.back()}>
          <PressableFeedback.Scale>
            <View className="h-10 w-10 items-center justify-center">
              <StyledIonicons
                name="chevron-back"
                size={22}
                className="text-foreground"
              />
            </View>
          </PressableFeedback.Scale>
        </PressableFeedback>
        <View className="flex-1">
          <Typography type="body" weight="semibold">
            Accordion variants
          </Typography>
          <Typography type="body-xs" className="text-muted">
            7 takes · Segment filters · Custom → Car → iPhone
          </Typography>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-3 pb-16 pt-2"
      >
        <ExampleBlock
          index={1}
          title="Baseline"
          subtitle="Segment + surface Accordion + platform rows + Edit."
        >
          <TypeSegment value={filter1} onValueChange={setFilter1} />
          <AccordionBaseline groups={filterByType(groups, filter1)} />
        </ExampleBlock>

        <ExampleBlock
          index={2}
          title="ListGroup platforms + Menu"
          subtitle="Per-platform Switch inside; ⋯ menu for Start/Pause/Delete."
        >
          <TypeSegment value={filter2} onValueChange={setFilter2} />
          <AccordionListGroup groups={filterByType(groups, filter2)} />
        </ExampleBlock>

        <ExampleBlock
          index={3}
          title="Status Segment + Badge.Anchor"
          subtitle="Filter by All / Active / Paused / Partial; dual Start+Edit."
        >
          <Segment
            value={filter3}
            onValueChange={(next) => setFilter3(next as StatusFilter)}
          >
            <Segment.Group>
              <Segment.ScrollView>
                <Segment.Indicator />
                <Segment.Item value="all">
                  <Segment.Label>All</Segment.Label>
                </Segment.Item>
                <Segment.Item value="active">
                  <Segment.Label>Active</Segment.Label>
                </Segment.Item>
                <Segment.Item value="partial">
                  <Segment.Label>Partial</Segment.Label>
                </Segment.Item>
                <Segment.Item value="paused">
                  <Segment.Label>Paused</Segment.Label>
                </Segment.Item>
              </Segment.ScrollView>
            </Segment.Group>
          </Segment>
          <AccordionStatusFilter groups={filterByStatus(groups, filter3)} />
        </ExampleBlock>

        <ExampleBlock
          index={4}
          title="Dense trigger + icon strip"
          subtitle="Platform logos in collapsed row; single-expand; Edit/Delete."
        >
          <TypeSegment value={filter4} onValueChange={setFilter4} />
          <AccordionDenseTrigger groups={filterByType(groups, filter4)} />
        </ExampleBlock>

        <ExampleBlock
          index={5}
          title="Edit on trigger"
          subtitle="Edit always visible; expand only for filters + platforms."
        >
          <TypeSegment value={filter5} onValueChange={setFilter5} />
          <AccordionTriggerEdit groups={filterByType(groups, filter5)} />
        </ExampleBlock>

        <ExampleBlock
          index={6}
          title="Flat list + count Badge"
          subtitle="One surface block, separators; count badge on type icon."
        >
          <TypeSegment value={filter6} onValueChange={setFilter6} />
          <AccordionFlatList groups={filterByType(groups, filter6)} />
        </ExampleBlock>

        <ExampleBlock
          index={7}
          title="Interval-first"
          subtitle="Collapsed shows fastest interval; expand groups by Instant / N min."
        >
          <TypeSegment value={filter7} onValueChange={setFilter7} />
          <AccordionIntervalFirst groups={filterByType(groups, filter7)} />
        </ExampleBlock>
      </ScrollView>
    </View>
  );
}
