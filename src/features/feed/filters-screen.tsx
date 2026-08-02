import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import type { ComponentProps, JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Accordion,
  Alert,
  Button,
  Chip,
  ListGroup,
  Menu,
  Separator,
  SkeletonGroup,
  Switch,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import { Badge, EmptyState } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { BrandButton } from "@/components/ui/brand-button";
import { FilterBottomSheet } from "@/features/feed/filter-bottom-sheet";
import { showSearchActionProgress } from "@/features/home/search-action-progress-toast";
import { formatOpenRangeLabel } from "@/features/home/search-bottom-sheet-price-sheet";
import { SearchBottomSheetRow } from "@/features/home/search-bottom-sheet-row";
import { formatPriceShort } from "@/mocks/services/home";
import type { UserFilter } from "@/models/user-filter";
import { useStore } from "@/store/store";

const StyledIonicons = withUniwind(Ionicons);
type IoniconName = ComponentProps<typeof Ionicons>["name"];

function filterTypeMeta(filter: UserFilter): {
  label: string;
  icon: IoniconName;
  iconClassName: string;
} {
  return filter.filterType === "Vehicle"
    ? { label: "Vehicle", icon: "car-sport-outline", iconClassName: "text-emerald-500" }
    : { label: "Custom", icon: "options-outline", iconClassName: "text-orange-500" };
}

function keywordCount(filter: UserFilter): number {
  return (filter.titleIncluders?.length ?? 0) + (filter.descriptionIncluders?.length ?? 0);
}

function priceLabel(filter: UserFilter): string | null {
  const query = filter.filterType === "Vehicle" ? filter.vehicleQuery : filter.customQuery;
  if (query == null || (query.minPrice == null && query.maxPrice == null)) {
    return null;
  }
  return formatOpenRangeLabel(
    query.minPrice != null ? formatPriceShort(query.minPrice) : "",
    query.maxPrice != null ? formatPriceShort(query.maxPrice) : ""
  );
}

function criteriaLabels(filter: UserFilter): string[] {
  const labels: string[] = [];
  const price = priceLabel(filter);
  if (price != null) labels.push(`Price ${price}`);

  if (filter.filterType === "Vehicle" && filter.vehicleQuery != null) {
    const query = filter.vehicleQuery;
    if (query.minYear != null || query.maxYear != null) {
      labels.push(
        `Year ${formatOpenRangeLabel(
          query.minYear != null ? String(query.minYear) : "",
          query.maxYear != null ? String(query.maxYear) : ""
        )}`
      );
    }
    if (query.minMileage != null || query.maxMileage != null) {
      labels.push(
        `Mileage ${formatOpenRangeLabel(
          query.minMileage != null ? formatPriceShort(query.minMileage) : "",
          query.maxMileage != null ? formatPriceShort(query.maxMileage) : "",
          { unit: " mi" }
        )}`
      );
    }
  }

  if (filter.filterType === "Custom" && filter.customQuery?.query?.trim()) {
    labels.push(`Query: ${filter.customQuery.query.trim()}`);
  }

  const keywords = keywordCount(filter);
  if (keywords > 0) {
    labels.push(keywords === 1 ? "1 keyword" : `${keywords} keywords`);
  }
  return labels;
}

function collapsedSummary(filter: UserFilter): string {
  const labels = criteriaLabels(filter);
  return [filterTypeMeta(filter).label, ...labels.slice(0, 2)].join(" · ");
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
            Feed Filters
          </Typography>
        </View>
      </View>
      <Separator />
    </View>
  );
}

function FilterActionsMenu({
  filter,
  disabled,
  onEdit,
  onDelete,
}: {
  filter: UserFilter;
  disabled: boolean;
  onEdit: (filter: UserFilter) => void;
  onDelete: (filter: UserFilter) => void;
}): JSX.Element {
  const [accentForeground] = useThemeColor(["accent-foreground"]);

  return (
    <Menu>
      <Menu.Trigger asChild>
        <BrandButton className="mt-1 min-h-12 w-full" isDisabled={disabled}>
          <Ionicons name="create" size={18} color={accentForeground} />
          <BrandButton.Label>Actions</BrandButton.Label>
        </BrandButton>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Overlay className="bg-backdrop" />
        <Menu.Content presentation="popover" width={240} placement="top">
          <Menu.Group>
            <Menu.Item id="edit" onPress={() => onEdit(filter)}>
              <StyledIonicons name="create-outline" size={18} className="text-foreground" />
              <Menu.ItemTitle>Edit</Menu.ItemTitle>
            </Menu.Item>
            <Menu.Item id="delete" variant="danger" onPress={() => onDelete(filter)}>
              <StyledIonicons name="trash-outline" size={18} className="text-danger" />
              <Menu.ItemTitle>Delete</Menu.ItemTitle>
            </Menu.Item>
          </Menu.Group>
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  );
}

