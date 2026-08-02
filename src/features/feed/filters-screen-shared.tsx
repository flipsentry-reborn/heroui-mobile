import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Alert,
  BottomSheet,
  Button,
  Checkbox,
  ControlField,
  Label,
  ListGroup,
  Separator,
  SkeletonGroup,
  Slider,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { BrandButton } from "@/components/ui/brand-button";
import {
  applyScoreTierSelection,
  clampMinProfit,
  displayPrefsSummary,
  formatMinProfitLabel,
  MIN_PROFIT_MAX,
  MIN_PROFIT_MIN,
  MIN_PROFIT_STEP,
  SCORE_TIER_OPTIONS,
  toSliderValue,
} from "@/features/feed/filters-screen-utils";
import { showSearchActionProgress } from "@/features/home/search-action-progress-toast";
import { SearchBottomSheetRow } from "@/features/home/search-bottom-sheet-row";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import type { ScoreTierKey } from "@/domain/feed-display-prefs";
import { formatPriceShort } from "@/mocks/services/home";
import type { UserFilter } from "@/models/user-filter";
import { useStore } from "@/store/store";

const StyledIonicons = withUniwind(Ionicons);

export function FiltersHeader({ onBack }: { onBack: () => void }): JSX.Element {
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
          <Typography type="body" weight="semibold" numberOfLines={1} className="text-foreground">
            Feed Filters
          </Typography>
        </View>
      </View>
      <Separator />
    </View>
  );
}

