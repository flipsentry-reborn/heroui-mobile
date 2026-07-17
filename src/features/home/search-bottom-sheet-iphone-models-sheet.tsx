import { Ionicons } from "@expo/vector-icons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  Accordion,
  BottomSheet,
  Button,
  cn,
  Input,
  Separator,
  Typography,
  useAccordion,
  useAccordionItem,
  useBottomSheet,
  useBottomSheetAwareHandlers,
  useThemeColor,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { sanitizePriceInput } from "@/features/home/search-bottom-sheet-price-sheet";
import { SheetShell } from "@/features/home/sheet-shell";
import {
  getIphoneModelDefaults,
  MOCK_IPHONE_SERIES,
  type IphoneModelOption,
  type IphoneSeries,
} from "@/mocks/data/iphone";

const StyledBottomSheetScrollView = withUniwind(BottomSheetScrollView);
const StyledIonicons = withUniwind(Ionicons);
const StyledAnimatedView = withUniwind(Animated.View);

/** Matches HeroUI Native `AccordionWithDepthEffect` layout spring. */
const DEPTH_LAYOUT_TRANSITION = LinearTransition.springify()
  .damping(70)
  .stiffness(1000)
  .mass(2);

const ALL_MODELS = MOCK_IPHONE_SERIES.flatMap((series) => series.models);

export interface IphoneModelSelection {
  id: string;
  min: string;
  max: string;
}

type PriceDraft = { min: string; max: string };

export function formatIphoneModelsLabel(
  selections: IphoneModelSelection[],
): string {
  if (selections.length === 0) return "None";
  return String(selections.length);
}

function CountBadge({ value }: { value: number }): JSX.Element {
  return (
    <View className="min-w-6 items-center justify-center rounded-full bg-default px-1.5 py-0.5">
      <Typography type="body-xs" className="text-foreground">
        {value}
      </Typography>
    </View>
  );
}

function ModelPriceInput({
  value,
  onChange,
  accessibilityLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  accessibilityLabel: string;
}): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <Input
      value={value}
      onChangeText={(text) => onChange(sanitizePriceInput(text))}
      placeholder="Any"
      keyboardType="number-pad"
      variant="primary"
      textAlign="center"
      accessibilityLabel={accessibilityLabel}
      className="h-8 min-h-8 w-20 px-2 py-0 text-sm text-foreground"
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

function ModelRow({
  model,
  selected,
  min,
  max,
  onToggle,
  onMinChange,
  onMaxChange,
}: {
  model: IphoneModelOption;
  selected: boolean;
  min: string;
  max: string;
  onToggle: () => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}): JSX.Element {
  const [accent, muted] = useThemeColor(["accent", "muted"]);

  return (
    <View className="flex-row items-center gap-2 py-2">
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={model.label}
        onPress={onToggle}
        className="min-w-0 flex-1 flex-row items-center gap-2.5"
      >
        <Ionicons
          name={selected ? "checkbox" : "square-outline"}
          size={20}
          color={selected ? accent : muted}
        />
        <Typography type="body-sm" className="shrink text-foreground">
          {model.label}
        </Typography>
      </Pressable>

      <View className="flex-row items-center gap-1.5">
        <ModelPriceInput
          value={min}
          onChange={onMinChange}
          accessibilityLabel={`${model.label} min price`}
        />
        <Typography type="body-xs" className="text-muted">
          –
        </Typography>
        <ModelPriceInput
          value={max}
          onChange={onMaxChange}
          accessibilityLabel={`${model.label} max price`}
        />
      </View>
    </View>
  );
}

function defaultPriceFor(id: string): PriceDraft {
  return getIphoneModelDefaults(id) ?? { min: "", max: "" };
}

