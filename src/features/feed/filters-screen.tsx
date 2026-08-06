import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import Animated, {
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Accordion,
  Alert,
  BottomSheet,
  Button,
  Checkbox,
  Chip,
  cn,
  ControlField,
  Label,
  ListGroup,
  Menu,
  Separator,
  SkeletonGroup,
  Switch,
  Typography,
  useAccordion,
  useAccordionItem,
  useThemeColor,
  useToast,
} from "heroui-native";
import { Badge, EmptyState } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { BrandButton } from "@/components/ui/brand-button";
import {
  applyScoreTierSelection,
  clampMinProfit,
  normalizeScoreTierCascade,
  type FeedDisplayPrefs,
  type ScoreTierKey,
} from "@/domain/feed-display-prefs";
import { ValuationTierBadge } from "@/features/feed/feed-badge";
import { FilterBottomSheet } from "@/features/feed/filter-bottom-sheet";
import { showFilterToast } from "@/features/feed/filter-toast";
import {
  formatMinProfitLabel,
  MinProfitSlider,
} from "@/features/feed/min-profit-slider";
import { HideListingsSheet } from "@/features/settings/hide-listings-sheet";
import type { ValuationTier } from "@/models/feed";
import { showSearchActionProgress } from "@/features/home/search-action-progress-toast";
import { formatOpenRangeLabel } from "@/features/home/search-bottom-sheet-price-sheet";
import { SearchBottomSheetRow } from "@/features/home/search-bottom-sheet-row";
import {
  SearchStatusSegment,
  type SearchStatusFilter,
} from "@/features/home/search-status-segment";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import { customFilterSearchGroupTitle } from "@/features/feed/filter-search-groups-sheet";
import { toUserErrorMessage } from "@/lib/user-error-message";
import type { UserPreferences as SettingsHidePrefs } from "@/mocks/data/settings";
import { formatPriceShort } from "@/mocks/services/home";
import type { UserFilter } from "@/models/user-filter";
import { useStore } from "@/store/store";

const StyledIonicons = withUniwind(Ionicons);
const StyledAnimatedView = withUniwind(Animated.View);

/** Matches home SearchCards `AccordionWithDepthEffect` layout spring. */
const DEPTH_LAYOUT_TRANSITION = LinearTransition.springify()
  .damping(70)
  .stiffness(1000)
  .mass(2);

const SCORE_TIER_OPTIONS: {
  key: ScoreTierKey;
  label: string;
  tier: ValuationTier;
}[] = [
  { key: "showBad", label: "Bad", tier: "overpriced" },
  { key: "showFair", label: "Fair", tier: "fairPrice" },
  { key: "showGood", label: "Good", tier: "goodValue" },
  { key: "showGreat", label: "Great", tier: "greatDeal" },
];

function displayPrefsSummary(prefs: FeedDisplayPrefs): string {
  const tiers = SCORE_TIER_OPTIONS.filter((option) => prefs[option.key]).map(
    (option) => option.label,
  );
  const scorePart =
    tiers.length === 0 || tiers.length === SCORE_TIER_OPTIONS.length
      ? "All scores"
      : tiers.join(", ");
  return `${formatMinProfitLabel(prefs.minProfit)} · ${scorePart}`;
}

function toHideListingsPrefs(
  api: {
    showScams: boolean;
    showDealers: boolean;
    showDealerships: boolean;
    showMajorIssue: boolean;
    showRebuiltTitle: boolean;
    showSalvageTitle: boolean;
    distanceUnit: "mi" | "km";
  } | null,
): SettingsHidePrefs {
  return {
    showScams: api?.showScams ?? true,
    showDealers: api?.showDealers ?? true,
    showDealerships: api?.showDealerships ?? true,
    showMajorDamaged: api?.showMajorIssue ?? true,
    showRebuiltTitle: api?.showRebuiltTitle ?? true,
    showSalvageTitle: api?.showSalvageTitle ?? true,
    distanceUnit: api?.distanceUnit ?? "mi",
    appearance: "dark",
  };
}

