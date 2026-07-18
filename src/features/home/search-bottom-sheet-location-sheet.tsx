import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Button,
  Typography,
  useBottomSheet,
} from "heroui-native";
import { withUniwind } from "uniwind";

import {
  availableSpeedsForLocation,
  canAssignLocationSpeed,
  type DraftLocationSpeed,
  type IntervalOption,
  validateLocationDraft,
} from "@/domain/search-rules";
import {
  LocationErrorInfoDialog,
  type LocationFooterError,
} from "@/features/home/location-error-info-dialog";
import { LocationMainSearch } from "@/features/home/location-main-search";
import { LocationMap } from "@/features/home/location-map";
import { LocationOtherList } from "@/features/home/location-other-list";
import { LocationPlatformsSection } from "@/features/home/location-platforms-section";
import { LocationRadius } from "@/features/home/location-radius";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import {
  DEFAULT_RADIUS_MILES,
  isLocationSpeedSelected,
  locationsFixture,
  type LocationPlatform,
  type LocationResult,
  type LocationRunSpeed,
} from "@/mocks/data/locations";
import {
  getLocationDraft,
  getNearbyLocations,
  searchLocations,
  setLocationDraft,
} from "@/mocks/services/location";
import { useStore } from "@/store/store";

const StyledBottomSheetScrollView = withUniwind(BottomSheetScrollView);

function toDraftSpeeds(
  places: LocationResult[],
  speeds: Record<string, LocationRunSpeed>,
): DraftLocationSpeed[] {
  return places.map((place) => ({
    locationId: place.id,
    locationName: place.name,
    speed: speeds[place.id] ?? "none",
  }));
}

function LocationSheetContent({
  main,
  radiusMiles,
  platforms,
  otherSpeeds,
  query,
  predictions,
  showPredictions,
  multiPlaces,
  nearbyLoading,
  selectedForMap,
  locationsDisabled,
  speedOptionsByLocation,
  rowErrors,
  listError,
  platformsError,
  intervalOptions,
  canSave,
  onQueryChange,
  onSelectMain,
  onRadiusChange,
  onPlatformsChange,
  onOtherSpeedChange,
  onPersist,
}: {
  main: LocationResult | null;
  radiusMiles: number;
  platforms: LocationPlatform[];
  otherSpeeds: Record<string, LocationRunSpeed>;
  query: string;
  predictions: LocationResult[];
  showPredictions: boolean;
  multiPlaces: LocationResult[];
  nearbyLoading: boolean;
  selectedForMap: LocationResult[];
  locationsDisabled: boolean;
  speedOptionsByLocation: Record<
    string,
    Array<{ speed: LocationRunSpeed; enabled: boolean }>
  >;
  rowErrors: Record<string, string>;
  listError: string | null;
  platformsError: string | null;
  intervalOptions: IntervalOption[];
  canSave: boolean;
  onQueryChange: (value: string) => void;
  onSelectMain: (place: LocationResult) => void;
  onRadiusChange: (miles: number) => void;
  onPlatformsChange: (next: LocationPlatform[]) => void;
  onOtherSpeedChange: (id: string, speed: LocationRunSpeed) => void;
  onPersist: () => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const snapPoints = useMemo(() => ["92%"], []);
  const [infoReason, setInfoReason] = useState<string | null>(null);
  const dismiss = () => onOpenChange(false);

  const handleSave = () => {
    if (!canSave) return;
    onPersist();
    dismiss();
  };

  const footerErrors = useMemo(() => {
    const errors: LocationFooterError[] = [];
    const seen = new Set<string>();
    const push = (
      reason: string | null | undefined,
      message?: string,
      id?: string,
    ) => {
      if (reason == null || reason.length === 0) return;
      const display = message ?? reason;
      const key = id ?? display;
      if (seen.has(key)) return;
      seen.add(key);
      errors.push({ id: key, message: display, reason });
    };

    push(platformsError);
    push(listError);
    for (const [id, message] of Object.entries(rowErrors)) {
      const place = multiPlaces.find((item) => item.id === id);
      push(
        message,
        place != null ? `${place.name}: ${message}` : message,
        `row:${id}`,
      );
    }
    if (errors.length === 0 && main != null && !canSave) {
      push("Finish platforms and at least one location speed to save.");
    }
    return errors;
  }, [
    platformsError,
    listError,
    rowErrors,
    multiPlaces,
    main,
    canSave,
  ]);

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      enableOverDrag={false}
      enableDynamicSizing={false}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      className={SHEET_CONTENT_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
      handleComponent={null}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME}
    >
      <View className="flex-1">
        <View className="items-center px-5 pb-1 pt-4">
          <Typography type="body" weight="normal">
            Location
          </Typography>
        </View>

        <StyledBottomSheetScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-5 px-3 pb-4 pt-2"
        >
          <LocationMap
            main={main}
            radiusMiles={radiusMiles}
            others={selectedForMap}
          />

          <LocationMainSearch
            query={query}
            onQueryChange={onQueryChange}
            predictions={predictions}
            showPredictions={showPredictions}
            onSelect={onSelectMain}
            selected={main}
          />

          {main != null ? (
            <>
              <LocationRadius value={radiusMiles} onChange={onRadiusChange} />
              <LocationPlatformsSection
                platforms={platforms}
                onPlatformsChange={onPlatformsChange}
              />
              <LocationOtherList
                places={multiPlaces}
                speeds={otherSpeeds}
                onSpeedChange={onOtherSpeedChange}
                loading={nearbyLoading}
                centerId={main.id}
                disabled={locationsDisabled}
                speedOptionsByLocation={speedOptionsByLocation}
              />
            </>
          ) : (
            <Typography type="body-xs" className="mx-1 text-muted">
              Search and select a main location to set radius, platforms, and
              nearby areas.
            </Typography>
          )}
        </StyledBottomSheetScrollView>

        <LocationErrorInfoDialog
          errors={footerErrors}
          intervalOptions={intervalOptions}
          infoReason={infoReason}
          onInfoReasonChange={setInfoReason}
        />

        <View className="flex-row gap-3 px-5 pb-6 pt-2">
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
            isDisabled={!canSave}
            onPress={handleSave}
          >
            <Button.Label>Save</Button.Label>
          </Button>
        </View>
      </View>
    </BottomSheet.Content>
  );
}

interface SearchBottomSheetLocationSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set (e.g. edit credit-back), overrides SubscriptionStore options. */
  intervalOptions?: IntervalOption[];
}

export const SearchBottomSheetLocationSheet = observer(
  function SearchBottomSheetLocationSheet({
    isOpen,
    onOpenChange,
    intervalOptions: intervalOptionsProp,
  }: SearchBottomSheetLocationSheetProps): JSX.Element | null {
    const { subscriptionStore } = useStore();
    const draft = useMemo(() => getLocationDraft(), []);
    const [main, setMain] = useState<LocationResult | null>(draft.main);
    const [radiusMiles, setRadiusMiles] = useState(
      draft.radiusMiles || DEFAULT_RADIUS_MILES,
    );
    const [platforms, setPlatforms] = useState<LocationPlatform[]>(
      draft.platforms?.length ? draft.platforms : ["facebook"],
    );
    const [otherSpeeds, setOtherSpeeds] = useState<
      Record<string, LocationRunSpeed>
    >(draft.otherSpeeds);
    const [query, setQuery] = useState(draft.main?.displayName ?? "");
    const [predictions, setPredictions] = useState<LocationResult[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const [nearby, setNearby] = useState<LocationResult[]>([]);
    const [nearbyLoading, setNearbyLoading] = useState(false);
    const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
    const [showValidation, setShowValidation] = useState(false);

    const intervalOptions =
      intervalOptionsProp ?? subscriptionStore.intervalOptions;

    useEffect(() => {
      if (!isOpen) return;
      const next = getLocationDraft();
      setMain(next.main);
      setRadiusMiles(next.radiusMiles || DEFAULT_RADIUS_MILES);
      setPlatforms(
        next.platforms?.length > 0 ? next.platforms : ["facebook"],
      );
      setOtherSpeeds(next.otherSpeeds ?? {});
      setQuery(next.main?.displayName ?? "");
      setShowPredictions(false);
      setPredictions([]);
      setRowErrors({});
      setShowValidation(false);
    }, [isOpen]);

    useEffect(() => {
      if (!isOpen || !showPredictions) return;
      const term = query.trim();
      if (term.length < 2) {
        setPredictions([]);
        return;
      }

      let cancelled = false;
      const timer = setTimeout(() => {
        void searchLocations(term).then((results) => {
          if (!cancelled) setPredictions(results);
        });
      }, 180);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }, [query, showPredictions, isOpen]);

    useEffect(() => {
      if (!isOpen || main == null) {
        if (main == null) setNearby([]);
        return;
      }

      let cancelled = false;
      setNearbyLoading(true);
      void getNearbyLocations(main).then((results) => {
        if (cancelled) return;
        setNearby(results);
        setOtherSpeeds((prev) => {
          const next: Record<string, LocationRunSpeed> = {};
          if (prev[main.id] != null) next[main.id] = prev[main.id];
          for (const place of results) {
            if (prev[place.id] != null) next[place.id] = prev[place.id];
          }
          // Keep selected speeds for edit-prefilled places outside nearby.
          for (const [id, speed] of Object.entries(prev)) {
            if (isLocationSpeedSelected(speed) && next[id] == null) {
              next[id] = speed;
            }
          }
          return next;
        });
        setNearbyLoading(false);
      });

      return () => {
        cancelled = true;
      };
    }, [main, isOpen]);

    const multiPlaces = useMemo(() => {
      if (main == null) return nearby;
      const byId = new Map<string, LocationResult>();
      byId.set(main.id, main);
      for (const place of nearby) {
        if (place.id !== main.id) byId.set(place.id, place);
      }
      for (const [id, speed] of Object.entries(otherSpeeds)) {
        if (!isLocationSpeedSelected(speed) || byId.has(id)) continue;
        const fromFixture = locationsFixture.find((place) => place.id === id);
        if (fromFixture != null) {
          byId.set(id, fromFixture);
        }
      }
      const rest = [...byId.values()].filter((place) => place.id !== main.id);
      return [main, ...rest];
    }, [main, nearby, otherSpeeds]);

    const draftSpeeds = useMemo(
      () => toDraftSpeeds(multiPlaces, otherSpeeds),
      [multiPlaces, otherSpeeds],
    );

    const locationsDisabled = platforms.length === 0;

    const speedOptionsByLocation = useMemo(() => {
      const map: Record<
        string,
        Array<{ speed: LocationRunSpeed; enabled: boolean }>
      > = {};
      for (const place of multiPlaces) {
        map[place.id] = availableSpeedsForLocation({
          platforms,
          locationSpeeds: draftSpeeds,
          centerId: main?.id ?? null,
          locationId: place.id,
          intervalOptions,
        });
      }
      return map;
    }, [multiPlaces, platforms, draftSpeeds, main?.id, intervalOptions]);

    const validationError = useMemo(
      () =>
        validateLocationDraft({
          platforms,
          locationSpeeds: draftSpeeds,
          centerId: main?.id ?? null,
          intervalOptions,
        }),
      [platforms, draftSpeeds, main?.id, intervalOptions],
    );

    const platformsError =
      showValidation && platforms.length === 0
        ? "Select at least one platform."
        : null;

    const listError =
      showValidation && validationError != null && platforms.length > 0
        ? validationError
        : null;

    const canSave =
      main != null && validationError == null && Object.keys(rowErrors).length === 0;

    const selectedForMap = multiPlaces.filter(
      (place) =>
        place.id !== main?.id &&
        isLocationSpeedSelected(otherSpeeds[place.id] ?? "none"),
    );

    const handleQueryChange = (value: string) => {
      setQuery(value);
      setShowPredictions(true);
      if (main != null && value.trim() !== main.displayName) {
        setMain(null);
        setOtherSpeeds({});
        setRowErrors({});
      }
    };

    const handleSelectMain = (place: LocationResult) => {
      setMain(place);
      setQuery(place.displayName);
      setShowPredictions(false);
      setPredictions([]);
      setOtherSpeeds({});
      setRowErrors({});
      setShowValidation(false);
    };

    const handlePlatformsChange = (next: LocationPlatform[]) => {
      setPlatforms(next);
      setShowValidation(true);
      setRowErrors({});
      // Non-FB only: keep at most one selected location (prefer center).
      const hasFacebook = next.includes("facebook");
      if (!hasFacebook && next.length > 0) {
        setOtherSpeeds((prev) => {
          const selectedIds = Object.entries(prev)
            .filter(([, speed]) => isLocationSpeedSelected(speed))
            .map(([id]) => id);
          if (selectedIds.length <= 1) return prev;
          const keepId =
            main != null && selectedIds.includes(main.id)
              ? main.id
              : selectedIds[0];
          const cleaned: Record<string, LocationRunSpeed> = {};
          if (keepId != null && prev[keepId] != null) {
            cleaned[keepId] = prev[keepId];
          }
          return cleaned;
        });
      }
    };

    const handleOtherSpeedChange = (id: string, speed: LocationRunSpeed) => {
      if (locationsDisabled) {
        setRowErrors({ [id]: "Select at least one platform." });
        return;
      }

      const place = multiPlaces.find((item) => item.id === id);
      const nextSpeedsList = draftSpeeds.map((row) =>
        row.locationId === id ? { ...row, speed } : row,
      );
      if (!nextSpeedsList.some((row) => row.locationId === id)) {
        nextSpeedsList.push({
          locationId: id,
          locationName: place?.name ?? id,
          speed,
        });
      }

      const hasFacebook = platforms.includes("facebook");
      if (!hasFacebook && speed !== "none") {
        const otherSelected = nextSpeedsList.filter(
          (row) => row.locationId !== id && row.speed !== "none",
        );
        if (otherSelected.length > 0) {
          // Auto-collapse: clear others, keep this assignment if slots allow.
          const collapsed = nextSpeedsList.map((row) =>
            row.locationId === id ? row : { ...row, speed: "none" as const },
          );
          const check = canAssignLocationSpeed({
            platforms,
            locationSpeeds: collapsed,
            centerId: main?.id ?? null,
            locationId: id,
            nextSpeed: speed,
            intervalOptions,
          });
          if (!check.ok) {
            setRowErrors({
              [id]:
                check.reason ??
                "Not enough remaining slots for this speed.",
            });
            return;
          }
          setOtherSpeeds({ [id]: speed });
          setRowErrors({});
          setShowValidation(true);
          return;
        }
      }

      const check = canAssignLocationSpeed({
        platforms,
        locationSpeeds: draftSpeeds,
        centerId: main?.id ?? null,
        locationId: id,
        nextSpeed: speed,
        intervalOptions,
      });
      if (!check.ok) {
        setRowErrors({
          [id]: check.reason ?? "Not enough remaining slots for this speed.",
        });
        return;
      }

      setOtherSpeeds((prev) => {
        if (speed === "none") {
          const next = { ...prev };
          delete next[id];
          return next;
        }
        return { ...prev, [id]: speed };
      });
      setRowErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setShowValidation(true);
    };

    const handlePersist = () => {
      if (main == null || validationError != null) {
        setShowValidation(true);
        return;
      }
      setLocationDraft({
        main,
        radiusMiles,
        platforms,
        otherSpeeds,
      });
    };

    return (
      <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
        <LocationSheetContent
          main={main}
          radiusMiles={radiusMiles}
          platforms={platforms}
          otherSpeeds={otherSpeeds}
          query={query}
          predictions={predictions}
          showPredictions={showPredictions}
          multiPlaces={multiPlaces}
          nearbyLoading={nearbyLoading}
          selectedForMap={selectedForMap}
          locationsDisabled={locationsDisabled}
          speedOptionsByLocation={speedOptionsByLocation}
          rowErrors={rowErrors}
          listError={listError}
          platformsError={platformsError}
          intervalOptions={intervalOptions}
          canSave={canSave}
          onQueryChange={handleQueryChange}
          onSelectMain={handleSelectMain}
          onRadiusChange={setRadiusMiles}
          onPlatformsChange={handlePlatformsChange}
          onOtherSpeedChange={handleOtherSpeedChange}
          onPersist={handlePersist}
        />
      </SheetShell>
    );
  },
);
