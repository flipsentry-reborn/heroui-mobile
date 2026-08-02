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
  Menu,
  Separator,
  SkeletonGroup,
  Switch,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import { withUniwind } from "uniwind";

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
  return filter.filterType === "Vehicle"
    ? { label: "Vehicle", icon: "car-sport-outline" }
    : { label: "Custom", icon: "options-outline" };
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
            Filters
          </Typography>
        </View>
      </View>
      <Separator />
    </View>
  );
}

function FilterControlRow({
  icon,
  iconClassName,
  title,
  description,
  selected,
  disabled,
  onSelectedChange,
}: {
  icon: IoniconName;
  iconClassName: string;
  title: string;
  description: string;
  selected: boolean;
  disabled: boolean;
  onSelectedChange: (selected: boolean) => void;
}): JSX.Element {
  return (
    <View className="flex-row items-center gap-3 py-2.5">
      <StyledIonicons name={icon} size={19} className={iconClassName} />
      <View className="min-w-0 flex-1 gap-0.5">
        <Typography className="text-[15px] font-normal text-foreground">{title}</Typography>
        <Typography type="body-xs" className="text-muted">
          {description}
        </Typography>
      </View>
      <Switch
        isSelected={selected}
        isDisabled={disabled}
        onSelectedChange={onSelectedChange}
        accessibilityLabel={title}
      />
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
  return (
    <Menu>
      <Menu.Trigger asChild>
        <Button variant="secondary" className="mt-1 min-h-11 w-full" isDisabled={disabled}>
          <StyledIonicons name="ellipsis-horizontal" size={18} className="text-foreground" />
          <Button.Label>Actions</Button.Label>
        </Button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Overlay className="bg-backdrop" />
        <Menu.Content presentation="popover" width={240} placement="top">
          <Menu.Group>
            <Menu.Item id="edit" onPress={() => onEdit(filter)}>
              <StyledIonicons name="create-outline" size={18} className="text-foreground" />
              <Menu.ItemTitle>Edit filter</Menu.ItemTitle>
            </Menu.Item>
            <Menu.Item id="delete" variant="danger" onPress={() => onDelete(filter)}>
              <StyledIonicons name="trash-outline" size={18} className="text-danger" />
              <Menu.ItemTitle>Delete filter</Menu.ItemTitle>
            </Menu.Item>
          </Menu.Group>
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  );
}

function FilterAccordionItem({
  filter,
  busy,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleSelected,
  onToggleNotifications,
}: {
  filter: UserFilter;
  busy: boolean;
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
      <View className="relative">
        <Accordion.Trigger className="gap-3 px-3 py-3 pr-14">
          <View className="h-9 w-1.5 rounded-full" style={{ backgroundColor: filter.color }} />
          <View className="min-w-0 flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              <Typography
                className="min-w-0 flex-1 text-[15px] font-medium text-foreground"
                numberOfLines={1}
              >
                {filter.name}
              </Typography>
              {!filter.isActive ? (
                <Chip size="sm" variant="secondary">
                  <Chip.Label className="text-xs text-muted">Paused</Chip.Label>
                </Chip>
              ) : null}
            </View>
            <View className="flex-row items-center gap-1.5">
              <StyledIonicons name={meta.icon} size={15} className="text-muted" />
              <Typography type="body-xs" className="min-w-0 flex-1 text-muted" numberOfLines={1}>
                {collapsedSummary(filter)}
              </Typography>
            </View>
          </View>
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Pressable
          onPress={() => onToggleSelected(filter, !filter.isSelected)}
          disabled={busy}
          hitSlop={6}
          accessibilityRole="checkbox"
          accessibilityLabel={`Select ${filter.name}`}
          accessibilityState={{ checked: filter.isSelected, disabled: busy }}
          className="absolute right-1 top-2 h-11 w-11 items-center justify-center"
        >
          <StyledIonicons
            name={filter.isSelected ? "checkmark-circle" : "checkmark-circle-outline"}
            size={24}
            className={filter.isSelected ? "text-success" : "text-muted opacity-55"}
          />
        </Pressable>
      </View>

      <Accordion.Content className="px-3 pb-3 pt-0">
        {criteria.length > 0 ? (
          <View className="mb-3 flex-row flex-wrap gap-1.5">
            {criteria.map((label, index) => (
              <Chip key={`${label}-${index}`} size="sm" variant="secondary">
                <Chip.Label className="text-xs text-muted">{label}</Chip.Label>
              </Chip>
            ))}
          </View>
        ) : (
          <Typography type="body-xs" className="mb-3 text-muted">
            No optional criteria set.
          </Typography>
        )}

        <View className="overflow-hidden rounded-xl bg-surface-secondary px-3">
          <FilterControlRow
            icon="power-outline"
            iconClassName={filter.isActive ? "text-success" : "text-muted"}
            title="Enabled"
            description="Match this filter against new listings."
            selected={filter.isActive}
            disabled={busy}
            onSelectedChange={(selected) => onToggleActive(filter, selected)}
          />
          <Separator className="opacity-50" />
          <FilterControlRow
            icon="notifications-outline"
            iconClassName={filter.notificationEnabled ? "text-foreground" : "text-muted"}
            title="Notifications"
            description="Allow alerts for listings matched by this filter."
            selected={filter.notificationEnabled}
            disabled={busy}
            onSelectedChange={(selected) => onToggleNotifications(filter, selected)}
          />
        </View>

        <FilterActionsMenu filter={filter} disabled={busy} onEdit={onEdit} onDelete={onDelete} />
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<UserFilter | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedFilter, setExpandedFilter] = useState<string | undefined>();

  useEffect(() => {
    void filterStore.loadFilters();
  }, [filterStore]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setSheetOpen(true);
  }, []);

  const openEdit = useCallback((filter: UserFilter) => {
    setEditing(filter);
    setSheetOpen(true);
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
        kind: active ? "start" : "pause",
        subject: "filter",
        title: filter.name,
        onCommit: async () =>
          (await filterStore.updateFilter(filter.id, { isActive: active })) != null,
        getErrorMessage: () => filterStore.lastError,
      });
    },
    [filterStore, toast]
  );

  const handleToggleSelected = useCallback(
    (filter: UserFilter, selected: boolean) => {
      showSearchActionProgress(toast, {
        kind: "update",
        subject: "filter",
        title: `${filter.name}: Selection`,
        onCommit: async () =>
          (await filterStore.updateFilter(filter.id, {
            isSelected: selected,
          })) != null,
        getErrorMessage: () => filterStore.lastError,
      });
    },
    [filterStore, toast]
  );

  const handleToggleNotifications = useCallback(
    (filter: UserFilter, enabled: boolean) => {
      showSearchActionProgress(toast, {
        kind: "update",
        subject: "filter",
        title: `${filter.name}: Notifications`,
        onCommit: async () =>
          (await filterStore.updateFilter(filter.id, {
            notificationEnabled: enabled,
          })) != null,
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
                Your filters
              </Typography>
              <Typography type="body-xs" className="mt-0.5 text-muted">
                Tap the checkmark to select a filter.
              </Typography>
            </View>
            <Button size="sm" variant="secondary" className="min-h-9" onPress={openCreate}>
              <StyledIonicons name="add" size={16} className="text-foreground" />
              <Button.Label>New filter</Button.Label>
            </Button>
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
              className="mx-3 gap-2"
            >
              {filterStore.filters.map((filter) => (
                <FilterAccordionItem
                  key={filter.id}
                  filter={filter}
                  busy={filterStore.submitting}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onToggleSelected={handleToggleSelected}
                  onToggleNotifications={handleToggleNotifications}
                />
              ))}
            </Accordion>
          ) : filterStore.lastError == null ? (
            <View className="mx-3 mt-6 rounded-xl bg-surface px-4 py-10">
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
                  <Button variant="secondary" className="min-h-11" onPress={openCreate}>
                    <StyledIonicons name="add" size={18} className="text-foreground" />
                    <Button.Label>Create filter</Button.Label>
                  </Button>
                </EmptyState.Content>
              </EmptyState>
            </View>
          ) : null}
        </ScrollView>
      )}

      <FilterBottomSheet isOpen={sheetOpen} onOpenChange={setSheetOpen} editingFilter={editing} />
    </View>
  );
});
