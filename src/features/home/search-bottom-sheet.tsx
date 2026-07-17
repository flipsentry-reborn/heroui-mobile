import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Typography,
  useBottomSheet,
  useThemeColor,
} from "heroui-native";

import {
  DEFAULT_CAR_MAKES,
  SearchBottomSheetCarMakesSheet,
  type CarMakesSelection,
} from "@/features/home/search-bottom-sheet-car-makes-sheet";
import {
  isCustomSearchQueryValid,
  SearchBottomSheetCriteria,
} from "@/features/home/search-bottom-sheet-criteria";
import { SearchBottomSheetHeader } from "@/features/home/search-bottom-sheet-header";
import {
  SearchBottomSheetIphoneModelsSheet,
  type IphoneModelSelection,
} from "@/features/home/search-bottom-sheet-iphone-models-sheet";
import {
  EMPTY_KEYWORDS,
  SearchBottomSheetKeywordsSheet,
  type KeywordsState,
} from "@/features/home/search-bottom-sheet-keywords-sheet";
import { SearchBottomSheetPriceSheet } from "@/features/home/search-bottom-sheet-price-sheet";
import { SearchBottomSheetRow } from "@/features/home/search-bottom-sheet-row";
import { SearchBottomSheetSection } from "@/features/home/search-bottom-sheet-section";
import { SearchBottomSheetTypeSelect } from "@/features/home/search-bottom-sheet-type-select";
import { SearchBottomSheetYearSheet } from "@/features/home/search-bottom-sheet-year-sheet";
import { SheetShell } from "@/features/home/sheet-shell";
import type { SearchType } from "@/mocks/data/home";

function SearchSheetContent({
  locationLabel,
  onLocationPress,
  searchType,
  onSearchTypeChange,
  customQuery,
  onCustomQueryChange,
  customQueryInvalid,
  onCustomQueryInvalidChange,
  iphoneSelections,
  onIphoneModelsOpenChange,
  carMakes,
  onCarMakesOpenChange,
  minPrice,
  maxPrice,
  onPriceOpenChange,
  onMinChange,
  onMaxChange,
  minYear,
  maxYear,
  onYearOpenChange,
  minMileage,
  maxMileage,
  onMileageOpenChange,
  keywords,
  onKeywordsOpenChange,
  childSheetOpen,
}: {
  locationLabel: string;
  onLocationPress?: () => void;
  searchType: SearchType | null;
  onSearchTypeChange: (type: SearchType) => void;
  customQuery: string;
  onCustomQueryChange: (value: string) => void;
  customQueryInvalid: boolean;
  onCustomQueryInvalidChange: (invalid: boolean) => void;
  iphoneSelections: IphoneModelSelection[];
  onIphoneModelsOpenChange: (open: boolean) => void;
  carMakes: CarMakesSelection;
  onCarMakesOpenChange: (open: boolean) => void;
  minPrice: string;
  maxPrice: string;
  onPriceOpenChange: (open: boolean) => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  minYear: string;
  maxYear: string;
  onYearOpenChange: (open: boolean) => void;
  minMileage: string;
  maxMileage: string;
  onMileageOpenChange: (open: boolean) => void;
  keywords: KeywordsState;
  onKeywordsOpenChange: (open: boolean) => void;
  /** Nested price/keywords sheets own the keyboard — parent must not fight them. */
  childSheetOpen: boolean;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const [muted] = useThemeColor(["muted"]);
  const snapPoints = useMemo(() => ["70%", "92%"], []);
  const dismiss = () => onOpenChange(false);

  const handleConfirm = () => {
    if (searchType === "custom" && !isCustomSearchQueryValid(customQuery)) {
      onCustomQueryInvalidChange(true);
      return;
    }
    if (searchType === "iphone" && iphoneSelections.length === 0) {
      onIphoneModelsOpenChange(true);
      return;
    }
    dismiss();
  };

  const handleCustomQueryChange = (value: string) => {
    onCustomQueryChange(value);
    if (isCustomSearchQueryValid(value)) {
      onCustomQueryInvalidChange(false);
    }
  };

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      enableOverDrag={false}
      enableDynamicSizing={false}
      enableContentPanningGesture={!childSheetOpen}
      keyboardBehavior={childSheetOpen ? undefined : "extend"}
      android_keyboardInputMode={childSheetOpen ? undefined : "adjustResize"}
      contentContainerClassName="h-full bg-surface-secondary p-0"
      backgroundClassName="rounded-t-[32px] bg-surface-secondary"
      handleComponent={null}
    >
      <View className="flex-1">
        <SearchBottomSheetHeader onClose={dismiss} onConfirm={handleConfirm} />

        <SearchBottomSheetSection>
          <SearchBottomSheetRow
            icon="swap-vertical"
            iconClassName="text-amber-500"
            title="Search Type"
            required
            showChevron={false}
            isLast={false}
            right={
              <SearchBottomSheetTypeSelect
                value={searchType}
                onChange={onSearchTypeChange}
              />
            }
          />
          <SearchBottomSheetRow
            icon="navigate"
            iconClassName="text-sky-500"
            title="Location"
            showChevron={false}
            isLast
            right={
              <View className="flex-row items-center gap-1">
                <Typography type="body-sm" className="text-muted">
                  {locationLabel}
                </Typography>
                <Ionicons name="chevron-forward" size={16} color={muted} />
              </View>
            }
            onPress={onLocationPress}
          />
        </SearchBottomSheetSection>

        <SearchBottomSheetCriteria
          searchType={searchType}
          customQuery={customQuery}
          onCustomQueryChange={handleCustomQueryChange}
          customQueryInvalid={customQueryInvalid}
          iphoneModels={{
            selections: iphoneSelections,
            onOpenChange: onIphoneModelsOpenChange,
          }}
          carMakes={{
            selection: carMakes,
            onOpenChange: onCarMakesOpenChange,
          }}
          price={{
            min: minPrice,
            max: maxPrice,
            onOpenChange: onPriceOpenChange,
            onMinChange,
            onMaxChange,
          }}
          year={{
            min: minYear,
            max: maxYear,
            onOpenChange: onYearOpenChange,
          }}
          mileage={{
            min: minMileage,
            max: maxMileage,
            onOpenChange: onMileageOpenChange,
          }}
          keywords={{
            value: keywords,
            onOpenChange: onKeywordsOpenChange,
          }}
        />
      </View>
    </BottomSheet.Content>
  );
}

