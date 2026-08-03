import { Ionicons } from "@expo/vector-icons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { observer } from "mobx-react-lite";
import type { JSX, MutableRefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  FieldError,
  Switch,
  Typography,
  useBottomSheet,
  useThemeColor,
  useToast,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { FilterColorSheet } from "@/features/feed/filter-color-sheet";
import { showSearchActionProgress } from "@/features/home/search-action-progress-toast";
import {
  CustomSearchInput,
  isCustomSearchQueryValid,
} from "@/features/home/search-bottom-sheet-criteria";
import { SearchBottomSheetHeader } from "@/features/home/search-bottom-sheet-header";
import {
  EMPTY_KEYWORDS,
  SearchBottomSheetKeywordsSheet,
  formatKeywordsLabel,
  type KeywordsState,
} from "@/features/home/search-bottom-sheet-keywords-sheet";
import {
  SearchBottomSheetPriceSheet,
  formatGroupedDigits,
  formatPriceRangeLabel,
} from "@/features/home/search-bottom-sheet-price-sheet";
import { SearchBottomSheetRow } from "@/features/home/search-bottom-sheet-row";
import { SearchBottomSheetSection } from "@/features/home/search-bottom-sheet-section";
import {
  FILTER_TYPE_OPTIONS,
  SearchBottomSheetTypeSelect,
} from "@/features/home/search-bottom-sheet-type-select";
import {
  SearchSheetGroup,
  SearchSheetRow,
  SearchSheetValue,
} from "@/features/home/search-sheet-group";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import { SheetContent } from "@/features/home/sheet-content";
import { isValidFilterHex, type UserFilter, type UserFilterType } from "@/models/user-filter";
import { useStore } from "@/store/store";

const StyledBottomSheetScrollView = withUniwind(BottomSheetScrollView);

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function keywordCount(keywords: KeywordsState): number {
  return keywords.titleIncluders.length + keywords.descriptionIncluders.length;
}

function rangeError(label: string, min: string, max: string): string | null {
  if (min !== "" && max !== "" && Number(min) > Number(max)) {
    return `${label} minimum cannot be greater than maximum`;
  }
  return null;
}

function yearError(min: string, max: string): string | null {
  if ((min !== "" && min.length !== 4) || (max !== "" && max.length !== 4)) {
    return "Years must use four digits";
  }
  return rangeError("Year", min, max);
}

interface FilterBottomSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingFilter?: UserFilter | null;
}

