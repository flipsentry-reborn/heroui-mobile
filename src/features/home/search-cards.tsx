import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX } from "react";
import { Fragment, useEffect, useMemo, useState } from "react";
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
  Chip,
  cn,
  Menu,
  Separator,
  SubMenu,
  Typography,
  useAccordion,
  useAccordionItem,
  useThemeColor,
} from "heroui-native";
import { Badge } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { BrandButton } from "@/components/ui/brand-button";
import PlatformIcon from "@/components/icons/PlatformIcon";
import { SEARCH_PLATFORMS } from "@/features/home/search-bottom-sheet-platforms-sheet";
import { formatOpenRangeLabel } from "@/features/home/search-bottom-sheet-price-sheet";
import type { SearchEditSection } from "@/features/home/search-edit-section";
import type { SearchStatusFilter } from "@/features/home/search-status-segment";
import type { HomePlatform, SearchGroup } from "@/mocks/data/home";
import {
  cityFromLocation,
  formatIntervalLabel,
  formatPriceShort,
  groupStatus,
  isGroupPaused,
} from "@/mocks/services/home";

interface SearchCardsProps {
  /** Full list — keep mounted so filter changes can layout-animate. */
  groups: SearchGroup[];
  statusFilter?: SearchStatusFilter;
  emptyMessage?: string;
  onEdit?: (group: SearchGroup, section?: SearchEditSection) => void;
  onDelete?: (group: SearchGroup) => void;
  onToggle?: (group: SearchGroup, active: boolean) => void;
}

function matchesStatusFilter(
  group: SearchGroup,
  filter: SearchStatusFilter,
): boolean {
  if (filter === "all") return true;
  const paused = isGroupPaused(group);
  return filter === "paused" ? paused : !paused;
}

const StyledIonicons = withUniwind(Ionicons);

const StyledAnimatedView = withUniwind(Animated.View);

/** Matches HeroUI Native / iPhone models `AccordionWithDepthEffect` layout spring. */
const DEPTH_LAYOUT_TRANSITION = LinearTransition.springify()
  .damping(70)
  .stiffness(1000)
  .mass(2);

function groupTitle(group: SearchGroup): string {
  if (group.searchType === "car") return "Cars";
  if (group.searchType === "iphone") return "Iphones";
  return group.customLabel ?? "Custom search";
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
        formatOpenRangeLabel(
          q.minPrice != null ? formatPriceShort(q.minPrice) : "",
          q.maxPrice != null ? formatPriceShort(q.maxPrice) : "",
        ),
      );
    }
    if (q.minYear != null || q.maxYear != null) {
      chips.push(
        formatOpenRangeLabel(
          q.minYear != null ? String(q.minYear) : "",
          q.maxYear != null ? String(q.maxYear) : "",
        ),
      );
    }
    if (q.minMileage != null || q.maxMileage != null) {
      chips.push(
        formatOpenRangeLabel(
          q.minMileage != null ? formatPriceShort(q.minMileage) : "",
          q.maxMileage != null ? formatPriceShort(q.maxMileage) : "",
          { unit: " mi" },
        ),
      );
    }
  }
  return chips;
}

function statusBadgeColor(
  tone: ReturnType<typeof groupStatus>["tone"],
): "success" | "warning" | "danger" {
  if (tone === "success") return "success";
  if (tone === "danger") return "danger";
  return "warning";
}

/** Unique platforms for the card header (one icon each, not one per setting). */
function uniquePlatforms(
  settings: SearchGroup["settings"],
): { platform: string; isActive: boolean }[] {
  const seen = new Map<string, boolean>();
  for (const setting of settings) {
    const prev = seen.get(setting.platform);
    seen.set(setting.platform, (prev ?? false) || setting.isActive);
  }
  return [...seen.entries()].map(([platform, isActive]) => ({
    platform,
    isActive,
  }));
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
            {setting.isActive ? (
              <Badge color="success" variant="soft" size="sm">
                Active
              </Badge>
            ) : (
              <Badge color="danger" variant="soft" size="sm">
                Paused
              </Badge>
            )}
          </View>
          {index < group.settings.length - 1 ? (
            <Separator className="bg-muted/30" />
          ) : null}
        </View>
      ))}
    </View>
  );
}

type FilterMenuItem = {
  key: SearchEditSection;
  title: string;
  description?: string;
  platforms?: HomePlatform[];
  icon?: ComponentProps<typeof Ionicons>["name"];
  iconClassName?: string;
};

