import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useEffect, useMemo } from "react";
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
import type { SearchGroup } from "@/mocks/data/home";
import { formatOpenRangeLabel } from "@/features/home/search-bottom-sheet-price-sheet";
import {
  cityFromLocation,
  formatIntervalLabel,
  formatPriceShort,
  groupStatus,
} from "@/mocks/services/home";

interface SearchCardsProps {
  groups: SearchGroup[];
  onEdit?: (group: SearchGroup) => void;
  onDelete?: (group: SearchGroup) => void;
  onToggle?: (group: SearchGroup, active: boolean) => void;
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
  key: string;
  title: string;
  description: string;
};

function filterMenuItems(group: SearchGroup): FilterMenuItem[] {
  const location = cityFromLocation(group.locationName);
  const items: FilterMenuItem[] = [
    {
      key: "location",
      title: "Location",
      description: `${location} · ${group.radiusMiles} mi`,
    },
  ];

  if (group.searchType === "car") {
    const q = group.carQuery;
    items.push(
      {
        key: "makes",
        title: "Makes",
        description:
          q?.makes.length && q.makes.length > 0
            ? q.makes.join(", ")
            : "Any make",
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
    items.push({
      key: "models",
      title: "Models",
      description: group.customLabel ?? "Any model",
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
  onEdit?: (group: SearchGroup) => void;
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
            name="ellipsis-horizontal"
            size={18}
            color={accentForeground}
          />
          <BrandButton.Label>Actions</BrandButton.Label>
        </BrandButton>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Overlay />
        <Menu.Content presentation="popover" width={240} placement="top">
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
              {filters.map((filter) => (
                <Menu.Item
                  key={filter.key}
                  className="items-start"
                  onPress={() => onEdit?.(group)}
                >
                  <View className="flex-1">
                    <Menu.ItemTitle>{filter.title}</Menu.ItemTitle>
                    <Menu.ItemDescription>
                      {filter.description}
                    </Menu.ItemDescription>
                  </View>
                </Menu.Item>
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
  onEdit,
  onDelete,
  onToggle,
}: {
  group: SearchGroup;
  index: number;
  groupCount: number;
  groupIds: string[];
  onEdit?: (group: SearchGroup) => void;
  onDelete?: (group: SearchGroup) => void;
  onToggle?: (group: SearchGroup, active: boolean) => void;
}): JSX.Element {
  const { value } = useAccordion();
  const { isExpanded } = useAccordionItem();
  const scale = useSharedValue(isExpanded ? 1 : 0.97);
  const status = groupStatus(group);

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

  const prevId = index > 0 ? groupIds[index - 1] : undefined;
  const nextId = index < groupCount - 1 ? groupIds[index + 1] : undefined;
  const isBeforeSelected = nextId != null && expandedIds.has(nextId);
  const isAfterSelected = prevId != null && expandedIds.has(prevId);

  const showDivider =
    index < groupCount - 1 && !isExpanded && !isBeforeSelected;

  return (
    <Animated.View layout={DEPTH_LAYOUT_TRANSITION} style={depthStyle}>
      <StyledAnimatedView
        layout={DEPTH_LAYOUT_TRANSITION}
        className={cn(
          "overflow-hidden bg-surface",
          index === 0 && !isExpanded && "rounded-t-2xl",
          index === groupCount - 1 &&
            !isExpanded &&
            !isBeforeSelected &&
            "rounded-b-3xl",
          isBeforeSelected && "rounded-b-2xl",
          isExpanded && "rounded-2xl",
          isAfterSelected && "rounded-t-2xl",
          isExpanded && index === 0 && "mb-2",
          isExpanded && index > 0 && index < groupCount - 1 && "my-2",
          isExpanded && index === groupCount - 1 && "mt-2",
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
    </Animated.View>
  );
}

export function SearchCards({
  groups,
  onEdit,
  onDelete,
  onToggle,
}: SearchCardsProps): JSX.Element {
  const groupIds = useMemo(() => groups.map((g) => g.id), [groups]);

  if (groups.length === 0) {
    return (
      <View className="mx-3 items-center rounded-3xl bg-surface px-4 py-8">
        <Typography type="body-sm" className="text-muted">
          No searches yet
        </Typography>
      </View>
    );
  }

  return (
    <Accordion
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
      {groups.map((group, index) => (
        <Accordion.Item
          key={group.id}
          value={group.id}
          className="overflow-visible"
        >
          <SearchDepthItem
            group={group}
            index={index}
            groupCount={groups.length}
            groupIds={groupIds}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
