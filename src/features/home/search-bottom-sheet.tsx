import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
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
  formatPlatformsLabel,
} from "@/features/home/search-bottom-sheet-platforms-sheet";
import { SearchBottomSheetPriceSheet } from "@/features/home/search-bottom-sheet-price-sheet";
import { SearchBottomSheetRow } from "@/features/home/search-bottom-sheet-row";
import { SearchBottomSheetSection } from "@/features/home/search-bottom-sheet-section";
import { SearchBottomSheetTypeSelect } from "@/features/home/search-bottom-sheet-type-select";
import { SearchBottomSheetYearSheet } from "@/features/home/search-bottom-sheet-year-sheet";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import {
  buildDraftSettingRows,
  validateLocationDraft,
} from "@/domain/search-rules";
import { MOCK_CAR_MAKES } from "@/mocks/data/car";
import type { HomePlatform, SearchType } from "@/mocks/data/home";
import {
  isLocationSpeedSelected,
  locationsFixture,
  type LocationRunSpeed,
} from "@/mocks/data/locations";
import {
  formatLocationLabel,
  getLocationDraft,
} from "@/mocks/services/location";
import { useStore } from "@/store/store";

function PlatformsRowValue({
  platforms,
  empty,
}: {
  platforms: HomePlatform[];
  empty?: boolean;
}): JSX.Element {
  const [muted] = useThemeColor(["muted"]);
  if (empty) {
    return <View className="h-5 w-4" />;
  }
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

function resolveLocationName(
  locationId: string,
  mainName: string | undefined,
  mainId: string | undefined,
): string {
  if (mainId != null && locationId === mainId && mainName != null) {
    return mainName;
  }
  return (
    locationsFixture.find((place) => place.id === locationId)?.name ??
    locationId
  );
}

function toHomePlatform(platform: string): HomePlatform {
  if (platform === "offerup") return "offerUp";
  if (
    platform === "facebook" ||
    platform === "offerUp" ||
    platform === "craigslist" ||
    platform === "kijiji"
  ) {
    return platform;
  }
  return "facebook";
}

function SearchSheetContent({
  locationLabel,
  onLocationPress,
  selectedPlatforms,
  searchType,
  onSearchTypeChange,
  customQuery,
  onCustomQueryChange,
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
  locationReady,
  submitting,
  errorMessage,
  onConfirm,
}: {
  locationLabel: string;
  /** Location and Platforms both open the location sheet. */
  onLocationPress?: () => void;
  selectedPlatforms: HomePlatform[];
  searchType: SearchType | null;
  onSearchTypeChange: (type: SearchType) => void;
  customQuery: string;
  onCustomQueryChange: (value: string) => void;
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
  childSheetOpen: boolean;
  locationReady: boolean;
  submitting: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const [muted] = useThemeColor(["muted"]);
  const snapPoints = useMemo(() => ["92%"], []);
  const dismiss = () => onOpenChange(false);
  const hasSearchType = searchType != null;

  const handleConfirm = () => {
    if (!hasSearchType) return;
    if (searchType === "custom" && !isCustomSearchQueryValid(customQuery)) {
      return;
    }
    if (searchType === "iphone" && iphoneSelections.length === 0) {
      onIphoneModelsOpenChange(true);
      return;
    }
    if (!locationReady) {
      onLocationPress?.();
      return;
    }
    onConfirm();
  };

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      enableContentPanningGesture={!childSheetOpen}
      keyboardBehavior={childSheetOpen ? undefined : "extend"}
      keyboardBlurBehavior={childSheetOpen ? undefined : "restore"}
      android_keyboardInputMode={childSheetOpen ? undefined : "adjustResize"}
      className={SHEET_CONTENT_CLASS_NAME}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
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
            required
            showChevron={false}
            isLast={false}
            hideSeparator
            disabled={!hasSearchType}
            right={
              hasSearchType ? (
                <View className="flex-row items-center gap-1">
                  <Typography
                    type="body-sm"
                    className="max-w-[200px] text-muted"
                    numberOfLines={1}
                  >
                    {locationLabel}
                  </Typography>
                  <Ionicons name="chevron-forward" size={16} color={muted} />
                </View>
              ) : (
                <View className="h-5 w-4" />
              )
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
            disabled={!hasSearchType}
            right={
              <PlatformsRowValue
                platforms={selectedPlatforms}
                empty={!hasSearchType}
              />
            }
            onPress={onLocationPress}
          />
        </SearchBottomSheetSection>

        {errorMessage != null ? (
          <Typography type="body-xs" className="mx-5 mb-2 text-danger">
            {errorMessage}
          </Typography>
        ) : null}

        <SearchBottomSheetCriteria
          searchType={searchType}
          customQuery={customQuery}
          onCustomQueryChange={onCustomQueryChange}
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
            isDisabled={submitting}
          >
            <Button.Label>Cancel</Button.Label>
          </Button>
          <Button
            variant="primary"
            className="min-h-12 flex-1"
            onPress={handleConfirm}
            isDisabled={submitting || searchType == null || !locationReady}
          >
            <Button.Label>{submitting ? "Saving…" : "Save"}</Button.Label>
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

export const SearchBottomSheet = observer(function SearchBottomSheet({
  visible,
  onClose,
  locationLabel = "Set location",
  onLocationLabelChange,
}: SearchBottomSheetProps): JSX.Element {
  const { searchStore, subscriptionStore } = useStore();
  const [priceOpen, setPriceOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [mileageOpen, setMileageOpen] = useState(false);
  const [keywordsOpen, setKeywordsOpen] = useState(false);
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
  const [iphoneSelections, setIphoneSelections] = useState<
    IphoneModelSelection[]
  >([]);
  const [carMakes, setCarMakes] =
    useState<CarMakesSelection>(DEFAULT_CAR_MAKES);
  const [keywords, setKeywords] = useState<KeywordsState>(EMPTY_KEYWORDS);
  const [locationTick, setLocationTick] = useState(0);

  const draftSnapshot = useMemo(() => {
    void locationTick;
    return getLocationDraft();
  }, [locationTick]);

  const selectedPlatforms = draftSnapshot.platforms;

  const locationReady = useMemo(() => {
    const draft = draftSnapshot;
    if (draft.main == null) return false;
    const locationSpeeds = Object.entries(draft.otherSpeeds).map(
      ([locationId, speed]) => ({
        locationId,
        locationName: locationId,
        speed: speed as LocationRunSpeed,
      }),
    );
    if (
      draft.main != null &&
      !locationSpeeds.some((row) => row.locationId === draft.main?.id)
    ) {
      locationSpeeds.unshift({
        locationId: draft.main.id,
        locationName: draft.main.name,
        speed: "none",
      });
    }
    return (
      validateLocationDraft({
        platforms: draft.platforms,
        locationSpeeds,
        centerId: draft.main.id,
        intervalOptions: subscriptionStore.intervalOptions,
      }) == null &&
      Object.values(draft.otherSpeeds).some(isLocationSpeedSelected)
    );
  }, [draftSnapshot, subscriptionStore.intervalOptions]);

  /** Short location label on the Location row (platforms shown on Platforms row). */
  const locationRowLabel = useMemo(() => {
    const draft = draftSnapshot;
    if (draft.main == null) return "Set location";
    return `${draft.main.name} (${draft.radiusMiles} mi)`;
  }, [draftSnapshot]);

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type);
    if (type !== "custom") {
      setCustomQuery("");
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

  const resetForm = () => {
    setPriceOpen(false);
    setYearOpen(false);
    setMileageOpen(false);
    setKeywordsOpen(false);
    setLocationOpen(false);
    setIphoneModelsOpen(false);
    setCarMakesOpen(false);
    setSearchType(null);
    setCustomQuery("");
    setIphoneSelections([]);
    setCarMakes(DEFAULT_CAR_MAKES);
    setKeywords(EMPTY_KEYWORDS);
    setMinPrice("");
    setMaxPrice("");
    setMinYear("");
    setMaxYear("");
    setMinMileage("");
    setMaxMileage("");
    searchStore.clearError();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLocationOpenChange = (open: boolean) => {
    setLocationOpen(open);
    if (!open) {
      onLocationLabelChange?.(formatLocationLabel(getLocationDraft()));
      setLocationTick((value) => value + 1);
    }
  };

  const parseOptionalNumber = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  };

  const handleConfirm = async () => {
    if (searchType == null) return;
    const draft = getLocationDraft();
    if (draft.main == null) return;

    const locationSpeeds = Object.entries(draft.otherSpeeds).map(
      ([locationId, speed]) => ({
        locationId,
        locationName: resolveLocationName(
          locationId,
          draft.main?.name,
          draft.main?.id,
        ),
        speed: speed as LocationRunSpeed,
      }),
    );

    const settingRows = buildDraftSettingRows({
      platforms: draft.platforms,
      locationSpeeds,
      centerId: draft.main.id,
    });

    if (settingRows.length === 0) {
      searchStore.setError(
        "Select platforms and at least one location speed.",
      );
      setLocationOpen(true);
      return;
    }

    const makes =
      carMakes.anyMake || carMakes.selectedIds.length === 0
        ? undefined
        : carMakes.selectedIds.map(
            (id) =>
              MOCK_CAR_MAKES.find((make) => make.id === id)?.label ?? id,
          );

    const created = await searchStore.createGroup({
      searchType,
      locationName:
        draft.main.displayName ?? draft.main.name ?? "Unknown location",
      radiusMiles: draft.radiusMiles,
      settings: settingRows.map((row) => ({
        platform: toHomePlatform(row.platform),
        locationName: resolveLocationName(
          row.locationId,
          draft.main?.name,
          draft.main?.id,
        ),
        runIntervalSeconds: row.runIntervalSeconds,
      })),
      carQuery:
        searchType === "car"
          ? {
              makes: makes ?? [],
              minPrice: parseOptionalNumber(minPrice),
              maxPrice: parseOptionalNumber(maxPrice),
              minYear: parseOptionalNumber(minYear),
              maxYear: parseOptionalNumber(maxYear),
              minMileage: parseOptionalNumber(minMileage),
              maxMileage: parseOptionalNumber(maxMileage),
            }
          : undefined,
      customLabel:
        searchType === "custom"
          ? customQuery.trim()
          : searchType === "iphone"
            ? iphoneSelections.map((s) => s.id).join(", ")
            : undefined,
    });

    if (created != null) {
      handleClose();
    }
  };

  return (
    <>
      <SheetShell visible={visible} onClose={handleClose}>
        <SearchSheetContent
          locationLabel={locationRowLabel || locationLabel}
          onLocationPress={() => setLocationOpen(true)}
          selectedPlatforms={selectedPlatforms}
          searchType={searchType}
          onSearchTypeChange={handleSearchTypeChange}
          customQuery={customQuery}
          onCustomQueryChange={setCustomQuery}
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
          locationReady={locationReady}
          submitting={searchStore.submitting}
          errorMessage={searchStore.lastError}
          onConfirm={() => {
            void handleConfirm();
          }}
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

      <SearchBottomSheetLocationSheet
        isOpen={visible && locationOpen}
        onOpenChange={handleLocationOpenChange}
      />
    </>
  );
});