const MAX_FILTER_MAKES_SHOWN = 4;

function formatMakesFilterDescription(makes: string[] | undefined): string {
  if (makes == null || makes.length === 0) return "Any make";
  if (makes.length <= MAX_FILTER_MAKES_SHOWN) return makes.join(", ");
  return `${makes.slice(0, MAX_FILTER_MAKES_SHOWN).join(", ")}, More...`;
}

function platformsForFilterMenu(
  settings: SearchGroup["settings"],
): HomePlatform[] {
  const selected = new Set(uniquePlatforms(settings).map((p) => p.platform));
  return SEARCH_PLATFORMS.map((p) => p.id).filter((id) => selected.has(id));
}

function filterMenuItems(group: SearchGroup): FilterMenuItem[] {
  const location = cityFromLocation(group.locationName);
  const items: FilterMenuItem[] = [
    {
      key: "location",
      title: "Location",
      description: `${location} · ${group.radiusMiles} mi`,
      icon: "navigate",
      iconClassName: "text-sky-500",
    },
    {
      key: "platforms",
      title: "Platforms",
      platforms: platformsForFilterMenu(group.settings),
      icon: "storefront",
      iconClassName: "text-yellow-500",
    },
  ];

  if (group.searchType === "car") {
    const q = group.carQuery;
    items.push(
      {
        key: "makes",
        title: "Makes",
        description: formatMakesFilterDescription(q?.makes),
      },
      {
        key: "price",
        title: "Price",
        description:
          q && (q.minPrice != null || q.maxPrice != null)
            ? formatOpenRangeLabel(
                q.minPrice != null ? formatPriceShort(q.minPrice) : "",
                q.maxPrice != null ? formatPriceShort(q.maxPrice) : "",
              )
            : "Any price",
      },
      {
        key: "year",
        title: "Year",
        description:
          q && (q.minYear != null || q.maxYear != null)
            ? formatOpenRangeLabel(
                q.minYear != null ? String(q.minYear) : "",
                q.maxYear != null ? String(q.maxYear) : "",
              )
            : "Any year",
      },
      {
        key: "mileage",
        title: "Mileage",
        description:
          q && (q.minMileage != null || q.maxMileage != null)
            ? formatOpenRangeLabel(
                q.minMileage != null ? formatPriceShort(q.minMileage) : "",
                q.maxMileage != null ? formatPriceShort(q.maxMileage) : "",
                { unit: " mi" },
              )
            : "Any mileage",
      },
    );
    return items;
  }

  if (group.searchType === "iphone") {
    const modelCount =
      group.customLabel
        ?.split(",")
        .map((part) => part.trim())
        .filter(Boolean).length ?? 0;
    items.push({
      key: "models",
      title: "Models",
      description: modelCount > 0 ? String(modelCount) : "Any model",
    });
    return items;
  }

  items.push({
    key: "keywords",
    title: "Keywords",
    description: group.customLabel ?? "No keywords set",
  });
  return items;
}