function filterTypeLabel(filter: UserFilter): string {
  return filter.filterType === "Vehicle" ? "Vehicle" : "Custom";
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

/** Chip labels styled like home search cards (price/year/mileage ranges, no prefixes). */
function metaChips(
  filter: UserFilter,
  searchGroupLabels?: Map<string, string>,
): string[] {
  const chips: string[] = [filterTypeLabel(filter)];
  const price = priceLabel(filter);
  if (price != null) chips.push(price);

  if (filter.filterType === "Vehicle" && filter.vehicleQuery != null) {
    const query = filter.vehicleQuery;
    if (query.minYear != null || query.maxYear != null) {
      chips.push(
        formatOpenRangeLabel(
          query.minYear != null ? String(query.minYear) : "",
          query.maxYear != null ? String(query.maxYear) : "",
        ),
      );
    }
    if (query.minMileage != null || query.maxMileage != null) {
      chips.push(
        formatOpenRangeLabel(
          query.minMileage != null ? formatPriceShort(query.minMileage) : "",
          query.maxMileage != null ? formatPriceShort(query.maxMileage) : "",
          { unit: " mi" },
        ),
      );
    }
  }

  if (filter.filterType === "Custom") {
    const ids = filter.searchGroupIds ?? [];
    if (ids.length > 0) {
      const names = ids
        .map((id) => searchGroupLabels?.get(id))
        .filter((name): name is string => !!name);
      if (names.length > 0) {
        chips.push(names.length <= 2 ? names.join(", ") : `${names.length} searches`);
      } else {
        chips.push(ids.length === 1 ? "1 search" : `${ids.length} searches`);
      }
    }
  }

  const keywords = keywordCount(filter);
  if (keywords > 0) {
    chips.push(keywords === 1 ? "1 keyword" : `${keywords} keywords`);
  }
  return chips;
}

function matchesStatusFilter(
  filter: UserFilter,
  statusFilter: SearchStatusFilter,
): boolean {
  if (statusFilter === "all") return true;
  return statusFilter === "paused" ? !filter.isActive : filter.isActive;
}

function FiltersHeader({ onBack }: { onBack: () => void }): JSX.Element {
  const insets = useSafeAreaInsets();
  const foreground = useThemeColor("foreground");

  return (
    <View style={{ paddingTop: insets.top }} className="bg-background">
      <View className="flex-row items-center px-1.5 pb-2.5 pt-1">
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
            className="text-foreground"
          >
            Feed Filters
          </Typography>
          <Typography type="body-xs" className="mt-0.5 text-muted" numberOfLines={1}>
            Choose what appears in your feed.
          </Typography>
        </View>
      </View>
      <Separator />
    </View>
  );
}

function FilterActionsMenu({
  filter,
  onEdit,
  onDelete,
  onToggle,
}: {
  filter: UserFilter;
  onEdit: (filter: UserFilter) => void;
  onDelete: (filter: UserFilter) => void;
  onToggle: (filter: UserFilter, active: boolean) => void;
}): JSX.Element {
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const isPaused = !filter.isActive;

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
        <Menu.Content presentation="popover" width={240} placement="top">
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
              id="toggle"
              onPress={() => onToggle(filter, isPaused)}
            >
              <StyledIonicons
                name={isPaused ? "play-outline" : "pause-outline"}
                size={18}
                className={isPaused ? "text-success" : "text-warning"}
              />
              <Menu.ItemTitle
                className={isPaused ? "text-success" : "text-warning"}
              >
                {isPaused ? "Start" : "Pause"}
              </Menu.ItemTitle>
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

function MetaChipRow({
  filter,
  searchGroupLabels,
}: {
  filter: UserFilter;
  searchGroupLabels: Map<string, string>;
}): JSX.Element {
  const chips = metaChips(filter, searchGroupLabels);
  if (chips.length === 0) {
    return (
      <Typography type="body-xs" className="text-muted">
        No optional criteria set.
      </Typography>
    );
  }
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {chips.map((label, index) => (
        <Chip key={`${label}-${index}`} size="sm" variant="secondary">
          <Chip.Label className="text-[10px] text-muted">{label}</Chip.Label>
        </Chip>
      ))}
    </View>
  );
}

const FeedDisplayPrefsBar = observer(function FeedDisplayPrefsBar(): JSX.Element {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { filterStore, userStore } = useStore();
  const prefs = filterStore.displayPrefs;
  const [dealsSheetOpen, setDealsSheetOpen] = useState(false);
  const [hideSheetOpen, setHideSheetOpen] = useState(false);
  const [draft, setDraft] = useState<FeedDisplayPrefs>(prefs);

  useFocusEffect(
    useCallback(() => {
      if (userStore.preferences == null) {
        void userStore.loadPreferences();
      }
    }, [userStore]),
  );

  useEffect(() => {
    if (dealsSheetOpen) setDraft(prefs);
  }, [dealsSheetOpen, prefs]);

  const summary = useMemo(() => displayPrefsSummary(prefs), [prefs]);
  const hidePrefs = useMemo(
    () => toHideListingsPrefs(userStore.preferences),
    [userStore.preferences],
  );

  const setTier = useCallback((key: ScoreTierKey, selected: boolean) => {
    setDraft((current) =>
      normalizeScoreTierCascade({
        ...current,
        ...applyScoreTierSelection(current, key, selected),
        showNoValuation: true,
      }),
    );
  }, []);

  const handleDealsSheetClose = useCallback(() => {
    const next = normalizeScoreTierCascade({
      ...draft,
      minProfit: clampMinProfit(draft.minProfit),
      showNoValuation: true,
    });
    void filterStore.setDisplayPrefs({
      minProfit: next.minProfit,
      showGreat: next.showGreat,
      showGood: next.showGood,
      showFair: next.showFair,
      showBad: next.showBad,
    });
    setDealsSheetOpen(false);
  }, [draft, filterStore]);

  const patchHidePrefs = useCallback(
    async (patch: Partial<SettingsHidePrefs>) => {
      const ok = await filterStore.updateHidePrefs({
        showScams: patch.showScams,
        showDealers: patch.showDealers,
        showDealerships: patch.showDealerships,
        showMajorIssue: patch.showMajorDamaged,
        showRebuiltTitle: patch.showRebuiltTitle,
        showSalvageTitle: patch.showSalvageTitle,
      });
      if (!ok) {
        toast.show({
          variant: "danger",
          label: filterStore.lastError ?? toUserErrorMessage(new Error("Update failed")),
          duration: 2200,
        });
      }
    },
    [filterStore, toast],
  );

  return (
    <>
      <View
        className="border-t border-border bg-background px-3 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 10) }}
      >
        <ListGroup className="overflow-hidden rounded-3xl bg-surface">
          <SearchBottomSheetRow
            icon="options-outline"
            iconClassName="text-muted"
            title="Show These Deals"
            description={summary}
            onPress={() => setDealsSheetOpen(true)}
          />
          <SearchBottomSheetRow
            icon="eye-off-outline"
            iconClassName="text-muted"
            title="Hide listings"
            description="Spam, dealers, damage, and titles"
            onPress={() => setHideSheetOpen(true)}
            isLast
          />
        </ListGroup>
      </View>

      <SheetShell visible={dealsSheetOpen} onClose={handleDealsSheetClose}>
        <BottomSheet.Content
          className={SHEET_CONTENT_CLASS_NAME}
          backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
          handleComponent={null}
          contentContainerClassName={SHEET_CONTENT_CONTAINER_CLASS_NAME}
        >
          <View>
            <View className="items-center px-8 pt-3 pb-2">
              <Typography type="body" weight="normal">
                Show These Deals
              </Typography>
            </View>

            <View className="mb-5 mt-5 gap-4 px-3">
              <Alert status="warning">
                <Alert.Indicator />
                <Alert.Content className="min-w-0 flex-1">
                  <Alert.Title>
                    This automatically applies to your notification settings. Use with
                    caution.
                  </Alert.Title>
                </Alert.Content>
              </Alert>

              <View className="overflow-hidden rounded-3xl bg-surface px-4 py-4">
                <View className="mb-1 flex-row items-center justify-between">
                  <Typography type="body" className="text-foreground">
                    Min profit
                  </Typography>
                  <Typography type="body-sm" className="text-muted">
                    {formatMinProfitLabel(draft.minProfit)}
                  </Typography>
                </View>
                <MinProfitSlider
                  value={draft.minProfit}
                  onChange={(minProfit) => {
                    setDraft((current) =>
                      current.minProfit === minProfit ? current : { ...current, minProfit },
                    );
                  }}
                />
              </View>

              <View className="overflow-hidden rounded-3xl bg-surface px-3 py-1">
                {SCORE_TIER_OPTIONS.map((option, index) => (
                  <View key={option.key}>
                    {index > 0 ? <Separator className="my-0" /> : null}
                    <ControlField
                      isSelected={draft[option.key]}
                      onSelectedChange={(selected) => setTier(option.key, selected)}
                      className="py-3"
                      accessibilityLabel={option.label}
                    >
                      <View className="min-w-0 flex-1 flex-row items-center">
                        <ValuationTierBadge tier={option.tier} scale="detail" />
                      </View>
                      <ControlField.Indicator>
                        <Checkbox />
                      </ControlField.Indicator>
                    </ControlField>
                  </View>
                ))}
                <Separator className="my-0" />
                <ControlField isSelected isDisabled className="py-3">
                  <Label className="min-w-0 flex-1 text-[15px] font-normal text-foreground">
                    No Valuation
                  </Label>
                  <ControlField.Indicator>
                    <Checkbox isSelected isDisabled />
                  </ControlField.Indicator>
                </ControlField>
              </View>
            </View>
          </View>
        </BottomSheet.Content>
      </SheetShell>

      <HideListingsSheet
        isOpen={hideSheetOpen}
        onOpenChange={setHideSheetOpen}
        prefs={hidePrefs}
        onPatch={(patch) => void patchHidePrefs(patch)}
      />
    </>
  );
});

function FilterDepthItem({
  filter,
  index,
  filterCount,
  filterIds,
  searchGroupLabels,
  onEdit,
  onDelete,
  onToggle,
  onToggleNotifications,
}: {
  filter: UserFilter;
  index: number;
  filterCount: number;
  filterIds: string[];
  searchGroupLabels: Map<string, string>;
  onEdit: (filter: UserFilter) => void;
  onDelete: (filter: UserFilter) => void;
  onToggle: (filter: UserFilter, active: boolean) => void;
  onToggleNotifications: (filter: UserFilter, selected: boolean) => void;
}): JSX.Element {
  const { value } = useAccordion();
  const { isExpanded } = useAccordionItem();
  const scale = useSharedValue(isExpanded ? 1 : 0.97);
  const chips = metaChips(filter, searchGroupLabels);

  useEffect(() => {
    scale.value = withTiming(isExpanded ? 1 : 0.97, {
      duration: 200,
    });
  }, [isExpanded, scale]);

  const depthStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const expandedIds = useMemo(() => {
    if (Array.isArray(value)) return new Set(value);
    if (typeof value === "string" && value.length > 0) return new Set([value]);
    return new Set<string>();
  }, [value]);

  const prevId = index > 0 ? filterIds[index - 1] : undefined;
  const nextId = index < filterCount - 1 ? filterIds[index + 1] : undefined;
  const isBeforeSelected = nextId != null && expandedIds.has(nextId);
  const isAfterSelected = prevId != null && expandedIds.has(prevId);

  const showDivider =
    index < filterCount - 1 && !isExpanded && !isBeforeSelected;

  return (
    <StyledAnimatedView layout={DEPTH_LAYOUT_TRANSITION} style={depthStyle}>
      <StyledAnimatedView
        layout={DEPTH_LAYOUT_TRANSITION}
        className={cn(
          "overflow-hidden bg-surface",
          index === 0 && !isExpanded && "rounded-t-2xl",
          index === filterCount - 1 &&
            !isExpanded &&
            !isBeforeSelected &&
            "rounded-b-3xl",
          isBeforeSelected && "rounded-b-2xl",
          isExpanded && "rounded-2xl",
          isAfterSelected && "rounded-t-2xl",
          isExpanded && index === 0 && "mb-2",
          isExpanded && index > 0 && index < filterCount - 1 && "my-2",
          isExpanded && index === filterCount - 1 && "mt-2",
        )}
      >
        <Accordion.Trigger className="gap-2 px-3 py-3">
          <View
            className="h-9 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: filter.color }}
          />
          <View className="min-w-0 flex-1 gap-2">
            <View className="flex-row items-center gap-2">
              <Typography
                type="body"
                className="min-w-0 flex-1"
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
            <Typography type="body-xs" className="text-muted" numberOfLines={1}>
              {chips.slice(0, 2).join(" · ")}
            </Typography>
          </View>
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
          <MetaChipRow
            filter={filter}
            searchGroupLabels={searchGroupLabels}
          />

          <ListGroup
            className={`overflow-hidden rounded-2xl bg-surface-secondary ${
              filter.isActive ? "" : "opacity-55"
            }`}
          >
            <SearchBottomSheetRow
              icon="notifications-outline"
              iconClassName={
                filter.isActive && filter.notificationEnabled
                  ? "text-foreground"
                  : "text-muted"
              }
              title="Notifications"
              description={
                filter.isActive
                  ? "Notify me when new matches arrive"
                  : "Enable this filter to control notifications"
              }
              showChevron={false}
              isLast
              right={
                <Switch
                  isSelected={filter.isActive && filter.notificationEnabled}
                  isDisabled={!filter.isActive}
                  onSelectedChange={(selected) =>
                    onToggleNotifications(filter, selected)
                  }
                  accessibilityLabel="Notifications"
                />
              }
            />
          </ListGroup>

          {isExpanded ? (
            <FilterActionsMenu
              filter={filter}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ) : null}
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

function FiltersSkeleton(): JSX.Element {
  return (
    <SkeletonGroup isLoading isSkeletonOnly className="gap-2.5 px-3 pt-4">
      <SkeletonGroup.Item className="mb-1 h-11 w-full rounded-2xl" />
      <View className="overflow-hidden rounded-3xl bg-surface">
        {[0, 1, 2].map((key) => (
          <View key={key}>
            {key > 0 ? <Separator className="mx-3" /> : null}
            <View className="flex-row items-center gap-3 px-3 py-3">
              <SkeletonGroup.Item className="h-9 w-1.5 rounded-full" />
              <View className="flex-1 gap-2">
                <View className="flex-row items-center gap-2">
                  <SkeletonGroup.Item className="h-4 w-36 rounded-md" />
                  <SkeletonGroup.Item className="h-5 w-14 rounded-full" />
                </View>
                <SkeletonGroup.Item className="h-3 w-52 rounded-md" />
              </View>
              <SkeletonGroup.Item className="h-4 w-4 rounded-md" />
            </View>
          </View>
        ))}
      </View>
      <SkeletonGroup.Item className="mt-2 h-12 w-full rounded-2xl" />
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
  const { filterStore, feedStore, searchStore } = useStore();
  const { toast } = useToast();
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const [sheetOpen, setSheetOpen] = useState(false);
  /** Remount sheet on each open (same as home New Search) so create form isn't stale. */
  const [sheetMounted, setSheetMounted] = useState(false);
  const [editing, setEditing] = useState<UserFilter | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedFilter, setExpandedFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] =
    useState<SearchStatusFilter>("all");

  useEffect(() => {
    void filterStore.loadFilters();
    void searchStore.loadSearchGroups();
  }, [filterStore, searchStore]);

  const searchGroupLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of searchStore.searchGroups) {
      if (group.searchType === "car") continue;
      map.set(group.id, customFilterSearchGroupTitle(group));
    }
    return map;
  }, [searchStore.searchGroups]);

  const { allFilters, activeFilters, pausedFilters, visibleFilters } =
    useMemo(() => {
      const all = filterStore.filters;
      const active: UserFilter[] = [];
      const paused: UserFilter[] = [];
      for (const filter of all) {
        if (filter.isActive) active.push(filter);
        else paused.push(filter);
      }
      return {
        allFilters: all,
        activeFilters: active,
        pausedFilters: paused,
        visibleFilters: all.filter((filter) =>
          matchesStatusFilter(filter, statusFilter),
        ),
      };
    }, [filterStore.filters, statusFilter]);

  const visibleIds = useMemo(
    () => visibleFilters.map((filter) => filter.id),
    [visibleFilters],
  );

  useEffect(() => {
    if (expandedFilter != null && !visibleIds.includes(expandedFilter)) {
      setExpandedFilter(undefined);
    }
  }, [expandedFilter, visibleIds]);

  useFocusEffect(
    useCallback(() => {
      filterStore.setFiltersScreenOpen(true);
      return () => {
        filterStore.setFiltersScreenOpen(false);
      };
    }, [filterStore]),
  );

  const handleBack = useCallback(() => {
    // Start wipe/refetch before pop so the applying dialog is visible on return.
    void feedStore.beginFilterApplyIfNeeded();
    onBack();
  }, [feedStore, onBack]);

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
      showFilterToast(toast, {
        kind: enabled ? "notificationsOn" : "notificationsOff",
        title: filter.name,
      });
      void filterStore
        .updateFilter(filter.id, { notificationEnabled: enabled })
        .then((updated) => {
          if (updated != null) return;
          showFilterToast(toast, {
            kind: "error",
            title: filter.name,
            errorLabel: filterStore.lastError ?? "Could not update filter",
          });
        });
    },
    [filterStore, toast],
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
    [filterStore, toast],
  );

  const initialLoading = !filterStore.hasLoaded && filterStore.loading;
  const hasFilters = allFilters.length > 0;
  const emptyMessage =
    statusFilter === "paused"
      ? "No paused filters"
      : statusFilter === "active"
        ? "No active filters — start one to organize your feed."
        : "No filters yet";

  return (
    <View className="flex-1 bg-background">
      <FiltersHeader onBack={handleBack} />

      {initialLoading ? (
        <View className="flex-1">
          <FiltersSkeleton />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-6 pt-3"
          stickyHeaderIndices={
            hasFilters && filterStore.lastError == null ? [1] : undefined
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
        >
          {filterStore.lastError != null ? (
            <LoadError message={filterStore.lastError} onRetry={retry} />
          ) : null}

          {hasFilters ? (
            <>
              <View className="mx-3 mb-3">
                <BrandButton className="min-h-12 w-full" onPress={openCreate}>
                  <Ionicons name="add" size={18} color={accentForeground} />
                  <BrandButton.Label>Add Filter</BrandButton.Label>
                </BrandButton>
              </View>

              <SearchStatusSegment
                value={statusFilter}
                onValueChange={setStatusFilter}
                allCount={allFilters.length}
                activeCount={activeFilters.length}
                pausedCount={pausedFilters.length}
              />

              {visibleFilters.length > 0 ? (
                <Accordion
                  value={expandedFilter}
                  onValueChange={(next: string | string[] | undefined) => {
                    const value = Array.isArray(next) ? next[0] : next;
                    setExpandedFilter(
                      typeof value === "string" && value.length > 0
                        ? value
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
                  {visibleFilters.map((filter, index) => (
                    <Accordion.Item
                      key={filter.id}
                      value={filter.id}
                      className="overflow-visible"
                    >
                      <FilterDepthItem
                        filter={filter}
                        index={index}
                        filterCount={visibleFilters.length}
                        filterIds={visibleIds}
                        searchGroupLabels={searchGroupLabels}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onToggle={handleToggleActive}
                        onToggleNotifications={handleToggleNotifications}
                      />
                    </Accordion.Item>
                  ))}
                </Accordion>
              ) : (
                <View className="mx-3 items-center rounded-3xl bg-surface px-4 py-8">
                  <Typography type="body-sm" className="text-muted">
                    {emptyMessage}
                  </Typography>
                  {statusFilter === "active" ? (
                    <Button
                      variant="tertiary"
                      className="mt-3 min-h-10 rounded-2xl"
                      onPress={openCreate}
                    >
                      <Button.Label>Create filter</Button.Label>
                    </Button>
                  ) : null}
                </View>
              )}
            </>
          ) : filterStore.lastError == null ? (
            <View className="mx-3 mt-6 rounded-3xl bg-surface px-4 py-10">
              <EmptyState>
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <StyledIonicons
                      name="options-outline"
                      size={21}
                      className="text-muted"
                    />
                  </EmptyState.Media>
                  <EmptyState.Title>No filters yet</EmptyState.Title>
                  <EmptyState.Description>
                    Create a Vehicle or Custom filter to organize matching
                    listings. Filters do not need a location.
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
        </ScrollView>
      )}

      <FeedDisplayPrefsBar />

      {sheetMounted ? (
        <FilterBottomSheet
          key={editing != null ? `edit-${editing.id}` : "create"}
          isOpen={sheetOpen}
          onOpenChange={handleSheetOpenChange}
          editingFilter={editing}
        />
      ) : null}
    </View>
  );
});
