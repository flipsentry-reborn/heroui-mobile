import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Button,
  Typography,
  useBottomSheet,
  useThemeColor,
} from "heroui-native";

import PlatformIcon from "@/components/icons/PlatformIcon";
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
import { SearchBottomSheetLocationSheet } from "@/features/home/search-bottom-sheet-location-sheet";
import {
  DEFAULT_SEARCH_PLATFORMS,
  formatPlatformsLabel,
  SearchBottomSheetPlatformsSheet,
} from "@/features/home/search-bottom-sheet-platforms-sheet";
import { SearchBottomSheetPriceSheet } from "@/features/home/search-bottom-sheet-price-sheet";
import { SearchBottomSheetRow } from "@/features/home/search-bottom-sheet-row";
import { SearchBottomSheetSection } from "@/features/home/search-bottom-sheet-section";
import { SearchBottomSheetTypeSelect } from "@/features/home/search-bottom-sheet-type-select";
import { SearchBottomSheetYearSheet } from "@/features/home/search-bottom-sheet-year-sheet";
import { SheetShell } from "@/features/home/sheet-shell";
import type { HomePlatform, SearchType } from "@/mocks/data/home";
import {
  formatLocationLabel,
  getLocationDraft,
} from "@/mocks/services/location";

function PlatformsRowValue({
  platforms,
}: {
  platforms: HomePlatform[];
}): JSX.Element {
  const [muted] = useThemeColor(["muted"]);
  const hasPlatforms = platforms.length > 0;

  return (
    <View className="shrink-0 flex-row items-center gap-1.5">
      {hasPlatforms ? (
        <View className="flex-row items-center gap-1.5">
          {platforms.map((platform) => (
            <PlatformIcon key={platform} platform={platform} size={18} />
          ))}
        </View>
      ) : (
        <Typography type="body-sm" className="shrink-0 text-muted">
          {formatPlatformsLabel(platforms)}
        </Typography>
      )}
      <Ionicons name="chevron-forward" size={16} color={muted} />
    </View>
  );
}

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
  selectedPlatforms,
  onPlatformsOpenChange,
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
  /** Nested price/keywords sheets own the keyboard ? parent must not fight them. */
  childSheetOpen: boolean;
  selectedPlatforms: HomePlatform[];
  onPlatformsOpenChange: (open: boolean) => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const [muted] = useThemeColor(["muted"]);
  /** Max height for keyboard `extend`; dynamic sizing still hugs content when closed. */
  const snapPoints = useMemo(() => ["92%"], []);
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
      enableContentPanningGesture={!childSheetOpen}
      keyboardBehavior={childSheetOpen ? undefined : "extend"}
      keyboardBlurBehavior={childSheetOpen ? undefined : "restore"}
      android_keyboardInputMode={childSheetOpen ? undefined : "adjustResize"}
      className="overflow-hidden"
      contentContainerClassName="p-0"
      backgroundClassName="rounded-t-[32px] bg-surface-secondary"
      handleComponent={null}
    >
      <View>
        <SearchBottomSheetHeader />

        <SearchBottomSheetSection>
          <SearchBottomSheetRow
            icon="swap-vertical"
            iconClassName="text-emerald-500"
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
            isLast={false}
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
          <SearchBottomSheetRow
            icon="storefront"
            iconClassName="text-yellow-500"
            title="Platforms"
            required
            showChevron={false}
            isLast
            right={<PlatformsRowValue platforms={selectedPlatforms} />}
            onPress={() => onPlatformsOpenChange(true)}
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

        <View className="flex-row gap-3 px-5 pb-6 pt-0">
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
            onPress={handleConfirm}
          >
            <Button.Label>Save</Button.Label>
          </Button>
        </View>
      </View>
    </BottomSheet.Content>
  );
}

interface SearchBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  locationLabel?: string;
  onLocationLabelChange?: (label: string) => void;
}

export function SearchBottomSheet({
  visible,
  onClose,
  locationLabel = "Voorhees (30 mi)",
  onLocationLabelChange,
}: SearchBottomSheetProps): JSX.Element {
  const [priceOpen, setPriceOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [mileageOpen, setMileageOpen] = useState(false);
  const [keywordsOpen, setKeywordsOpen] = useState(false);
  const [platformsOpen, setPlatformsOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
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
  const [selectedPlatforms, setSelectedPlatforms] = useState<HomePlatform[]>(
    DEFAULT_SEARCH_PLATFORMS,
  );

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
    setPlatformsOpen(false);
    setLocationOpen(false);
    setIphoneModelsOpen(false);
    setCarMakesOpen(false);
    onClose();
  };

  const handleLocationOpenChange = (open: boolean) => {
    setLocationOpen(open);
    if (!open) {
      onLocationLabelChange?.(formatLocationLabel(getLocationDraft()));
    }
  };

  return (
    <>
      <SheetShell visible={visible} onClose={handleClose}>
        <SearchSheetContent
          locationLabel={locationLabel}
          onLocationPress={() => setLocationOpen(true)}
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
          selectedPlatforms={selectedPlatforms}
          onPlatformsOpenChange={setPlatformsOpen}
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

      <SearchBottomSheetPlatformsSheet
        isOpen={visible && platformsOpen}
        onOpenChange={setPlatformsOpen}
        platforms={selectedPlatforms}
        onPlatformsChange={setSelectedPlatforms}
      />

      <SearchBottomSheetLocationSheet
        isOpen={visible && locationOpen}
        onOpenChange={handleLocationOpenChange}
      />
    </>
  );
}