function SearchCardActionsMenu({
  group,
  onEdit,
  onDelete,
  onToggle,
}: {
  group: SearchGroup;
  onEdit?: (group: SearchGroup, section?: SearchEditSection) => void;
  onDelete?: (group: SearchGroup) => void;
  onToggle?: (group: SearchGroup, active: boolean) => void;
}): JSX.Element {
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const isPaused = group.settings.every((s) => !s.isActive);
  const filters = filterMenuItems(group);

  return (
    <Menu>
      <Menu.Trigger asChild>
        <BrandButton className="min-h-12 w-full">
          <Ionicons
            name="menu-outline"
            size={18}
            color={accentForeground}
          />
          <BrandButton.Label>Actions</BrandButton.Label>
        </BrandButton>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Overlay className="bg-backdrop" />
        <Menu.Content presentation="popover" width={260} placement="top">
          <Menu.Group>
            <Menu.Item id="edit" onPress={() => onEdit?.(group)}>
              <StyledIonicons
                name="create-outline"
                size={18}
                className="text-foreground"
              />
              <Menu.ItemTitle>Edit</Menu.ItemTitle>
            </Menu.Item>
            <Menu.Item
              id="toggle"
              onPress={() => onToggle?.(group, isPaused)}
            >
              <StyledIonicons
                name={isPaused ? "play-outline" : "pause-outline"}
                size={18}
                className={isPaused ? "text-success" : "text-warning"}
              />
              <Menu.ItemTitle className={isPaused ? "text-success" : "text-warning"}>
                {isPaused ? "Start" : "Pause"}
              </Menu.ItemTitle>
            </Menu.Item>
          </Menu.Group>

          <SubMenu>
            <SubMenu.Trigger textValue="Filters">
              <StyledIonicons
                name="options-outline"
                size={18}
                className="text-foreground"
              />
              <Typography type="body" className="flex-1">
                Filters
              </Typography>
              <SubMenu.TriggerIndicator />
            </SubMenu.Trigger>
            <SubMenu.Content>
              {filters.map((filter, index) => (
                <Fragment key={filter.key}>
                  {index > 0 ? (
                    <Separator className="mx-2 my-1 opacity-75" />
                  ) : null}
                  <Menu.Item
                    className="items-center"
                    onPress={() => onEdit?.(group, filter.key)}
                  >
                    {filter.icon != null ? (
                      <StyledIonicons
                        name={filter.icon}
                        size={18}
                        className={filter.iconClassName ?? "text-foreground"}
                      />
                    ) : null}
                    <Menu.ItemTitle
                      className={
                        filter.key === "platforms" ? "flex-1" : "shrink-0"
                      }
                    >
                      {filter.title}
                    </Menu.ItemTitle>
                    {filter.key === "platforms" ? (
                      filter.platforms != null &&
                      filter.platforms.length > 0 ? (
                        <View className="flex-row items-center gap-1.5">
                          {filter.platforms.map((platform) => (
                            <PlatformIcon
                              key={platform}
                              platform={platform}
                              size={18}
                            />
                          ))}
                        </View>
                      ) : (
                        <Menu.ItemDescription>None</Menu.ItemDescription>
                      )
                    ) : (
                      <Menu.ItemDescription
                        className="min-w-0 flex-1 text-right text-xs"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {filter.description}
                      </Menu.ItemDescription>
                    )}
                  </Menu.Item>
                </Fragment>
              ))}
            </SubMenu.Content>
          </SubMenu>

          <Separator className="mx-2 my-1 opacity-75" />

          <Menu.Item variant="danger" onPress={() => onDelete?.(group)}>
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
  );
}

