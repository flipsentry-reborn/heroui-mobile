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
  Button,
  Chip,
  cn,
  Separator,
  Typography,
  useAccordion,
  useAccordionItem,
} from "heroui-native";
import { Badge } from "heroui-native-pro";
import { withUniwind } from "uniwind";

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
}

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
  if (tone === "warning") return "warning";
  return "danger";
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

function SearchDepthItem({
  group,
  index,
  groupCount,
  groupIds,
  onEdit,
  onDelete,
}: {
  group: SearchGroup;
  index: number;
  groupCount: number;
  groupIds: string[];
  onEdit?: (group: SearchGroup) => void;
  onDelete?: (group: SearchGroup) => void;
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
                {group.settings.map((s) => (
                  <View
                    key={s.id}
                    className={s.isActive ? "opacity-100" : "opacity-35"}
                  >
                    <PlatformIcon platform={s.platform} size={16} />
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
          <View className="flex-row gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onPress={() => onEdit?.(group)}
            >
              <Button.Label>Edit</Button.Label>
            </Button>
            <Button
              size="sm"
              variant="danger-soft"
              className="flex-1"
              onPress={() => onDelete?.(group)}
            >
              <Button.Label>Delete</Button.Label>
            </Button>
          </View>
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
          />
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