interface SearchBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  locationLabel?: string;
  onLocationPress?: () => void;
}

export function SearchBottomSheet({
  visible,
  onClose,
  locationLabel = "Voorhees (30 mi)",
  onLocationPress,
}: SearchBottomSheetProps): JSX.Element {
  const [priceOpen, setPriceOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [mileageOpen, setMileageOpen] = useState(false);
  const [keywordsOpen, setKeywordsOpen] = useState(false);
  const [iphoneModelsOpen, setIphoneModelsOpen] = useState(false);
  const [carMakesOpen, setCarMakesOpen] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [minMileage, setMinMileage] = useState("");
  const [maxMileage, setMaxMileage] = useState("");
  const [searchType, setSearchType] = useState<SearchType | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [customQueryInvalid, setCustomQueryInvalid] = useState(false);
  const [iphoneSelections, setIphoneSelections] = useState<
    IphoneModelSelection[]
  >([]);
  const [carMakes, setCarMakes] =
    useState<CarMakesSelection>(DEFAULT_CAR_MAKES);
  const [keywords, setKeywords] = useState<KeywordsState>(EMPTY_KEYWORDS);

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type);
    if (type !== "custom") {
      setCustomQuery("");
      setCustomQueryInvalid(false);
    }
    if (type !== "iphone") {
      setIphoneSelections([]);
      setIphoneModelsOpen(false);
    }
    if (type !== "car") {
      setCarMakes(DEFAULT_CAR_MAKES);
      setCarMakesOpen(false);
      setYearOpen(false);
      setMileageOpen(false);
      setMinYear("");
      setMaxYear("");
      setMinMileage("");
      setMaxMileage("");
    }
  };

  const handleClose = () => {
    setPriceOpen(false);
    setYearOpen(false);
    setMileageOpen(false);
    setKeywordsOpen(false);
    setIphoneModelsOpen(false);
    setCarMakesOpen(false);
    onClose();
  };

  return (
    <>
      <SheetShell visible={visible} onClose={handleClose}>
        <SearchSheetContent
          locationLabel={locationLabel}
          onLocationPress={onLocationPress}
          searchType={searchType}
          onSearchTypeChange={handleSearchTypeChange}
          customQuery={customQuery}
          onCustomQueryChange={setCustomQuery}
          customQueryInvalid={customQueryInvalid}
          onCustomQueryInvalidChange={setCustomQueryInvalid}
          iphoneSelections={iphoneSelections}
          onIphoneModelsOpenChange={setIphoneModelsOpen}
          carMakes={carMakes}
          onCarMakesOpenChange={setCarMakesOpen}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceOpenChange={setPriceOpen}
          onMinChange={setMinPrice}
          onMaxChange={setMaxPrice}
          minYear={minYear}
          maxYear={maxYear}
          onYearOpenChange={setYearOpen}
          minMileage={minMileage}
          maxMileage={maxMileage}
          onMileageOpenChange={setMileageOpen}
          keywords={keywords}
          onKeywordsOpenChange={setKeywordsOpen}
          childSheetOpen={
            priceOpen ||
            yearOpen ||
            mileageOpen ||
            keywordsOpen ||
            iphoneModelsOpen ||
            carMakesOpen
          }
        />
      </SheetShell>

      <SearchBottomSheetPriceSheet
        isOpen={visible && priceOpen}
        onOpenChange={setPriceOpen}
        min={minPrice}
        max={maxPrice}
        onMinChange={setMinPrice}
        onMaxChange={setMaxPrice}
      />

      <SearchBottomSheetYearSheet
        isOpen={visible && yearOpen}
        onOpenChange={setYearOpen}
        min={minYear}
        max={maxYear}
        onMinChange={setMinYear}
        onMaxChange={setMaxYear}
      />

      <SearchBottomSheetPriceSheet
        isOpen={visible && mileageOpen}
        onOpenChange={setMileageOpen}
        title="Mileage"
        min={minMileage}
        max={maxMileage}
        onMinChange={setMinMileage}
        onMaxChange={setMaxMileage}
      />

      <SearchBottomSheetKeywordsSheet
        isOpen={visible && keywordsOpen}
        onOpenChange={setKeywordsOpen}
        keywords={keywords}
        onKeywordsChange={setKeywords}
      />

      <SearchBottomSheetIphoneModelsSheet
        isOpen={visible && iphoneModelsOpen}
        onOpenChange={setIphoneModelsOpen}
        selections={iphoneSelections}
        onSelectionsChange={setIphoneSelections}
      />

      <SearchBottomSheetCarMakesSheet
        isOpen={visible && carMakesOpen}
        onOpenChange={setCarMakesOpen}
        selection={carMakes}
        onSelectionChange={setCarMakes}
      />
    </>
  );
}