export const FilterBottomSheet = observer(function FilterBottomSheet({
  isOpen,
  onOpenChange,
  editingFilter = null,
}: FilterBottomSheetProps): JSX.Element {
  const { filterStore } = useStore();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [filterType, setFilterType] = useState<UserFilterType>("Vehicle");
  const [color, setColor] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [minMileage, setMinMileage] = useState("");
  const [maxMileage, setMaxMileage] = useState("");
  const [keywords, setKeywords] = useState<KeywordsState>(EMPTY_KEYWORDS);
  const [priceOpen, setPriceOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [mileageOpen, setMileageOpen] = useState(false);
  const [keywordsOpen, setKeywordsOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const dismissSheetRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingFilter) {
      setName(editingFilter.name);
      setFilterType(editingFilter.filterType);
      setColor(editingFilter.color);
      setNotificationEnabled(editingFilter.notificationEnabled);
      setMinPrice(
        editingFilter.vehicleQuery?.minPrice != null
          ? String(editingFilter.vehicleQuery.minPrice)
          : editingFilter.customQuery?.minPrice != null
            ? String(editingFilter.customQuery.minPrice)
            : ""
      );
      setMaxPrice(
        editingFilter.vehicleQuery?.maxPrice != null
          ? String(editingFilter.vehicleQuery.maxPrice)
          : editingFilter.customQuery?.maxPrice != null
            ? String(editingFilter.customQuery.maxPrice)
            : ""
      );
      setMinYear(
        editingFilter.vehicleQuery?.minYear != null
          ? String(editingFilter.vehicleQuery.minYear)
          : ""
      );
      setMaxYear(
        editingFilter.vehicleQuery?.maxYear != null
          ? String(editingFilter.vehicleQuery.maxYear)
          : ""
      );
      setMinMileage(
        editingFilter.vehicleQuery?.minMileage != null
          ? String(editingFilter.vehicleQuery.minMileage)
          : ""
      );
      setMaxMileage(
        editingFilter.vehicleQuery?.maxMileage != null
          ? String(editingFilter.vehicleQuery.maxMileage)
          : ""
      );
      setKeywords({
        ...EMPTY_KEYWORDS,
        titleIncluders: editingFilter.titleIncluders ?? [],
        descriptionIncluders: editingFilter.descriptionIncluders ?? [],
      });
      return;
    }
    setName("");
    setFilterType("Vehicle");
    setColor("");
    setNotificationEnabled(true);
    setMinPrice("");
    setMaxPrice("");
    setMinYear("");
    setMaxYear("");
    setMinMileage("");
    setMaxMileage("");
    setKeywords(EMPTY_KEYWORDS);
  }, [editingFilter, isOpen]);

  const childSheetOpen = priceOpen || yearOpen || mileageOpen || keywordsOpen || colorOpen;

  const usedColors = useMemo(() => {
    const taken = new Set<string>();
    for (const filter of filterStore.filters) {
      if (editingFilter != null && filter.id === editingFilter.id) continue;
      const hex = filter.color.trim().toUpperCase();
      if (hex) taken.add(hex);
    }
    return taken;
  }, [editingFilter, filterStore.filters]);

  const validationMessage = useMemo(() => {
    return (
      rangeError("Price", minPrice, maxPrice) ??
      (filterType === "Vehicle"
        ? (yearError(minYear, maxYear) ?? rangeError("Mileage", minMileage, maxMileage))
        : null)
    );
  }, [filterType, maxMileage, maxPrice, maxYear, minMileage, minPrice, minYear]);

  const canSave = useMemo(() => {
    if (!isCustomSearchQueryValid(name)) return false;
    if (validationMessage != null) return false;
    const selected = color.trim().toUpperCase();
    if (!isValidFilterHex(selected)) return false;
    if (usedColors.has(selected)) return false;
    if (keywordCount(keywords) > 10) return false;
    return true;
  }, [color, keywords, name, usedColors, validationMessage]);

  const handleClose = () => onOpenChange(false);

  const handleSave = async () => {
    if (!canSave || filterStore.submitting) return;
    if (keywordCount(keywords) > 10) {
      toast.show({
        variant: "danger",
        label: "At most 10 keywords (title + description)",
      });
      return;
    }
    const selectedColor = color.trim().toUpperCase();
    if (usedColors.has(selectedColor)) {
      toast.show({
        variant: "danger",
        label: "This color is already used by another filter",
      });
      return;
    }

    const payload = {
      name: name.trim(),
      color: selectedColor,
      filterType,
      notificationEnabled,
      titleIncluders: keywords.titleIncluders,
      descriptionIncluders: keywords.descriptionIncluders,
      vehicleQuery:
        filterType === "Vehicle"
          ? {
              anyMake: true,
              vehicleSelection: [],
              minPrice: parseOptionalNumber(minPrice),
              maxPrice: parseOptionalNumber(maxPrice),
              minYear: parseOptionalNumber(minYear),
              maxYear: parseOptionalNumber(maxYear),
              minMileage: parseOptionalNumber(minMileage),
              maxMileage: parseOptionalNumber(maxMileage),
            }
          : null,
      customQuery:
        filterType === "Custom"
          ? {
              minPrice: parseOptionalNumber(minPrice),
              maxPrice: parseOptionalNumber(maxPrice),
            }
          : null,
    };

    const isUpdate = editingFilter != null;
    const editId = editingFilter?.id;
    const actionTitle = name.trim() || "Filter";

    showSearchActionProgress(toast, {
      kind: isUpdate ? "update" : "create",
      subject: "filter",
      title: actionTitle,
      onCommit: async () => {
        const saved =
          isUpdate && editId != null
            ? await filterStore.updateFilter(editId, payload)
            : await filterStore.createFilter(payload);
        if (saved != null) {
          // Animate out like Cancel — don't flip `isOpen` off immediately.
          if (dismissSheetRef.current != null) {
            dismissSheetRef.current();
          } else {
            handleClose();
          }
          return true;
        }
        return false;
      },
      getErrorMessage: () => filterStore.lastError,
    });
  };

  const priceLabel = formatPriceRangeLabel(
    formatGroupedDigits(minPrice),
    formatGroupedDigits(maxPrice)
  );
  const yearLabel = formatPriceRangeLabel(minYear, maxYear);
  const mileageLabel = formatPriceRangeLabel(
    formatGroupedDigits(minMileage),
    formatGroupedDigits(maxMileage)
  );
  const keywordsLabel = formatKeywordsLabel({
    ...EMPTY_KEYWORDS,
    titleIncluders: keywords.titleIncluders,
    descriptionIncluders: keywords.descriptionIncluders,
  });
  const hasPriceFilter = minPrice !== "" || maxPrice !== "";
  const hasYearFilter = minYear !== "" || maxYear !== "";
  const hasMileageFilter = minMileage !== "" || maxMileage !== "";
  const hasKeywords = keywordsLabel !== "None";

  return (
    <>
      <SheetShell visible={isOpen} onClose={handleClose}>
        <FilterSheetBody
          title={editingFilter ? "Edit Filter" : "New Filter"}
          name={name}
          onNameChange={setName}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          typeLocked={editingFilter != null}
          color={color}
          hasColor={isValidFilterHex(color)}
          onOpenColor={() => setColorOpen(true)}
          notificationEnabled={notificationEnabled}
          onNotificationChange={setNotificationEnabled}
          keywordsLabel={keywordsLabel}
          hasKeywords={hasKeywords}
          onOpenKeywords={() => setKeywordsOpen(true)}
          onOpenPrice={() => setPriceOpen(true)}
          onOpenYear={() => setYearOpen(true)}
          onOpenMileage={() => setMileageOpen(true)}
          priceLabel={priceLabel}
          yearLabel={yearLabel}
          mileageLabel={mileageLabel}
          hasPriceFilter={hasPriceFilter}
          hasYearFilter={hasYearFilter}
          hasMileageFilter={hasMileageFilter}
          childSheetOpen={childSheetOpen}
          canSave={canSave}
          submitting={filterStore.submitting}
          errorMessage={filterStore.lastError}
          validationMessage={validationMessage}
          onSave={() => {
            void handleSave();
          }}
          dismissRef={dismissSheetRef}
        />
      </SheetShell>

      <FilterColorSheet
        isOpen={isOpen && colorOpen}
        onOpenChange={setColorOpen}
        color={color}
        usedColors={usedColors}
        onColorChange={setColor}
      />
      <SearchBottomSheetPriceSheet
        isOpen={isOpen && priceOpen}
        onOpenChange={setPriceOpen}
        min={minPrice}
        max={maxPrice}
        onMinChange={setMinPrice}
        onMaxChange={setMaxPrice}
      />
      <SearchBottomSheetPriceSheet
        isOpen={isOpen && yearOpen}
        onOpenChange={setYearOpen}
        title="Year"
        maxLength={4}
        groupThousands={false}
        min={minYear}
        max={maxYear}
        onMinChange={setMinYear}
        onMaxChange={setMaxYear}
      />
      <SearchBottomSheetPriceSheet
        isOpen={isOpen && mileageOpen}
        onOpenChange={setMileageOpen}
        title="Mileage"
        min={minMileage}
        max={maxMileage}
        onMinChange={setMinMileage}
        onMaxChange={setMaxMileage}
      />
      <SearchBottomSheetKeywordsSheet
        isOpen={isOpen && keywordsOpen}
        onOpenChange={setKeywordsOpen}
        keywords={keywords}
        onKeywordsChange={setKeywords}
      />
    </>
  );
});

