import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import type { ComponentProps, JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Chip,
  Separator,
  Switch,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { BrandButton } from "@/components/ui/brand-button";
import { FilterBottomSheet } from "@/features/feed/filter-bottom-sheet";
import { showSearchActionProgress } from "@/features/home/search-action-progress-toast";
import { formatOpenRangeLabel } from "@/features/home/search-bottom-sheet-price-sheet";
import { formatPriceShort } from "@/mocks/services/home";
import type { UserFilter } from "@/models/user-filter";
import { useStore } from "@/store/store";

const StyledIonicons = withUniwind(Ionicons);

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

/** Filter color hairline; paused uses a dimmed tint of the same hue. */
function filterAccentColor(hex: string, isActive: boolean): string {
  const match = /^#([0-9A-Fa-f]{6})$/.exec(hex.trim());
  if (match == null) return hex;
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

function FilterCardEditButton({
  filter,
  onEdit,
}: {
  filter: UserFilter;
  onEdit: (filter: UserFilter) => void;
}): JSX.Element {
  const [accentForeground] = useThemeColor(["accent-foreground"]);

  return (
    <BrandButton
      className="h-7 min-h-7 gap-1 !rounded-full px-2.5"
      onPress={() => onEdit(filter)}
      accessibilityLabel={`Edit ${filter.name}`}
    >
      <Ionicons name="create-outline" size={14} color={accentForeground} />
      <BrandButton.Label className="text-[13px] leading-[17px]">
        Edit
      </BrandButton.Label>
    </BrandButton>
  );
}

/** Solid status pill — same height/radius as Edit / New Filter buttons. */
function FilterStatusPill({ active }: { active: boolean }): JSX.Element {
  return (
    <View
      className={`h-7 min-h-7 shrink-0 items-center justify-center rounded-full px-2.5 ${
        active ? "bg-success" : "bg-danger"
      }`}
    >
      <Typography
        type="body"
        weight="medium"
        className="text-[13px] leading-[17px] text-white"
      >
        {active ? "Active" : "Paused"}
      </Typography>
    </View>
  );
}

/** Control Dock card — color hairline, criteria body, Enabled/Alerts footer. */
function FilterControlDockCard({
  filter,
  onEdit,
  onToggleActive,
  onToggleNotifications,
}: {
  filter: UserFilter;
  onEdit: (filter: UserFilter) => void;
  onToggleActive: (filter: UserFilter, active: boolean) => void;
  onToggleNotifications: (filter: UserFilter, enabled: boolean) => void;
}): JSX.Element {
  const chips = criteriaChips(filter);
  const accent = filterAccentColor(filter.color, filter.isActive);

  return (
    <View
      className={`overflow-hidden rounded-2xl border border-border bg-surface ${
        filter.isActive ? "" : "opacity-60"
      }`}
    >
      <View className="h-1" style={{ backgroundColor: accent }} />

      <View className="px-3 py-3">
        <View className="mb-1 flex-row items-center gap-1.5">
          <Typography
            type="body"
            weight="medium"
            className="min-w-0 shrink text-foreground"
            numberOfLines={1}
          >
            {filter.name}
          </Typography>
          <FilterStatusPill active={filter.isActive} />
          <View className="min-w-2 flex-1" />
          <FilterCardEditButton filter={filter} onEdit={onEdit} />
        </View>
        <Typography type="body-xs" className="mb-3 text-muted" numberOfLines={1}>
          {headerMeta(filter)}
        </Typography>
        {chips.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {chips.map((label) => (
              <Chip key={label} size="sm" variant="secondary">
                <Chip.Label className="text-[10px] text-muted">{label}</Chip.Label>
              </Chip>
            ))}
          </View>
        ) : null}
      </View>

      <View className="border-t border-border bg-surface-secondary px-3 py-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <StyledIonicons
              name="power-outline"
              size={16}
              className={filter.isActive ? "text-success" : "text-muted"}
            />
            <Typography type="body-xs" weight="medium">
              Enabled
            </Typography>
            <Switch
              isSelected={filter.isActive}
              onSelectedChange={(v) => onToggleActive(filter, v)}
            />
          </View>
          <View className="flex-row items-center gap-2">
            <StyledIonicons
              name="notifications-outline"
              size={16}
              className={
                filter.notificationEnabled ? "text-violet-500" : "text-muted"
              }
            />
            <Typography type="body-xs" weight="medium">
              Notification
            </Typography>
            <Switch
              isSelected={filter.notificationEnabled}
              onSelectedChange={(v) => onToggleNotifications(filter, v)}
            />
          </View>
        </View>
      </View>
    </View>
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

  useEffect(() => {
    void filterStore.loadFilters();
  }, [filterStore]);

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (filter: UserFilter) => {
    setEditing(filter);
    setSheetOpen(true);
  };

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
        getErrorMessage: () => filterStore.lastError,
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
              <BrandButton
                className="h-7 min-h-7 gap-1 self-center !rounded-full px-3"
                onPress={openCreate}
              >
                <Ionicons name="add" size={14} color={accentForeground} />
                <BrandButton.Label className="text-[13px] leading-[17px]">
                  New Filter
                </BrandButton.Label>
              </BrandButton>
            </EmptyState.Content>
          </EmptyState>
        </View>
      ) : (
        <ScrollView contentContainerClassName="px-3 pb-8 pt-3">
          <View className="mb-3 flex-row items-center justify-between">
            <Typography
              type="body"
              weight="semibold"
              className="text-[17px] text-foreground"
            >
              Your Filters
            </Typography>
            <BrandButton
              className="h-7 min-h-7 gap-1 !rounded-full px-2.5"
              onPress={openCreate}
            >
              <Ionicons name="add" size={14} color={accentForeground} />
              <BrandButton.Label className="text-[13px] leading-[17px]">
                New Filter
              </BrandButton.Label>
            </BrandButton>
          </View>

          <View className="gap-2.5">
            {filterStore.filters.map((filter) => (
              <FilterControlDockCard
                key={filter.id}
                filter={filter}
                onEdit={openEdit}
                onToggleActive={handleToggleActive}
                onToggleNotifications={handleToggleNotifications}
              />
            ))}
          </View>
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
