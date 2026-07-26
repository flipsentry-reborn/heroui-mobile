import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import type { ComponentProps, JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
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
  Switch,
  Typography,
  useAccordionItem,
  useThemeColor,
  useToast,
} from "heroui-native";
import { Badge, EmptyState } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { BrandButton } from "@/components/ui/brand-button";
import { FilterBottomSheet } from "@/features/feed/filter-bottom-sheet";
import { showSearchActionProgress } from "@/features/home/search-action-progress-toast";
import { formatOpenRangeLabel } from "@/features/home/search-bottom-sheet-price-sheet";
import { formatPriceShort } from "@/mocks/services/home";
import type { UserFilter } from "@/models/user-filter";
import { useStore } from "@/store/store";

const StyledIonicons = withUniwind(Ionicons);
const StyledAnimatedView = withUniwind(Animated.View);

/** Matches HeroUI Native / search-cards AccordionWithDepthEffect layout spring. */
const DEPTH_LAYOUT_TRANSITION = LinearTransition.springify()
  .damping(70)
  .stiffness(1000)
  .mass(2);

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function filterTypeMeta(filter: UserFilter): {
  label: string;
  icon: IoniconName;
} {
  if (filter.filterType === "Vehicle") {
    return { label: "Vehicle", icon: "car-sport-outline" };
  }
  return { label: "Custom", icon: "options-outline" };
}

function keywordCount(filter: UserFilter): number {
  return (
    (filter.titleIncluders?.length ?? 0) +
    (filter.descriptionIncluders?.length ?? 0)
  );
}

function priceChip(filter: UserFilter): string | null {
  const q =
    filter.filterType === "Vehicle" ? filter.vehicleQuery : filter.customQuery;
  if (q == null) return null;
  if (q.minPrice == null && q.maxPrice == null) return null;
  return formatOpenRangeLabel(
    q.minPrice != null ? formatPriceShort(q.minPrice) : "",
    q.maxPrice != null ? formatPriceShort(q.maxPrice) : "",
  );
}