function SearchDepthItem({
  group,
  index,
  groupCount,
  groupIds,
  isVisible,
  onEdit,
  onDelete,
  onToggle,
}: {
  group: SearchGroup;
  /** Index among currently visible cards; -1 when filtered out. */
  index: number;
  groupCount: number;
  groupIds: string[];
  isVisible: boolean;
  onEdit?: (group: SearchGroup, section?: SearchEditSection) => void;
  onDelete?: (group: SearchGroup) => void;
  onToggle?: (group: SearchGroup, active: boolean) => void;
}): JSX.Element {
  const { value } = useAccordion();
  const { isExpanded } = useAccordionItem();
  const scale = useSharedValue(isExpanded ? 1 : 0.97);
  const status = groupStatus(group);

  useEffect(() => {
    scale.value = withTiming(isExpanded && isVisible ? 1 : 0.97, {
      duration: 200,
    });
  }, [isExpanded, isVisible, scale]);

  const depthStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isVisible ? scale.value : 1 }],
  }));

  const expandedIds = useMemo(() => {
    if (Array.isArray(value)) return new Set(value);
    if (typeof value === "string" && value.length > 0) return new Set([value]);
    return new Set<string>();
  }, [value]);

  const prevId = index > 0 ? groupIds[index - 1] : undefined;
  const nextId = index < groupCount - 1 ? groupIds[index + 1] : undefined;
  const isBeforeSelected = nextId != null && expandedIds.has(nextId);
  const isAfterSelected = prevId != null && expandedIds.has(prevId);

  const showDivider =
    isVisible &&
    index >= 0 &&
    index < groupCount - 1 &&
    !isExpanded &&
    !isBeforeSelected;

  return (
    <StyledAnimatedView
      layout={DEPTH_LAYOUT_TRANSITION}
      pointerEvents={isVisible ? "auto" : "none"}
      style={depthStyle}
      className={cn(!isVisible && "h-0 overflow-hidden opacity-0")}
    >
      <StyledAnimatedView
        layout={DEPTH_LAYOUT_TRANSITION}
        className={cn(
          "overflow-hidden bg-surface",
          isVisible && index === 0 && !isExpanded && "rounded-t-2xl",
          isVisible &&
            index === groupCount - 1 &&
            !isExpanded &&
            !isBeforeSelected &&
            "rounded-b-3xl",
          isVisible && isBeforeSelected && "rounded-b-2xl",
          isVisible && isExpanded && "rounded-2xl",
          isVisible && isAfterSelected && "rounded-t-2xl",
          isVisible && isExpanded && index === 0 && "mb-2",
          isVisible &&
            isExpanded &&
            index > 0 &&
            index < groupCount - 1 &&
            "my-2",
          isVisible && isExpanded && index === groupCount - 1 && "mt-2",
        )}
      >
        <Accordion.Trigger className="gap-2 px-3 py-3">
          <View className="min-w-0 flex-1 gap-2">
            <View className="flex-row items-center gap-2">
              <Typography
                type="body"
                className="min-w-0 flex-1"
                numberOfLines={1}
              >
                {groupTitle(group)}
              </Typography>
              <Badge
                color={statusBadgeColor(status.tone)}
                variant="soft"
                size="sm"
              >
                {status.label}
              </Badge>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center gap-1.5">
                {uniquePlatforms(group.settings).map((p) => (
                  <View
                    key={p.platform}
                    className={p.isActive ? "opacity-100" : "opacity-35"}
                  >
                    <PlatformIcon platform={p.platform} size={16} />
                  </View>
                ))}
              </View>
              <Typography
                type="body-xs"
                className="flex-1 text-muted"
                numberOfLines={1}
              >
                {metaChips(group).slice(0, 2).join(" · ")}
              </Typography>
            </View>
          </View>
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
          <MetaChipRow group={group} />
          <PlatformRows group={group} />
          <SearchCardActionsMenu
            group={group}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        </Accordion.Content>
      </StyledAnimatedView>
      {showDivider ? (
        <StyledAnimatedView
          layout={DEPTH_LAYOUT_TRANSITION}
          entering={FadeIn.duration(200)}
          className="bg-surface px-3 pb-3 -mb-3"
        >
          <Separator />
        </StyledAnimatedView>
      ) : null}
    </StyledAnimatedView>
  );
}

export function SearchCards({
  groups,
  statusFilter = "all",
  emptyMessage = "No searches yet",
  onEdit,
  onDelete,
  onToggle,
}: SearchCardsProps): JSX.Element {
  const [expandedValue, setExpandedValue] = useState<string | undefined>();

  const visibleIds = useMemo(
    () =>
      groups
        .filter((group) => matchesStatusFilter(group, statusFilter))
        .map((group) => group.id),
    [groups, statusFilter],
  );

  useEffect(() => {
    if (expandedValue != null && !visibleIds.includes(expandedValue)) {
      setExpandedValue(undefined);
    }
  }, [expandedValue, visibleIds]);

  if (groups.length === 0) {
    return (
      <View className="mx-3 items-center rounded-3xl bg-surface px-4 py-8">
        <Typography type="body-sm" className="text-muted">
          {emptyMessage}
        </Typography>
      </View>
    );
  }

  return (
    <View>
      {visibleIds.length === 0 ? (
        <View className="mx-3 items-center rounded-3xl bg-surface px-4 py-8">
          <Typography type="body-sm" className="text-muted">
            {emptyMessage}
          </Typography>
        </View>
      ) : null}
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
        className={cn(
          "mx-3 w-auto overflow-visible",
          visibleIds.length === 0 && "h-0 overflow-hidden opacity-0",
        )}
        animation={{
          layout: {
            value: DEPTH_LAYOUT_TRANSITION,
          },
        }}
      >
        {groups.map((group) => {
          const isVisible = visibleIds.includes(group.id);
          const index = visibleIds.indexOf(group.id);
          return (
            <Accordion.Item
              key={group.id}
              value={group.id}
              className={cn(
                "overflow-visible",
                !isVisible && "h-0 overflow-hidden",
              )}
            >
              <SearchDepthItem
                group={group}
                index={index}
                groupCount={visibleIds.length}
                groupIds={visibleIds}
                isVisible={isVisible}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggle={onToggle}
              />
            </Accordion.Item>
          );
        })}
      </Accordion>
    </View>
  );
}