function SeriesDepthItem({
  series,
  index,
  seriesCount,
  seriesSelected,
  seriesAllSelected,
  selectedSet,
  getPrice,
  onToggleSeries,
  onToggleModel,
  onMinChange,
  onMaxChange,
}: {
  series: IphoneSeries;
  index: number;
  seriesCount: number;
  seriesSelected: number;
  seriesAllSelected: boolean;
  selectedSet: Set<string>;
  getPrice: (id: string) => PriceDraft;
  onToggleSeries: () => void;
  onToggleModel: (id: string) => void;
  onMinChange: (id: string, value: string) => void;
  onMaxChange: (id: string, value: string) => void;
}): JSX.Element {
  const { value } = useAccordion();
  const { isExpanded } = useAccordionItem();
  const scale = useSharedValue(isExpanded ? 1 : 0.97);

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

  const prevId = index > 0 ? MOCK_IPHONE_SERIES[index - 1]?.id : undefined;
  const nextId =
    index < seriesCount - 1 ? MOCK_IPHONE_SERIES[index + 1]?.id : undefined;
  const isBeforeSelected = nextId != null && expandedIds.has(nextId);
  const isAfterSelected = prevId != null && expandedIds.has(prevId);

  const showDivider =
    index < seriesCount - 1 && !isExpanded && !isBeforeSelected;

  return (
    <Animated.View layout={DEPTH_LAYOUT_TRANSITION} style={depthStyle}>
      <StyledAnimatedView
        layout={DEPTH_LAYOUT_TRANSITION}
        className={cn(
          "overflow-hidden bg-surface",
          index === 0 && !isExpanded && "rounded-t-2xl",
          index === seriesCount - 1 &&
            !isExpanded &&
            !isBeforeSelected &&
            "rounded-b-3xl",
          isBeforeSelected && "rounded-b-2xl",
          isExpanded && "rounded-2xl",
          isAfterSelected && "rounded-t-2xl",
          isExpanded && index === 0 && "mb-2",
          isExpanded && index > 0 && index < seriesCount - 1 && "my-2",
          isExpanded && index === seriesCount - 1 && "mt-2",
        )}
      >
        <Accordion.Trigger className="gap-2 px-4 py-3">
          <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
            <StyledIonicons
              name="phone-portrait-outline"
              size={16}
              className="text-muted"
            />
            <Typography
              type="body-sm"
              weight="semibold"
              className="shrink text-foreground"
              numberOfLines={1}
            >
              {series.title}
            </Typography>
          </View>

          <Button
            size="sm"
            variant="secondary"
            accessibilityLabel={
              seriesAllSelected
                ? `Clear ${series.title}`
                : `Select all in ${series.title}`
            }
            onPress={onToggleSeries}
            className="min-h-0 px-2.5 py-1"
          >
            <Button.Label className="text-xs">
              {seriesAllSelected ? "Clear" : "Select All"}
            </Button.Label>
          </Button>

          <CountBadge value={seriesSelected} />
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content className="px-4 pb-3 pt-0">
          <View className="gap-0.5">
            {series.models.map((model) => {
              const price = getPrice(model.id);
              return (
                <ModelRow
                  key={model.id}
                  model={model}
                  selected={selectedSet.has(model.id)}
                  min={price.min}
                  max={price.max}
                  onToggle={() => onToggleModel(model.id)}
                  onMinChange={(value) => onMinChange(model.id, value)}
                  onMaxChange={(value) => onMaxChange(model.id, value)}
                />
              );
            })}
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

function IphoneModelsSheetContent({
  selections,
  onSelectionsChange,
  onPersist,
}: {
  selections: IphoneModelSelection[];
  onSelectionsChange: (next: IphoneModelSelection[]) => void;
  onPersist: (next: IphoneModelSelection[]) => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const [showError, setShowError] = useState(false);
  const [expandedSeries, setExpandedSeries] = useState<string[]>([]);
  const snapPoints = useMemo(() => ["90%"], []);
  const dismiss = () => onOpenChange(false);

  const expandSeries = (seriesId: string) => {
    setExpandedSeries((prev) =>
      prev.includes(seriesId) ? prev : [...prev, seriesId],
    );
  };

  const selectedIds = useMemo(
    () => selections.map((item) => item.id),
    [selections],
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = selections.length;
  const allSelected = selectedCount === ALL_MODELS.length && selectedCount > 0;

  const [prices, setPrices] = useState<Record<string, PriceDraft>>(() =>
    Object.fromEntries(
      selections.map((item) => [item.id, { min: item.min, max: item.max }]),
    ),
  );

  useEffect(() => {
    setPrices((prev) => {
      const next = { ...prev };
      for (const item of selections) {
        next[item.id] = { min: item.min, max: item.max };
      }
      return next;
    });
  }, [selections]);

  useEffect(() => {
    if (selectedCount > 0) setShowError(false);
  }, [selectedCount]);

  const getPrice = (id: string): PriceDraft =>
    prices[id] ?? defaultPriceFor(id);

  const selectionFor = (id: string): IphoneModelSelection => {
    const price = getPrice(id);
    return { id, min: price.min, max: price.max };
  };

  const setPriceField = (id: string, field: "min" | "max", value: string) => {
    setPrices((prev) => {
      const current = prev[id] ?? defaultPriceFor(id);
      return { ...prev, [id]: { ...current, [field]: value } };
    });

    if (!selectedSet.has(id)) return;
    onSelectionsChange(
      selections.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const toggleModel = (id: string) => {
    if (selectedSet.has(id)) {
      onSelectionsChange(selections.filter((item) => item.id !== id));
      return;
    }
    onSelectionsChange([...selections, selectionFor(id)]);
  };

  const selectModels = (models: IphoneModelOption[]) => {
    const next = new Map(selections.map((item) => [item.id, item]));
    for (const model of models) {
      if (!next.has(model.id)) {
        next.set(model.id, selectionFor(model.id));
      }
    }
    onSelectionsChange([...next.values()]);
  };

  const deselectModels = (models: IphoneModelOption[]) => {
    const ids = new Set(models.map((model) => model.id));
    onSelectionsChange(selections.filter((item) => !ids.has(item.id)));
  };

  const toggleSeries = (seriesId: string, models: IphoneModelOption[]) => {
    const allInSeries = models.every((model) => selectedSet.has(model.id));
    if (allInSeries) {
      deselectModels(models);
      return;
    }
    selectModels(models);
    expandSeries(seriesId);
  };

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionsChange([]);
      return;
    }
    selectModels(ALL_MODELS);
  };

  const handleSave = () => {
    if (selections.length === 0) {
      setShowError(true);
      return;
    }
    const next = selections.map((item) => {
      const price = getPrice(item.id);
      return { id: item.id, min: price.min, max: price.max };
    });
    onPersist(next);
    dismiss();
  };

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      enableOverDrag={false}
      enableDynamicSizing={false}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundClassName="rounded-t-[32px] bg-surface-secondary"
      handleComponent={null}
      contentContainerClassName="h-full bg-surface-secondary p-0"
    >
      <View className="flex-1">
        <View className="flex-row items-center justify-between px-5 pb-1 pt-4">
          <View className="w-16" />
          <View className="flex-row items-center gap-2">
            <Typography type="body" weight="normal">
              Models
            </Typography>
            <CountBadge value={selectedCount} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={allSelected ? "Clear all models" : "Select all models"}
            onPress={handleSelectAll}
            className="min-w-16 items-end py-1"
            hitSlop={8}
          >
            <Typography type="body-sm" className="text-sky-400">
              {allSelected ? "Clear" : "Select all"}
            </Typography>
          </Pressable>
        </View>

        <StyledBottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerClassName="gap-3 px-3 pb-4 pt-3"
        >
          <Accordion
            selectionMode="multiple"
            value={expandedSeries}
            onValueChange={(next: string | string[] | undefined) => {
              setExpandedSeries(
                Array.isArray(next) ? next : next != null ? [next] : [],
              );
            }}
            isCollapsible
            hideSeparator
            animation={{
              layout: {
                value: DEPTH_LAYOUT_TRANSITION,
              },
            }}
            className="w-full overflow-visible"
          >
            {MOCK_IPHONE_SERIES.map((series, index) => {
              const seriesSelected = series.models.filter((model) =>
                selectedSet.has(model.id),
              ).length;
              const seriesAllSelected =
                seriesSelected === series.models.length &&
                series.models.length > 0;

              return (
                <Accordion.Item
                  key={series.id}
                  value={series.id}
                  className="overflow-visible"
                >
                  <SeriesDepthItem
                    series={series}
                    index={index}
                    seriesCount={MOCK_IPHONE_SERIES.length}
                    seriesSelected={seriesSelected}
                    seriesAllSelected={seriesAllSelected}
                    selectedSet={selectedSet}
                    getPrice={getPrice}
                    onToggleSeries={() =>
                      toggleSeries(series.id, series.models)
                    }
                    onToggleModel={toggleModel}
                    onMinChange={(id, value) => setPriceField(id, "min", value)}
                    onMaxChange={(id, value) => setPriceField(id, "max", value)}
                  />
                </Accordion.Item>
              );
            })}
          </Accordion>

          {showError ? (
            <Typography type="body-xs" className="px-1 text-danger">
              Select at least one model.
            </Typography>
          ) : null}
        </StyledBottomSheetScrollView>

        <View className="gap-2 px-5 pb-6 pt-2">
          <View className="flex-row gap-3">
            <Button
              variant="secondary"
              className="min-h-12 flex-1"
              onPress={dismiss}
            >
              <Button.Label>Cancel</Button.Label>
            </Button>
            <Button
              variant="primary"
              className="min-h-12 flex-1"
              isDisabled={selectedCount === 0}
              onPress={handleSave}
            >
              <Button.Label>Save</Button.Label>
            </Button>
          </View>
        </View>
      </View>
    </BottomSheet.Content>
  );
}

interface SearchBottomSheetIphoneModelsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selections: IphoneModelSelection[];
  onSelectionsChange: (selections: IphoneModelSelection[]) => void;
}

export function SearchBottomSheetIphoneModelsSheet({
  isOpen,
  onOpenChange,
  selections,
  onSelectionsChange,
}: SearchBottomSheetIphoneModelsSheetProps): JSX.Element | null {
  const [draft, setDraft] = useState(selections);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(selections);
    setSessionKey((key) => key + 1);
    // Snapshot parent selections only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open-only reset
  }, [isOpen]);

  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <IphoneModelsSheetContent
        key={sessionKey}
        selections={draft}
        onSelectionsChange={setDraft}
        onPersist={onSelectionsChange}
      />
    </SheetShell>
  );
}