function SelectedFiltersSection({
  filters,
  onDeselect,
}: {
  filters: UserFilter[];
  onDeselect: (filter: UserFilter) => void;
}): JSX.Element | null {
  if (filters.length === 0) return null;

  return (
    <View className="mx-3 mt-5 overflow-hidden rounded-3xl bg-surface px-3 py-3">
      <Typography type="body-xs" className="mb-2.5 text-muted">
        Feed Filters
      </Typography>
      <View className="flex-row flex-wrap gap-2">
        {filters.map((filter) => (
          <View
            key={filter.id}
            className="flex-row items-center gap-2 rounded-full border border-border bg-surface-secondary px-2.5 py-1.5"
          >
            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: filter.color }} />
            <Typography
              type="body-xs"
              className="max-w-[140px] text-foreground"
              numberOfLines={1}
            >
              {filter.name}
            </Typography>
            <Pressable
              onPress={() => onDeselect(filter)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Deselect ${filter.name}`}
              className="h-5 w-5 items-center justify-center"
            >
              <StyledIonicons name="close" size={14} className="text-muted" />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

function FilterAccordionItem({
  filter,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleSelected,
  onToggleNotifications,
}: {
  filter: UserFilter;
  onEdit: (filter: UserFilter) => void;
  onDelete: (filter: UserFilter) => void;
  onToggleActive: (filter: UserFilter, selected: boolean) => void;
  onToggleSelected: (filter: UserFilter, selected: boolean) => void;
  onToggleNotifications: (filter: UserFilter, selected: boolean) => void;
}): JSX.Element {
  const meta = filterTypeMeta(filter);
  const criteria = criteriaLabels(filter);

  return (
    <Accordion.Item value={filter.id}>
      <Accordion.Trigger className="gap-3 px-3 py-3">
        <View
          className="h-9 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: filter.color }}
        />
        <View className="min-w-0 flex-1 gap-1.5">
          <View className="flex-row items-center gap-2">
            <Typography
              type="body"
              className="min-w-0 flex-1 text-[15px] font-medium text-foreground"
              numberOfLines={1}
            >
              {filter.name}
            </Typography>
            {!filter.isActive ? (
              <Badge color="warning" variant="soft" size="sm">
                Paused
              </Badge>
            ) : null}
          </View>
          <View className="flex-row items-center gap-1.5">
            <StyledIonicons name={meta.icon} size={15} className={meta.iconClassName} />
            <Typography type="body-xs" className="min-w-0 flex-1 text-muted" numberOfLines={1}>
              {collapsedSummary(filter)}
            </Typography>
          </View>
        </View>
        <Accordion.Indicator />
        <Pressable
          onPress={() => onToggleSelected(filter, !filter.isSelected)}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityLabel={`Select ${filter.name}`}
          accessibilityState={{ checked: filter.isSelected }}
          className="h-10 w-10 shrink-0 items-center justify-center"
        >
          <StyledIonicons
            name={filter.isSelected ? "checkmark-circle" : "checkmark-circle-outline"}
            size={24}
            className={filter.isSelected ? "text-success" : "text-muted opacity-55"}
          />
        </Pressable>
      </Accordion.Trigger>

      <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
        {criteria.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {criteria.map((label, index) => (
              <Chip key={`${label}-${index}`} size="sm" variant="secondary">
                <Chip.Label className="text-[10px] text-muted">{label}</Chip.Label>
              </Chip>
            ))}
          </View>
        ) : (
          <Typography type="body-xs" className="text-muted">
            No optional criteria set.
          </Typography>
        )}

        <ListGroup>
          <SearchBottomSheetRow
            icon="power"
            iconClassName={filter.isActive ? "text-emerald-500" : "text-muted"}
            title="Enabled"
            description="Match this filter against new listings."
            showChevron={false}
            isLast={false}
            right={
              <Switch
                isSelected={filter.isActive}
                onSelectedChange={(selected) => onToggleActive(filter, selected)}
                accessibilityLabel="Enabled"
              />
            }
          />
          <SearchBottomSheetRow
            icon="notifications"
            iconClassName={filter.notificationEnabled ? "text-violet-500" : "text-muted"}
            title="Notifications"
            description="Allow alerts for listings matched by this filter."
            showChevron={false}
            isLast
            right={
              <Switch
                isSelected={filter.notificationEnabled}
                onSelectedChange={(selected) => onToggleNotifications(filter, selected)}
                accessibilityLabel="Notifications"
              />
            }
          />
        </ListGroup>

        <FilterActionsMenu filter={filter} disabled={false} onEdit={onEdit} onDelete={onDelete} />
      </Accordion.Content>
    </Accordion.Item>
  );
}

function FiltersSkeleton(): JSX.Element {
  return (
    <SkeletonGroup isLoading isSkeletonOnly className="gap-3 px-3 pt-4">
      <View className="mb-1 flex-row items-center justify-between">
        <SkeletonGroup.Item className="h-5 w-24 rounded-md" />
        <SkeletonGroup.Item className="h-9 w-28 rounded-md" />
      </View>
      {[0, 1, 2].map((key) => (
        <View key={key} className="flex-row items-center gap-3 rounded-xl bg-surface px-3 py-3">
          <SkeletonGroup.Item className="h-9 w-1.5 rounded-full" />
          <View className="flex-1 gap-2">
            <SkeletonGroup.Item className="h-4 w-36 rounded-md" />
            <SkeletonGroup.Item className="h-3 w-52 rounded-md" />
          </View>
          <SkeletonGroup.Item className="h-5 w-5 rounded-md" />
        </View>
      ))}
    </SkeletonGroup>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }): JSX.Element {
  return (
    <Alert status="danger" className="mx-3 mb-3">
      <Alert.Indicator />
      <Alert.Content className="min-w-0 flex-1">
        <Alert.Title>Could not load filters</Alert.Title>
        <Alert.Description>{message}</Alert.Description>
        <Button size="sm" variant="danger-soft" className="mt-2 self-start" onPress={onRetry}>
          <Button.Label>Retry</Button.Label>
        </Button>
      </Alert.Content>
    </Alert>
  );
}

/** Manage saved filters and their feed/notification behavior. */
export const FiltersScreen = observer(function FiltersScreen({
  onBack,
}: {
  onBack: () => void;
}): JSX.Element {
  const { filterStore } = useStore();
  const { toast } = useToast();
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const [sheetOpen, setSheetOpen] = useState(false);
  /** Remount sheet on each open (same as home New Search) so create form isn't stale. */
  const [sheetMounted, setSheetMounted] = useState(false);
  const [editing, setEditing] = useState<UserFilter | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedFilter, setExpandedFilter] = useState<string | undefined>();

  useEffect(() => {
    void filterStore.loadFilters();
  }, [filterStore]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setSheetMounted(true);
    setSheetOpen(true);
  }, []);

  const openEdit = useCallback((filter: UserFilter) => {
    setEditing(filter);
    setSheetMounted(true);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      // SheetShell already finished the close animation before calling onClose.
      setSheetMounted(false);
      setEditing(null);
    }
  }, []);

  const retry = useCallback(() => {
    void filterStore.loadFilters(true);
  }, [filterStore]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await filterStore.loadFilters(true);
    setRefreshing(false);
  }, [filterStore]);

  const handleToggleActive = useCallback(
    (filter: UserFilter, active: boolean) => {
      showSearchActionProgress(toast, {
        kind: active ? "enable" : "disable",
        subject: "filter",
        title: filter.name,
        onCommit: async () => {
          const updated = await filterStore.updateFilter(filter.id, { isActive: active });
          return updated != null;
        },
        getErrorMessage: () => filterStore.lastError,
      });
    },
    [filterStore, toast]
  );

  const handleToggleSelected = useCallback(
    (filter: UserFilter, selected: boolean) => {
      showSearchActionProgress(toast, {
        kind: selected ? "select" : "deselect",
        subject: "filter",
        title: filter.name,
        onCommit: async () => {
          const updated = await filterStore.updateFilter(filter.id, { isSelected: selected });
          return updated != null;
        },
        getErrorMessage: () => filterStore.lastError,
      });
    },
    [filterStore, toast]
  );

  const handleToggleNotifications = useCallback(
    (filter: UserFilter, enabled: boolean) => {
      showSearchActionProgress(toast, {
        kind: enabled ? "notificationsOn" : "notificationsOff",
        subject: "filter",
        title: filter.name,
        onCommit: async () => {
          const updated = await filterStore.updateFilter(filter.id, {
            notificationEnabled: enabled,
          });
          return updated != null;
        },
        getErrorMessage: () => filterStore.lastError,
      });
    },
    [filterStore, toast]
  );

  const handleDelete = useCallback(
    (filter: UserFilter) => {
      showSearchActionProgress(toast, {
        kind: "delete",
        subject: "filter",
        title: filter.name,
        onCommit: () => filterStore.deleteFilter(filter.id),
        getErrorMessage: () => filterStore.lastError,
      });
    },
    [filterStore, toast]
  );

  const initialLoading = !filterStore.hasLoaded && filterStore.loading;
  const hasFilters = filterStore.filters.length > 0;
  const selectedFilters = filterStore.selectedFilters;

  return (
    <View className="flex-1 bg-background">
      <FiltersHeader onBack={onBack} />

      {initialLoading ? (
        <FiltersSkeleton />
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-10 pt-3"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        >
          <View className="mb-3 flex-row items-center justify-between px-3">
            <View className="min-w-0 flex-1 pr-3">
              <Typography className="text-[17px] font-semibold text-foreground">
                Feed Filters
              </Typography>
              <Typography type="body-xs" className="mt-0.5 text-muted">
                Tap the checkmark to select a filter.
              </Typography>
            </View>
            <BrandButton className="h-9 min-h-9 gap-1 !rounded-full px-2.5" onPress={openCreate}>
              <Ionicons name="add" size={14} color={accentForeground} />
              <BrandButton.Label className="text-[13px] leading-[17px]">
                New Filter
              </BrandButton.Label>
            </BrandButton>
          </View>

          {filterStore.lastError != null ? (
            <LoadError message={filterStore.lastError} onRetry={retry} />
          ) : null}

          {hasFilters ? (
            <Accordion
              value={expandedFilter}
              onValueChange={(next: string | string[] | undefined) => {
                const value = Array.isArray(next) ? next[0] : next;
                setExpandedFilter(
                  typeof value === "string" && value.length > 0 ? value : undefined
                );
              }}
              selectionMode="single"
              isCollapsible
              variant="surface"
              className="mx-3 w-auto gap-2"
            >
              {filterStore.filters.map((filter) => (
                <FilterAccordionItem
                  key={filter.id}
                  filter={filter}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onToggleSelected={handleToggleSelected}
                  onToggleNotifications={handleToggleNotifications}
                />
              ))}
            </Accordion>
          ) : filterStore.lastError == null ? (
            <View className="mx-3 mt-6 rounded-3xl bg-surface px-4 py-10">
              <EmptyState>
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <StyledIonicons name="options-outline" size={21} className="text-muted" />
                  </EmptyState.Media>
                  <EmptyState.Title>No filters yet</EmptyState.Title>
                  <EmptyState.Description>
                    Create a Vehicle or Custom filter to organize matching listings. Filters do not
                    need a location.
                  </EmptyState.Description>
                </EmptyState.Header>
                <EmptyState.Content>
                  <BrandButton className="min-h-11 px-5" onPress={openCreate}>
                    <Ionicons name="add" size={18} color={accentForeground} />
                    <BrandButton.Label>Create filter</BrandButton.Label>
                  </BrandButton>
                </EmptyState.Content>
              </EmptyState>
            </View>
          ) : null}

          <SelectedFiltersSection
            filters={selectedFilters}
            onDeselect={(filter) => {
              handleToggleSelected(filter, false);
            }}
          />
        </ScrollView>
      )}

      {sheetMounted ? (
        <FilterBottomSheet
          isOpen={sheetOpen}
          onOpenChange={handleSheetOpenChange}
          editingFilter={editing}
        />
      ) : null}
    </View>
  );
});