export function SelectedFiltersSection({
  filters,
  onDeselect,
  placement = "inline",
}: {
  filters: UserFilter[];
  onDeselect: (filter: UserFilter) => void;
  placement?: "inline" | "sticky-top";
}): JSX.Element | null {
  if (filters.length === 0) return null;

  const containerClass =
    placement === "sticky-top"
      ? "border-b border-border bg-background px-3 py-3"
      : "mx-3 mt-5 overflow-hidden rounded-3xl bg-surface px-3 py-3";

  return (
    <View className={containerClass}>
      <Typography type="body-xs" className="mb-2.5 text-muted">
        On your feed ({filters.length})
      </Typography>
      <View className="flex-row flex-wrap gap-2">
        {filters.map((filter) => (
          <View
            key={filter.id}
            className="flex-row items-center gap-2 rounded-full border border-border bg-surface-secondary px-2.5 py-1.5"
          >
            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: filter.color }} />
            <Typography type="body-xs" className="max-w-[140px] text-foreground" numberOfLines={1}>
              {filter.name}
            </Typography>
            <Pressable
              onPress={() => onDeselect(filter)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${filter.name} from feed`}
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

export const FeedDisplayPrefsBar = observer(function FeedDisplayPrefsBar(): JSX.Element {
  const insets = useSafeAreaInsets();
  const { filterStore } = useStore();
  const prefs = filterStore.displayPrefs;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftProfit, setDraftProfit] = useState(prefs.minProfit);

  useEffect(() => {
    if (sheetOpen) setDraftProfit(prefs.minProfit);
  }, [sheetOpen, prefs.minProfit]);

  const summary = useMemo(() => displayPrefsSummary(prefs), [prefs]);

  const setTier = useCallback(
    (key: ScoreTierKey, selected: boolean) => {
      filterStore.setDisplayPrefs(applyScoreTierSelection(prefs, key, selected));
    },
    [filterStore, prefs],
  );

  const commitProfit = useCallback(
    (value: number) => {
      const next = clampMinProfit(value);
      setDraftProfit(next);
      filterStore.setDisplayPrefs({ minProfit: next });
    },
    [filterStore],
  );

  return (
    <>
      <View
        className="border-t border-border bg-background px-3 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 10) }}
      >
        <ListGroup className="overflow-hidden rounded-3xl bg-surface">
          <SearchBottomSheetRow
            icon="trending-up-outline"
            iconClassName="text-violet-500"
            title="Deal quality"
            description={summary}
            onPress={() => setSheetOpen(true)}
            isLast
          />
        </ListGroup>
      </View>

      <SheetShell visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <BottomSheet.Content
          enableDynamicSizing
          className={SHEET_CONTENT_CLASS_NAME}
          backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
          contentContainerClassName={SHEET_CONTENT_CONTAINER_CLASS_NAME}
        >
          <View className="gap-4 px-4 pt-1" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="flex-row items-center gap-2.5 px-1">
              <StyledIonicons name="trending-up-outline" size={18} className="text-violet-500" />
              <BottomSheet.Title className="min-w-0 flex-1 text-left text-xl font-bold text-foreground">
                Deal quality
              </BottomSheet.Title>
              <BottomSheet.Close />
            </View>

            <View className="overflow-hidden rounded-3xl bg-surface px-4 py-4">
              <View className="mb-3 flex-row items-center justify-between">
                <Typography type="body" className="text-foreground">
                  Min profit
                </Typography>
                <Typography type="body-sm" className="text-muted">
                  {formatMinProfitLabel(draftProfit)}
                </Typography>
              </View>
              <Slider
                value={draftProfit}
                minValue={MIN_PROFIT_MIN}
                maxValue={MIN_PROFIT_MAX}
                step={MIN_PROFIT_STEP}
                onChange={(next) => {
                  const value = toSliderValue(next);
                  if (value != null) setDraftProfit(clampMinProfit(value));
                }}
                onChangeEnd={(next) => {
                  const value = toSliderValue(next);
                  if (value != null) commitProfit(value);
                }}
              >
                <Slider.Track>
                  <Slider.Fill />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider>
              <View className="mt-2 flex-row justify-between">
                <Typography type="body-xs" className="text-muted">
                  $0
                </Typography>
                <Typography type="body-xs" className="text-muted">
                  ${formatPriceShort(MIN_PROFIT_MAX)}
                </Typography>
              </View>
            </View>

            <View className="overflow-hidden rounded-3xl bg-surface px-3 py-1">
              {SCORE_TIER_OPTIONS.map((option, index) => (
                <View key={option.key}>
                  {index > 0 ? <Separator className="my-0" /> : null}
                  <ControlField
                    isSelected={prefs[option.key]}
                    onSelectedChange={(selected) => setTier(option.key, selected)}
                    className="py-3"
                  >
                    <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
                      <View className={`h-2.5 w-2.5 rounded-full ${option.swatchClassName}`} />
                      <Label className="text-[15px] font-normal text-foreground">
                        {option.label}
                      </Label>
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
        </BottomSheet.Content>
      </SheetShell>
    </>
  );
});

export function FiltersSkeleton(): JSX.Element {
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

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }): JSX.Element {
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

export function FiltersEmptyState({ onCreate }: { onCreate: () => void }): JSX.Element {
  const [accentForeground] = useThemeColor(["accent-foreground"]);

  return (
    <View className="mx-3 mt-6 rounded-3xl bg-surface px-4 py-10">
      <EmptyState>
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <StyledIonicons name="options-outline" size={21} className="text-muted" />
          </EmptyState.Media>
          <EmptyState.Title>No filters yet</EmptyState.Title>
          <EmptyState.Description>
            Create a Vehicle or Custom filter to organize matching listings. Filters do not need a
            location.
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <BrandButton className="min-h-11 px-5" onPress={onCreate}>
            <Ionicons name="add" size={18} color={accentForeground} />
            <BrandButton.Label>Create filter</BrandButton.Label>
          </BrandButton>
        </EmptyState.Content>
      </EmptyState>
    </View>
  );
}

export type FiltersLayoutVariantId =
  | "accordion"
  | "cards"
  | "tabs"
  | "settings"
  | "compact";

export const FILTERS_LAYOUT_VARIANTS: {
  id: FiltersLayoutVariantId;
  label: string;
  hint: string;
}[] = [
  {
    id: "accordion",
    label: "Accordion",
    hint: "Expand one filter at a time — good when you have many saved filters.",
  },
  {
    id: "cards",
    label: "Cards",
    hint: "Everything visible on each card — best for quick scanning and toggles.",
  },
  {
    id: "tabs",
    label: "Tabs",
    hint: "Split All / On feed / Paused — reduces noise on long lists.",
  },
  {
    id: "settings",
    label: "Settings",
    hint: "Dense rows like iOS Settings — tap a row for details.",
  },
  {
    id: "compact",
    label: "Compact",
    hint: "Minimal rows + segment filter — fastest for power users.",
  },
];

export interface FiltersScreenController {
  initialLoading: boolean;
  hasFilters: boolean;
  filters: UserFilter[];
  selectedFilters: UserFilter[];
  lastError: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  retry: () => void;
  openCreate: () => void;
  openEdit: (filter: UserFilter) => void;
  sheetMounted: boolean;
  sheetOpen: boolean;
  handleSheetOpenChange: (open: boolean) => void;
  editing: UserFilter | null;
  expandedFilter: string | undefined;
  setExpandedFilter: (id: string | undefined) => void;
  handleToggleActive: (filter: UserFilter, active: boolean) => void;
  handleToggleSelected: (filter: UserFilter, selected: boolean) => void;
  handleToggleNotifications: (filter: UserFilter, enabled: boolean) => void;
  handleDelete: (filter: UserFilter) => void;
}

export function useFiltersScreenController(): FiltersScreenController {
  const { filterStore } = useStore();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
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
    [filterStore, toast],
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
    [filterStore, toast],
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

  return {
    initialLoading: !filterStore.hasLoaded && filterStore.loading,
    hasFilters: filterStore.filters.length > 0,
    filters: filterStore.filters,
    selectedFilters: filterStore.selectedFilters,
    lastError: filterStore.lastError,
    refreshing,
    refresh,
    retry,
    openCreate,
    openEdit,
    sheetMounted,
    sheetOpen,
    handleSheetOpenChange,
    editing,
    expandedFilter,
    setExpandedFilter,
    handleToggleActive,
    handleToggleSelected,
    handleToggleNotifications,
    handleDelete,
  };
}

export function FiltersToolbar({
  subtitle,
  onCreate,
}: {
  subtitle: string;
  onCreate: () => void;
}): JSX.Element {
  const [accentForeground] = useThemeColor(["accent-foreground"]);

  return (
    <View className="mb-3 flex-row items-center justify-between px-3">
      <View className="min-w-0 flex-1 pr-3">
        <Typography type="body" weight="semibold" className="text-foreground">
          Saved filters
        </Typography>
        <Typography type="body-xs" className="mt-0.5 text-muted">
          {subtitle}
        </Typography>
      </View>
      <BrandButton className="h-9 min-h-9 gap-1 !rounded-xl px-2.5" onPress={onCreate}>
        <Ionicons name="add" size={16} color={accentForeground} />
        <BrandButton.Label>New</BrandButton.Label>
      </BrandButton>
    </View>
  );
}