function FilterSheetBody({
  title,
  name,
  onNameChange,
  filterType,
  onFilterTypeChange,
  typeLocked,
  color,
  hasColor,
  onOpenColor,
  notificationEnabled,
  onNotificationChange,
  keywordsLabel,
  hasKeywords,
  onOpenKeywords,
  onOpenPrice,
  onOpenYear,
  onOpenMileage,
  priceLabel,
  yearLabel,
  mileageLabel,
  hasPriceFilter,
  hasYearFilter,
  hasMileageFilter,
  childSheetOpen,
  canSave,
  submitting,
  errorMessage,
  validationMessage,
  onSave,
  dismissRef,
}: {
  title: string;
  name: string;
  onNameChange: (v: string) => void;
  filterType: UserFilterType;
  onFilterTypeChange: (v: UserFilterType) => void;
  typeLocked: boolean;
  color: string;
  hasColor: boolean;
  onOpenColor: () => void;
  notificationEnabled: boolean;
  onNotificationChange: (v: boolean) => void;
  keywordsLabel: string;
  hasKeywords: boolean;
  onOpenKeywords: () => void;
  onOpenPrice: () => void;
  onOpenYear: () => void;
  onOpenMileage: () => void;
  priceLabel: string;
  yearLabel: string;
  mileageLabel: string;
  hasPriceFilter: boolean;
  hasYearFilter: boolean;
  hasMileageFilter: boolean;
  childSheetOpen: boolean;
  canSave: boolean;
  submitting: boolean;
  errorMessage: string | null;
  validationMessage: string | null;
  onSave: () => void;
  /** Lets parent dismiss with the same animated close as Cancel. */
  dismissRef: MutableRefObject<(() => void) | null>;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const [muted] = useThemeColor(["muted"]);
  const snapPoints = useMemo(() => ["78%", "94%"], []);
  const dismiss = useCallback(() => onOpenChange(false), [onOpenChange]);
  useEffect(() => {
    dismissRef.current = dismiss;
    return () => {
      dismissRef.current = null;
    };
  }, [dismiss, dismissRef]);
  const isVehicle = filterType === "Vehicle";

  // Fixed snap points (not dynamic sizing) so keyboardBehavior="extend" can lift
  // the sheet when Name focuses — same pattern as Price/Keywords.
  return (
    <SheetContent
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enableOverDrag={false}
      keyboardBehavior={childSheetOpen ? undefined : "extend"}
      keyboardBlurBehavior={childSheetOpen ? undefined : "restore"}
      android_keyboardInputMode={childSheetOpen ? undefined : "adjustResize"}
      className={SHEET_CONTENT_CLASS_NAME}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
      handleComponent={null}
    >
      <View className="flex-1">
        <View className="shrink-0">
          <SearchBottomSheetHeader
            title={title}
            onCancel={dismiss}
            onSave={onSave}
            cancelDisabled={submitting}
            saveDisabled={!canSave || submitting}
            saveLabel={submitting ? "Saving…" : "Save"}
          />
        </View>

        <StyledBottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="min-h-0 flex-1"
          contentContainerClassName="pb-6"
        >
          <SearchBottomSheetSection>
            <SearchBottomSheetRow
              icon="text"
              iconClassName="text-orange-500"
              title="Name"
              required
              requiredTone="warning"
              showChevron={false}
              isLast={false}
              right={
                <View className="min-w-0 max-w-[200px] flex-1">
                  <CustomSearchInput value={name} onChange={onNameChange} invalidTone="warning" />
                </View>
              }
            />
            <SearchBottomSheetRow
              icon="color-palette"
              iconClassName="text-pink-500"
              title="Color"
              required
              requiredTone="warning"
              showChevron={false}
              isLast={false}
              onPress={onOpenColor}
              right={
                hasColor ? (
                  <View className="flex-row items-center gap-1.5">
                    <View
                      className="h-5 w-5 rounded-full border border-border"
                      style={{ backgroundColor: color }}
                    />
                    <Ionicons name="chevron-forward" size={16} color={muted} />
                  </View>
                ) : (
                  <SearchSheetValue label="Required" requiredEmpty />
                )
              }
            />
            <SearchBottomSheetRow
              icon="swap-vertical"
              iconClassName="text-emerald-500"
              title="Search Type"
              required
              requiredTone="warning"
              showChevron={false}
              isLast={false}
              right={
                typeLocked ? (
                  <Typography type="body-sm" className="text-foreground">
                    {FILTER_TYPE_OPTIONS.find((o) => o.value === filterType)?.label ?? filterType}
                  </Typography>
                ) : (
                  <SearchBottomSheetTypeSelect
                    value={filterType}
                    onChange={onFilterTypeChange}
                    options={FILTER_TYPE_OPTIONS}
                    accessibilityLabelPrefix="Filter type"
                  />
                )
              }
            />
            <SearchBottomSheetRow
              icon="notifications"
              iconClassName="text-violet-500"
              title="Notifications"
              showChevron={false}
              isLast
              right={
                <Switch isSelected={notificationEnabled} onSelectedChange={onNotificationChange} />
              }
            />
          </SearchBottomSheetSection>

          <SearchSheetGroup title="Filters">
            <SearchSheetRow
              title="Price"
              isLast={false}
              onPress={onOpenPrice}
              right={<SearchSheetValue label={priceLabel} emphasized={hasPriceFilter} />}
            />
            {isVehicle ? (
              <>
                <SearchSheetRow
                  title="Year"
                  isLast={false}
                  onPress={onOpenYear}
                  right={<SearchSheetValue label={yearLabel} emphasized={hasYearFilter} />}
                />
                <SearchSheetRow
                  title="Mileage"
                  isLast={false}
                  onPress={onOpenMileage}
                  right={<SearchSheetValue label={mileageLabel} emphasized={hasMileageFilter} />}
                />
              </>
            ) : null}
            <SearchSheetRow
              title="Keywords"
              isLast
              onPress={onOpenKeywords}
              right={<SearchSheetValue label={keywordsLabel} emphasized={hasKeywords} />}
            />
          </SearchSheetGroup>

          {validationMessage != null || errorMessage != null ? (
            <FieldError isInvalid className="mx-5 mb-2">
              {validationMessage ?? errorMessage}
            </FieldError>
          ) : null}
        </StyledBottomSheetScrollView>
      </View>
    </SheetContent>
  );
}