function criteriaChips(filter: UserFilter): string[] {
  const chips: string[] = [];
  const price = priceChip(filter);
  if (price != null) chips.push(price);

  if (filter.filterType === "Vehicle" && filter.vehicleQuery != null) {
    const q = filter.vehicleQuery;
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

  const keywords = keywordCount(filter);
  if (keywords > 0) {
    chips.push(keywords === 1 ? "1 keyword" : `${keywords} keywords`);
  }
  return chips;
}

function headerMeta(filter: UserFilter): string {
  const type = filterTypeMeta(filter);
  const parts: string[] = [type.label];
  const price = priceChip(filter);
  if (price != null) parts.push(price);
  const keywords = keywordCount(filter);
  if (keywords > 0) {
    parts.push(keywords === 1 ? "1 keyword" : `${keywords} keywords`);
  }
  return parts.join(" · ");
}

/** Filter color as card border; paused uses a dimmed tint of the same hue. */
function filterBorderColor(hex: string, isActive: boolean): string {
  const raw = hex.trim();
  const match = /^#([0-9A-Fa-f]{6})$/.exec(raw);
  if (match == null) return isActive ? raw : `${raw}66`;
  const value = match[1];
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${isActive ? 1 : 0.35})`;
}

function FiltersHeader({ onBack }: { onBack: () => void }): JSX.Element {
  const insets = useSafeAreaInsets();
  const foreground = useThemeColor("foreground");

  return (
    <View style={{ paddingTop: insets.top }} className="bg-background">
      <View className="h-11 flex-row items-center px-1.5">
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="h-11 w-11 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={26} color={foreground} />
        </Pressable>

        <View className="min-w-0 flex-1 items-center justify-center pr-11">
          <Typography
            type="body"
            weight="semibold"
            numberOfLines={1}
            className="text-[17px] text-foreground"
          >
            Filters
          </Typography>
        </View>
      </View>
      <Separator />
    </View>
  );
}

function FilterToggleRow({
  icon,
  iconClassName,
  title,
  isSelected,
  onSelectedChange,
}: {
  icon: IoniconName;
  iconClassName: string;
  title: string;
  isSelected: boolean;
  onSelectedChange: (next: boolean) => void;
}): JSX.Element {
  return (
    <View className="flex-row items-center gap-2.5 py-1.5">
      <StyledIonicons name={icon} size={18} className={iconClassName} />
      <Typography type="body-sm" className="min-w-0 flex-1 text-foreground">
        {title}
      </Typography>
      <Switch isSelected={isSelected} onSelectedChange={onSelectedChange} />
    </View>
  );
}

function FilterActionsMenu({
  filter,
  onEdit,
  onDelete,
}: {
  filter: UserFilter;
  onEdit: (filter: UserFilter) => void;
  onDelete: (filter: UserFilter) => void;
}): JSX.Element {
  const [accentForeground] = useThemeColor(["accent-foreground"]);

  return (
    <Menu>
      <Menu.Trigger asChild>
        <BrandButton className="min-h-12 w-full">
          <Ionicons name="create" size={18} color={accentForeground} />
          <BrandButton.Label>Actions</BrandButton.Label>
        </BrandButton>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Overlay className="bg-backdrop" />
        <Menu.Content presentation="popover" width={260} placement="top">
          <Menu.Group>
            <Menu.Item id="edit" onPress={() => onEdit(filter)}>
              <StyledIonicons
                name="create-outline"
                size={18}
                className="text-foreground"
              />
              <Menu.ItemTitle>Edit</Menu.ItemTitle>
            </Menu.Item>
            <Menu.Item
              id="delete"
              variant="danger"
              onPress={() => onDelete(filter)}
            >
              <StyledIonicons
                name="trash-outline"
                size={18}
                className="text-danger"
              />
              <Menu.ItemTitle>Delete</Menu.ItemTitle>
            </Menu.Item>
          </Menu.Group>
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  );
}

function FilterDepthItem({
  filter,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleNotifications,
}: {
  filter: UserFilter;
  onEdit: (filter: UserFilter) => void;
  onDelete: (filter: UserFilter) => void;
  onToggleActive: (filter: UserFilter, active: boolean) => void;
  onToggleNotifications: (filter: UserFilter, enabled: boolean) => void;
}): JSX.Element {
  const { isExpanded } = useAccordionItem();
  const scale = useSharedValue(isExpanded ? 1 : 0.97);
  const chips = criteriaChips(filter);
  const type = filterTypeMeta(filter);
  const borderColor = filterBorderColor(filter.color, filter.isActive);

  useEffect(() => {
    scale.value = withTiming(isExpanded ? 1 : 0.97, { duration: 200 });
  }, [isExpanded, scale]);

  const depthStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <StyledAnimatedView
      layout={DEPTH_LAYOUT_TRANSITION}
      style={depthStyle}
      className="mb-2.5"
    >
      <StyledAnimatedView
        layout={DEPTH_LAYOUT_TRANSITION}
        className={cn(
          "overflow-hidden rounded-2xl border-2 bg-surface",
          !filter.isActive && "opacity-60",
        )}
        style={{ borderColor }}
      >
        <Accordion.Trigger className="gap-2 px-3 py-3">
          <StyledIonicons
            name={type.icon}
            size={18}
            className={filter.isActive ? "text-foreground" : "text-muted"}
          />
          <View className="min-w-0 flex-1 gap-1.5">
            <View className="flex-row items-center gap-2">
              <Typography
                type="body"
                weight="medium"
                className="min-w-0 flex-1 text-foreground"
                numberOfLines={1}
              >
                {filter.name}
              </Typography>
              {filter.isActive ? (
                <Badge color="success" variant="soft" size="sm">
                  Active
                </Badge>
              ) : (
                <Badge color="danger" variant="soft" size="sm">
                  Paused
                </Badge>
              )}
            </View>
            <Typography
              type="body-xs"
              className="text-muted"
              numberOfLines={1}
            >
              {headerMeta(filter)}
            </Typography>
          </View>
          <Accordion.Indicator />
        </Accordion.Trigger>

        {/* Always visible — enable + notifications on the card */}
        <View className="gap-0.5 px-3 pb-3">
          <Separator className="mb-1.5 bg-muted/30" />
          <FilterToggleRow
            icon="checkmark-circle-outline"
            iconClassName={filter.isActive ? "text-success" : "text-muted"}
            title="Enabled"
            isSelected={filter.isActive}
            onSelectedChange={(next) => onToggleActive(filter, next)}
          />
          <FilterToggleRow
            icon="notifications-outline"
            iconClassName={
              filter.notificationEnabled ? "text-violet-500" : "text-muted"
            }
            title="Notifications"
            isSelected={filter.notificationEnabled}
            onSelectedChange={(next) => onToggleNotifications(filter, next)}
          />
        </View>

        <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
          {chips.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5">
              {chips.map((label) => (
                <Chip key={label} size="sm" variant="secondary">
                  <Chip.Label className="text-[10px] text-muted">
                    {label}
                  </Chip.Label>
                </Chip>
              ))}
            </View>
          ) : null}
          <FilterActionsMenu
            filter={filter}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Accordion.Content>
      </StyledAnimatedView>
    </StyledAnimatedView>
  );
}

/** Manage saved Filters — stack screen opened from feed header. */
export const FiltersScreen = observer(function FiltersScreen({
  onBack,
}: {
  onBack: () => void;
}): JSX.Element {
  const { filterStore } = useStore();
  const { toast } = useToast();
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<UserFilter | null>(null);
  const [expandedValue, setExpandedValue] = useState<string | undefined>();

  useEffect(() => {
    void filterStore.loadFilters();
  }, [filterStore]);

  const filterIds = useMemo(
    () => filterStore.filters.map((f) => f.id),
    [filterStore.filters],
  );

  useEffect(() => {
    if (expandedValue != null && !filterIds.includes(expandedValue)) {
      setExpandedValue(undefined);
    }
  }, [expandedValue, filterIds]);

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (filter: UserFilter) => {
    setEditing(filter);
    setSheetOpen(true);
  };

  const handleDelete = useCallback(
    (filter: UserFilter) => {
      showSearchActionProgress(toast, {
        kind: "delete",
        subject: "filter",
        title: filter.name,
        onCommit: () => filterStore.deleteFilter(filter.id),
      });
    },
    [filterStore, toast],
  );

  const handleToggleActive = useCallback(
    (filter: UserFilter, active: boolean) => {
      showSearchActionProgress(toast, {
        kind: active ? "start" : "pause",
        subject: "filter",
        title: filter.name,
        onCommit: async () => {
          const updated = await filterStore.updateFilter(filter.id, {
            isActive: active,
          });
          return updated != null;
        },
      });
    },
    [filterStore, toast],
  );

  const handleToggleNotifications = useCallback(
    (filter: UserFilter, enabled: boolean) => {
      void filterStore.updateFilter(filter.id, {
        notificationEnabled: enabled,
      });
    },
    [filterStore],
  );

  if (!filterStore.hasLoaded && filterStore.loading) {
    return (
      <View className="flex-1 bg-background">
        <FiltersHeader onBack={onBack} />
        <View className="flex-1 items-center justify-center">
          <Typography type="body" className="text-muted">
            Loading filters…
          </Typography>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FiltersHeader onBack={onBack} />

      {filterStore.filters.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <StyledIonicons
                  name="options-outline"
                  size={20}
                  className="text-muted"
                />
              </EmptyState.Media>
              <EmptyState.Title>Filters</EmptyState.Title>
              <EmptyState.Description>
                Save Vehicle or Custom filters (keywords, price, and more) to
                organize your feed. No location needed.
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <BrandButton className="min-h-12 w-full" onPress={openCreate}>
                <Ionicons name="add" size={18} color={accentForeground} />
                <BrandButton.Label>New Filter</BrandButton.Label>
              </BrandButton>
            </EmptyState.Content>
          </EmptyState>
        </View>
      ) : (
        <ScrollView contentContainerClassName="px-0 pb-8 pt-3">
          <View className="mb-3 flex-row items-center justify-between px-4">
            <Typography
              type="body"
              weight="semibold"
              className="text-[17px] text-foreground"
            >
              Your Filters
            </Typography>
            <BrandButton className="min-h-10 px-3" onPress={openCreate}>
              <Ionicons name="add" size={18} color={accentForeground} />
              <BrandButton.Label>New Filter</BrandButton.Label>
            </BrandButton>
          </View>

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
            {filterStore.filters.map((filter) => (
              <Accordion.Item
                key={filter.id}
                value={filter.id}
                className="overflow-visible"
              >
                <FilterDepthItem
                  filter={filter}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onToggleNotifications={handleToggleNotifications}
                />
              </Accordion.Item>
            ))}
          </Accordion>
        </ScrollView>
      )}

      <FilterBottomSheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        editingFilter={editing}
      />
    </View>
  );
});
