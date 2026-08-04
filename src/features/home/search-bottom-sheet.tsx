import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import type { JSX, MutableRefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Switch,
  Typography,
  useBottomSheet,
  useThemeColor,
  useToast,
} from "heroui-native";

import agent from "@/api/agent";
import PlatformIcon from "@/components/icons/PlatformIcon";
import {
  buildNewSearchLocationDraft,
  countryFromSearchGroup,
  loadGroupForEdit,
} from "@/features/home/load-group-for-edit";
import { showSearchActionProgress } from "@/features/home/search-action-progress-toast";
import {
  DEFAULT_CAR_MAKES,
  SearchBottomSheetCarMakesSheet,
  type CarMakesSelection,
} from "@/features/home/search-bottom-sheet-car-makes-sheet";
import {
  isCustomSearchQueryValid,
  SearchBottomSheetCriteria,
} from "@/features/home/search-bottom-sheet-criteria";
import { SearchBottomSheetCustomQuerySheet } from "@/features/home/search-bottom-sheet-custom-query-sheet";
import { SearchBottomSheetHeader } from "@/features/home/search-bottom-sheet-header";
import {
  fetchDefaultIphoneSelections,
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
import type { SearchEditSection } from "@/features/home/search-edit-section";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import { SheetContent } from "@/features/home/sheet-content";
import {
  buildDraftSettingRows,
  creditSettingsIntoIntervalOptions,
  getSearchYearRangeError,
  validateLocationDraft,
} from "@/domain/search-rules";
import {
  defaultEnabledPlatforms,
  inferCountryCode,
  normalizeAvailablePlatforms,
} from "@/lib/location-platforms";
import type { HomePlatform, SearchGroup, SearchType } from "@/mocks/data/home";
import {
  isLocationSpeedSelected,
  locationsFixture,
  type LocationRunSpeed,
} from "@/mocks/data/locations";
import { cityFromLocation } from "@/mocks/services/home";
import {
  formatLocationLabel,
  getLocationDraft,
  resetLocationDraft,
  setLocationDraft,
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
  draft: ReturnType<typeof getLocationDraft>,
): string {
  if (draft.main != null && locationId === draft.main.id) {
    return draft.main.displayName || draft.main.name;
  }
  const cached = draft.placesById?.[locationId];
  if (cached != null) {
    return cached.displayName || cached.name;
  }
  return (
    locationsFixture.find((place) => place.id === locationId)?.name ??
    locationId
  );
}

function resolveLocationCoords(
  locationId: string,
  draft: ReturnType<typeof getLocationDraft>,
  fallback: { latitude: number; longitude: number },
): {
  latitude: number;
  longitude: number;
  country?: string;
  timeZoneId?: string;
  geoNameId?: number;
  placeId?: string;
} {
  if (draft.main != null && locationId === draft.main.id) {
    return {
      latitude: draft.main.latitude,
      longitude: draft.main.longitude,
      country: draft.main.countryCode,
      timeZoneId: draft.main.timeZoneId,
      geoNameId: draft.main.geoNameId,
      placeId: draft.main.placeId,
    };
  }
  const cached = draft.placesById?.[locationId];
  if (cached != null) {
    return {
      latitude: cached.latitude,
      longitude: cached.longitude,
      country: cached.countryCode,
      timeZoneId: cached.timeZoneId,
      geoNameId: cached.geoNameId,
      placeId: cached.placeId,
    };
  }
  const fromFixture = locationsFixture.find((l) => l.id === locationId);
  if (fromFixture != null) {
    return {
      latitude: fromFixture.latitude,
      longitude: fromFixture.longitude,
      country: fromFixture.countryCode,
      timeZoneId: fromFixture.timeZoneId,
      geoNameId: fromFixture.geoNameId,
      placeId: fromFixture.placeId,
    };
  }
  return fallback;
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

function LocationRowValue({
  placeName,
  radiusMiles,
  muted,
}: {
  placeName: string | null;
  radiusMiles: number | null;
  muted: string;
}): JSX.Element {
  if (placeName == null || radiusMiles == null) {
    return (
      <View className="flex-row items-center gap-1">
        <Typography type="body-sm" className="text-muted">
          Set location
        </Typography>
        <Ionicons name="chevron-forward" size={16} color={muted} />
      </View>
    );
  }

  // Name may truncate; mileage always stays visible.
  return (
    <View className="max-w-[220px] min-w-0 flex-row items-center gap-1.5">
      <Typography
        type="body-sm"
        className="min-w-0 shrink text-muted"
        numberOfLines={1}
      >
        {placeName}
      </Typography>
      <Typography type="body-sm" className="shrink-0 text-muted">
        {radiusMiles} mi
      </Typography>
      <Ionicons name="chevron-forward" size={16} color={muted} />
    </View>
  );
}

function SearchSheetContent({
  title,
  locationPlaceName,
  locationRadiusMiles,
  onLocationPress,
  selectedPlatforms,
  searchType,
  onSearchTypeChange,
  customQuery,
  onCustomQueryOpenChange,
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
  notificationEnabled,
  onNotificationEnabledChange,
  childSheetOpen,
  locationReady,
  saveDisabled,
  submitting,
  errorMessage,
  onConfirm,
  dismissRef,
}: {
  title: string;
  locationPlaceName: string | null;
  locationRadiusMiles: number | null;
  /** Location and Platforms both open the location sheet. */
  onLocationPress?: () => void;
  selectedPlatforms: HomePlatform[];
  searchType: SearchType | null;
  onSearchTypeChange: (type: SearchType) => void;
  customQuery: string;
  onCustomQueryOpenChange: (open: boolean) => void;
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
  notificationEnabled: boolean;
  onNotificationEnabledChange: (value: boolean) => void;
  childSheetOpen: boolean;
  locationReady: boolean;
  saveDisabled: boolean;
  submitting: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  /** Lets parent dismiss with the same animated close as Cancel. */
  dismissRef: MutableRefObject<(() => void) | null>;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const [muted] = useThemeColor(["muted"]);
  const dismiss = () => onOpenChange(false);
  dismissRef.current = dismiss;
  const hasSearchType = searchType != null;

  const handleConfirm = () => {
    if (!hasSearchType || saveDisabled) return;
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
    <SheetContent
      keyboardBehavior={childSheetOpen ? undefined : "extend"}
      keyboardBlurBehavior={childSheetOpen ? undefined : "restore"}
      android_keyboardInputMode={childSheetOpen ? undefined : "adjustResize"}
      className={SHEET_CONTENT_CLASS_NAME}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
      handleComponent={null}
    >
      <View>
        <SearchBottomSheetHeader
          title={title}
          onCancel={dismiss}
          onSave={handleConfirm}
          cancelDisabled={submitting}
          saveDisabled={saveDisabled}
          saveLabel={submitting ? "Saving…" : "Save"}
        />

        <SearchBottomSheetSection>
          <SearchBottomSheetRow
            icon="swap-vertical"
            iconClassName="text-emerald-500"
            title="Search Type"
            required
            requiredTone="warning"
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
            requiredTone="warning"
            showChevron={false}
            isLast={false}
            hideSeparator
            disabled={!hasSearchType}
            right={
              hasSearchType ? (
                <LocationRowValue
                  placeName={locationPlaceName}
                  radiusMiles={locationRadiusMiles}
                  muted={muted}
                />
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
            requiredTone="warning"
            showChevron={false}
            isLast={false}
            disabled={!hasSearchType}
            right={
              <PlatformsRowValue
                platforms={selectedPlatforms}
                empty={!hasSearchType}
              />
            }
            onPress={onLocationPress}
          />
          <SearchBottomSheetRow
            icon="notifications"
            iconClassName="text-violet-500"
            title="Notifications"
            showChevron={false}
            isLast
            right={
              <Switch
                isSelected={notificationEnabled}
                onSelectedChange={onNotificationEnabledChange}
              />
            }
          />
        </SearchBottomSheetSection>

        {errorMessage != null ? (
          <Typography type="body-xs" className="mx-5 mb-2 text-danger">
            {errorMessage}
          </Typography>
        ) : null}

        <SearchBottomSheetCriteria
          searchType={searchType}
          customQuery={{
            value: customQuery,
            onOpenChange: onCustomQueryOpenChange,
          }}
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
    </SheetContent>
  );
}

interface SearchBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  locationLabel?: string;
  onLocationLabelChange?: (label: string) => void;
  /** When set, sheet runs in edit mode (prefill + update + slot credit-back). */
  editingGroup?: SearchGroup | null;
  /** When set with edit, open this nested sheet after the parent mounts. */
  initialSection?: SearchEditSection | null;
}

export const SearchBottomSheet = observer(function SearchBottomSheet({
  visible,
  onClose,
  locationLabel: _locationLabel = "Set location",
  onLocationLabelChange,
  editingGroup = null,
  initialSection = null,
}: SearchBottomSheetProps): JSX.Element {
  const { searchStore, subscriptionStore } = useStore();
  const { toast } = useToast();
  const [priceOpen, setPriceOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [mileageOpen, setMileageOpen] = useState(false);
  const [keywordsOpen, setKeywordsOpen] = useState(false);
  const [customQueryOpen, setCustomQueryOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [iphoneModelsOpen, setIphoneModelsOpen] = useState(false);
  const [carMakesOpen, setCarMakesOpen] = useState(false);
  const dismissSheetRef = useRef<(() => void) | null>(null);
  const [minPrice, setMinPrice] = useState("300");
  const [maxPrice, setMaxPrice] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [minMileage, setMinMileage] = useState("");
  const [maxMileage, setMaxMileage] = useState("");
  const [searchType, setSearchType] = useState<SearchType | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [iphoneSelections, setIphoneSelections] = useState<
    IphoneModelSelection[]
  >([]);
  const [iphoneModelsLoading, setIphoneModelsLoading] = useState(false);
  const [carMakes, setCarMakes] =
    useState<CarMakesSelection>(DEFAULT_CAR_MAKES);
  const [keywords, setKeywords] = useState<KeywordsState>(EMPTY_KEYWORDS);
  const [locationTick, setLocationTick] = useState(0);
  const prefilledGroupIdRef = useRef<string | null>(null);
  const openedSectionKeyRef = useRef<string | null>(null);
  const newSearchPrefillKeyRef = useRef<string | null>(null);
  const iphonePrefetchGenRef = useRef(0);

  const isEditing = editingGroup != null;
  /** Actions → Filters → section: hide Edit Search until that filter sheet closes. */
  const isSectionShortcut = initialSection != null;
  const [revealParentAfterShortcut, setRevealParentAfterShortcut] =
    useState(false);

  const editIntervalOptions = useMemo(() => {
    const base = subscriptionStore.intervalOptions;
    if (editingGroup == null) return base;
    return creditSettingsIntoIntervalOptions(base, editingGroup.settings);
  }, [editingGroup, subscriptionStore.intervalOptions]);

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
        intervalOptions: editIntervalOptions,
      }) == null &&
      Object.values(draft.otherSpeeds).some(isLocationSpeedSelected)
    );
  }, [draftSnapshot, editIntervalOptions]);

  const locationPlaceName =
    draftSnapshot.main != null
      ? cityFromLocation(
          draftSnapshot.main.displayName || draftSnapshot.main.name,
        )
      : null;
  const locationRadiusMiles =
    draftSnapshot.main != null ? draftSnapshot.radiusMiles : null;

  useEffect(() => {
    if (!visible) {
      prefilledGroupIdRef.current = null;
      openedSectionKeyRef.current = null;
      newSearchPrefillKeyRef.current = null;
      setRevealParentAfterShortcut(false);
      return;
    }
    if (editingGroup == null) {
      const prior = searchStore.searchGroups[0] ?? null;
      const prefillKey = prior?.id ?? "__empty__";
      if (newSearchPrefillKeyRef.current === prefillKey) return;
      newSearchPrefillKeyRef.current = prefillKey;

      setMinPrice("300");

      if (prior == null) {
        resetLocationDraft();
        setLocationTick((value) => value + 1);
        onLocationLabelChange?.(formatLocationLabel(getLocationDraft()));
        return;
      }

      // Reuse prior location/radius/speeds; expand platforms via backend country API.
      const baseDraft = buildNewSearchLocationDraft(prior);
      setLocationDraft(baseDraft);
      setLocationTick((value) => value + 1);
      onLocationLabelChange?.(formatLocationLabel(baseDraft));

      let cancelled = false;
      const country = countryFromSearchGroup(prior);
      void agent.Platform.getAvailable(country)
        .then((raw) => {
          if (cancelled) return;
          const available = normalizeAvailablePlatforms(raw);
          const next = buildNewSearchLocationDraft(prior, available);
          setLocationDraft(next);
          setLocationTick((value) => value + 1);
          onLocationLabelChange?.(formatLocationLabel(next));
        })
        .catch(() => {
          if (cancelled) return;
          // Keep location prefill; fall back to enabling seed US platforms.
          const fallback = buildNewSearchLocationDraft(
            prior,
            defaultEnabledPlatforms([]),
          );
          setLocationDraft(fallback);
          setLocationTick((value) => value + 1);
          onLocationLabelChange?.(formatLocationLabel(fallback));
        });

      return () => {
        cancelled = true;
      };
    }

    newSearchPrefillKeyRef.current = null;
    if (prefilledGroupIdRef.current === editingGroup.id) return;
    prefilledGroupIdRef.current = editingGroup.id;
    const prefill = loadGroupForEdit(editingGroup);
    setLocationDraft(prefill.locationDraft);
    setSearchType(prefill.searchType);
    setCustomQuery(prefill.customQuery);
    setIphoneSelections(prefill.iphoneSelections);
    setCarMakes(prefill.carMakes);
    setMinPrice(prefill.minPrice);
    setMaxPrice(prefill.maxPrice);
    setMinYear(prefill.minYear);
    setMaxYear(prefill.maxYear);
    setMinMileage(prefill.minMileage);
    setMaxMileage(prefill.maxMileage);
    setKeywords(EMPTY_KEYWORDS);
    setNotificationEnabled(prefill.notificationEnabled);
    setLocationTick((value) => value + 1);
    onLocationLabelChange?.(formatLocationLabel(prefill.locationDraft));
  }, [
    visible,
    editingGroup,
    onLocationLabelChange,
    searchStore.searchGroups,
  ]);

  useEffect(() => {
    if (!visible || initialSection == null) {
      setRevealParentAfterShortcut(false);
    }
  }, [visible, initialSection]);

  useEffect(() => {
    if (!visible || initialSection == null || editingGroup == null) return;
    const sectionKey = `${editingGroup.id}:${initialSection}`;
    if (openedSectionKeyRef.current === sectionKey) return;
    openedSectionKeyRef.current = sectionKey;
    setRevealParentAfterShortcut(false);

    // Defer until idle + 2 frames so nested SheetShell can measure fully
    // (same class of bug as Filters "New Filter" vs Actions → Edit).
    const idleHandle = requestIdleCallback(
      () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            switch (initialSection) {
              case "location":
              case "platforms":
                setLocationOpen(true);
                break;
              case "makes":
                setCarMakesOpen(true);
                break;
              case "price":
                setPriceOpen(true);
                break;
              case "year":
                setYearOpen(true);
                break;
              case "mileage":
                setMileageOpen(true);
                break;
              case "models":
                setIphoneModelsOpen(true);
                break;
              case "keywords":
                setKeywordsOpen(true);
                break;
            }
          });
        });
      },
      { timeout: 500 },
    );
    return () => {
      cancelIdleCallback(idleHandle);
    };
  }, [visible, initialSection, editingGroup]);

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type);
    if (type !== "custom") {
      setCustomQuery("");
    }
    if (type !== "iphone") {
      iphonePrefetchGenRef.current += 1;
      setIphoneSelections([]);
      setIphoneModelsLoading(false);
      setIphoneModelsOpen(false);
    } else if (!isEditing && iphoneSelections.length === 0) {
      const gen = ++iphonePrefetchGenRef.current;
      setIphoneModelsLoading(true);
      const draft = getLocationDraft();
      const country = inferCountryCode({
        countryCode: draft.main?.countryCode,
        displayName: draft.main?.displayName,
        name: draft.main?.name,
      });
      void fetchDefaultIphoneSelections({
        latitude: draft.main?.latitude,
        longitude: draft.main?.longitude,
        country,
      })
        .then((all) => {
          if (gen !== iphonePrefetchGenRef.current) return;
          setIphoneSelections(all);
        })
        .catch(() => {
          if (gen !== iphonePrefetchGenRef.current) return;
          setIphoneSelections([]);
        })
        .finally(() => {
          if (gen !== iphonePrefetchGenRef.current) return;
          setIphoneModelsLoading(false);
        });
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
    iphonePrefetchGenRef.current += 1;
    setIphoneSelections([]);
    setIphoneModelsLoading(false);
    setCarMakes(DEFAULT_CAR_MAKES);
    setKeywords(EMPTY_KEYWORDS);
    setMinPrice("");
    setMaxPrice("");
    setMinYear("");
    setMaxYear("");
    setMinMileage("");
    setMaxMileage("");
    newSearchPrefillKeyRef.current = null;
    // Shared draft is reused across create/edit — always restore empty defaults on close.
    resetLocationDraft();
    setLocationTick((value) => value + 1);
    searchStore.clearError();
  };

  const saveDisabled =
    searchStore.submitting ||
    searchType == null ||
    !locationReady ||
    (searchType === "custom" && !isCustomSearchQueryValid(customQuery)) ||
    (searchType === "iphone" && iphoneModelsLoading);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  /** After Filters → section closes, reveal Edit Search underneath. */
  const closeShortcutThenRevealParent = (setOpen: (open: boolean) => void) => {
    return (open: boolean) => {
      setOpen(open);
      if (!open && isSectionShortcut) {
        setRevealParentAfterShortcut(true);
      }
    };
  };

  const handleLocationOpenChange = (open: boolean) => {
    setLocationOpen(open);
    if (!open) {
      onLocationLabelChange?.(formatLocationLabel(getLocationDraft()));
      setLocationTick((value) => value + 1);
      if (isSectionShortcut) {
        setRevealParentAfterShortcut(true);
      }
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
        locationName: resolveLocationName(locationId, draft),
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

    const anyMake =
      carMakes.anyMake || carMakes.selectedIds.length === 0;

    const mainLat = draft.main.latitude;
    const mainLng = draft.main.longitude;
    const country =
      draft.main.countryCode ??
      (/,?\s*Canada$/i.test(draft.main.displayName ?? "") ||
      /,?\s*CA$/i.test(draft.main.displayName ?? "")
        ? "CA"
        : "US");

    const payload = {
      searchType,
      locationName:
        draft.main.displayName ?? draft.main.name ?? "Unknown location",
      radiusMiles: draft.radiusMiles,
      latitude: mainLat,
      longitude: mainLng,
      country,
      timeZoneId: draft.main.timeZoneId,
      settings: settingRows.map((row) => {
        const coords = resolveLocationCoords(row.locationId, draft, {
          latitude: mainLat,
          longitude: mainLng,
        });
        return {
          platform: toHomePlatform(row.platform),
          locationName: resolveLocationName(row.locationId, draft),
          runIntervalSeconds: row.runIntervalSeconds,
          latitude: coords.latitude,
          longitude: coords.longitude,
          geoNameId:
            coords.geoNameId != null && coords.geoNameId > 0
              ? coords.geoNameId
              : undefined,
          placeId:
            coords.placeId != null && coords.placeId.length > 0
              ? coords.placeId
              : undefined,
          country: coords.country ?? country,
          timeZoneId: coords.timeZoneId ?? draft.main?.timeZoneId,
        };
      }),
      carQuery:
        searchType === "car"
          ? {
              anyMake,
              vehicleSelection: anyMake
                ? []
                : carMakes.selectedIds.map((make) => ({ make })),
              minPrice: parseOptionalNumber(minPrice),
              maxPrice: parseOptionalNumber(maxPrice),
              minYear: parseOptionalNumber(minYear),
              maxYear: parseOptionalNumber(maxYear),
              minMileage: parseOptionalNumber(minMileage),
              maxMileage: parseOptionalNumber(maxMileage),
            }
          : undefined,
      customLabel:
        searchType === "custom" ? customQuery.trim() : undefined,
      iphoneQuery:
        searchType === "iphone"
          ? iphoneSelections.map((s) => ({
              model: s.id,
              minPrice: parseOptionalNumber(s.min),
              maxPrice: parseOptionalNumber(s.max),
            }))
          : undefined,
      notificationEnabled,
    };

    const isUpdate = editingGroup != null;
    const editId = editingGroup?.id;
    const actionTitle =
      searchType === "car"
        ? "Cars"
        : searchType === "iphone"
          ? "Iphones"
          : customQuery.trim() ||
            draft.main.name ||
            draft.main.displayName ||
            "Search";

    // TODO(post-create-preview): After create succeeds, show sample matching
    // results with a good animation so the user can verify the search looks right
    // before dismissing. Tracked in SEARCH_STORE.md → Still out of scope.
    showSearchActionProgress(toast, {
      kind: isUpdate ? "update" : "create",
      title: actionTitle,
      onCommit: async () => {
        const saved =
          isUpdate && editId != null
            ? await searchStore.updateGroup(editId, payload)
            : await searchStore.createGroup(payload);
        if (saved != null) {
          // Animate out like Cancel — don't flip `visible` off immediately.
          if (dismissSheetRef.current != null) {
            dismissSheetRef.current();
          } else {
            handleClose();
          }
          return true;
        }
        return false;
      },
      getErrorMessage: () => searchStore.lastError,
    });
  };

  return (
    <>
      <SheetShell
        // Filters shortcut: open filter first; show Edit Search only after it closes.
        visible={
          visible && (!isSectionShortcut || revealParentAfterShortcut)
        }
        onClose={handleClose}
      >
        <SearchSheetContent
          title={isEditing ? "Edit Search" : "New Search"}
          locationPlaceName={locationPlaceName}
          locationRadiusMiles={locationRadiusMiles}
          onLocationPress={() => setLocationOpen(true)}
          selectedPlatforms={selectedPlatforms}
          searchType={searchType}
          onSearchTypeChange={handleSearchTypeChange}
          customQuery={customQuery}
          onCustomQueryOpenChange={setCustomQueryOpen}
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
          notificationEnabled={notificationEnabled}
          onNotificationEnabledChange={setNotificationEnabled}
          childSheetOpen={
            locationOpen ||
            priceOpen ||
            yearOpen ||
            mileageOpen ||
            keywordsOpen ||
            customQueryOpen ||
            iphoneModelsOpen ||
            carMakesOpen
          }
          locationReady={locationReady}
          saveDisabled={saveDisabled}
          submitting={searchStore.submitting}
          errorMessage={searchStore.lastError}
          onConfirm={() => {
            void handleConfirm();
          }}
          dismissRef={dismissSheetRef}
        />
      </SheetShell>

      <SearchBottomSheetPriceSheet
        isOpen={visible && priceOpen}
        onOpenChange={closeShortcutThenRevealParent(setPriceOpen)}
        min={minPrice}
        max={maxPrice}
        onMinChange={setMinPrice}
        onMaxChange={setMaxPrice}
        groupThousands
      />

      <SearchBottomSheetPriceSheet
        isOpen={visible && yearOpen}
        onOpenChange={closeShortcutThenRevealParent(setYearOpen)}
        title="Year"
        min={minYear}
        max={maxYear}
        onMinChange={setMinYear}
        onMaxChange={setMaxYear}
        maxLength={4}
      />

      <SearchBottomSheetPriceSheet
        isOpen={visible && mileageOpen}
        onOpenChange={closeShortcutThenRevealParent(setMileageOpen)}
        title="Mileage"
        min={minMileage}
        max={maxMileage}
        onMinChange={setMinMileage}
        onMaxChange={setMaxMileage}
        groupThousands
      />

      <SearchBottomSheetKeywordsSheet
        isOpen={visible && keywordsOpen}
        onOpenChange={closeShortcutThenRevealParent(setKeywordsOpen)}
        keywords={keywords}
        onKeywordsChange={setKeywords}
      />

      <SearchBottomSheetCustomQuerySheet
        isOpen={visible && customQueryOpen}
        onOpenChange={closeShortcutThenRevealParent(setCustomQueryOpen)}
        value={customQuery}
        onChange={setCustomQuery}
        title="Search"
        fieldTitle="Search"
      />

      <SearchBottomSheetIphoneModelsSheet
        isOpen={visible && iphoneModelsOpen}
        onOpenChange={closeShortcutThenRevealParent(setIphoneModelsOpen)}
        selections={iphoneSelections}
        onSelectionsChange={setIphoneSelections}
        isCreateMode={!isEditing}
        location={{
          latitude: draftSnapshot.main?.latitude,
          longitude: draftSnapshot.main?.longitude,
          country:
            draftSnapshot.main?.countryCode ??
            (/,?\s*Canada$/i.test(draftSnapshot.main?.displayName ?? "")
              ? "CA"
              : "US"),
        }}
      />

      <SearchBottomSheetCarMakesSheet
        isOpen={visible && carMakesOpen}
        onOpenChange={closeShortcutThenRevealParent(setCarMakesOpen)}
        selection={carMakes}
        onSelectionChange={setCarMakes}
      />

      <SearchBottomSheetLocationSheet
        isOpen={visible && locationOpen}
        onOpenChange={handleLocationOpenChange}
        intervalOptions={editIntervalOptions}
      />
    </>
  );
});
