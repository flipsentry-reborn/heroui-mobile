import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Typography,
  useBottomSheet,
} from "heroui-native";
import { withUniwind } from "uniwind";

import {
  autoAssignLocationSpeeds,
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
import {
  LocationPlatformsRow,
  LocationPlatformsSheet,
} from "@/features/home/location-platforms-section";
import { LocationRadius } from "@/features/home/location-radius";
import { SearchBottomSheetHeader } from "@/features/home/search-bottom-sheet-header";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import { SheetContent } from "@/features/home/sheet-content";
import agent from "@/api/agent";
import {
  defaultEnabledPlatforms,
  inferCountryCode,
  normalizeAvailablePlatforms,
  syncEnabledWithAvailable,
} from "@/lib/location-platforms";
import {
  enrichMainFromOriginal,
  mergePlacesByPlaceId,
  placeRowId,
  remapSpeedsByPlaceId,
  suggestedLocationToResult,
} from "@/lib/location-suggest";
import type { SuggestLocationsResult } from "@/models/search-group";
import {
  DEFAULT_RADIUS_MILES,
  isLocationSpeedSelected,
  type LocationPlatform,
  type LocationResult,
  type LocationRunSpeed,
} from "@/mocks/data/locations";
import {
  getLocationDraft,
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
  onRadiusChangeEnd,
  onPlatformsPress,
  onOtherSpeedChange,
  onPersist,
  childSheetOpen,
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
  onRadiusChangeEnd: (miles: number) => void;
  onPlatformsPress: () => void;
  onOtherSpeedChange: (id: string, speed: LocationRunSpeed) => void;
  onPersist: () => void;
  childSheetOpen?: boolean;
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
    <SheetContent
      snapPoints={snapPoints}
      enableOverDrag={false}
      enableDynamicSizing={false}
      keyboardBehavior={childSheetOpen ? undefined : "extend"}
      keyboardBlurBehavior={childSheetOpen ? undefined : "restore"}
      android_keyboardInputMode={childSheetOpen ? undefined : "adjustResize"}
      className={SHEET_CONTENT_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
      handleComponent={null}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME}
    >
      <View className="flex-1">
        <SearchBottomSheetHeader
          title="Location"
          onCancel={dismiss}
          onSave={handleSave}
          saveDisabled={!canSave}
        />

        <StyledBottomSheetScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-5 px-3 pb-6 pt-2"
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
              <LocationRadius
                value={radiusMiles}
                onChange={onRadiusChange}
                onChangeEnd={onRadiusChangeEnd}
              />
              <LocationPlatformsRow
                platforms={platforms}
                onPress={onPlatformsPress}
              />
              <LocationOtherList
                places={multiPlaces}
                speeds={otherSpeeds}
                onSpeedChange={onOtherSpeedChange}
                loading={nearbyLoading}
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
      </View>
    </SheetContent>
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
    /** Only updates on slider release — drives SuggestLocations. */
    const [committedRadiusMiles, setCommittedRadiusMiles] = useState(
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
    const [platformsSheetOpen, setPlatformsSheetOpen] = useState(false);
    const [availablePlatforms, setAvailablePlatforms] = useState<
      LocationPlatform[]
    >([]);
    const [autoAssignKey, setAutoAssignKey] = useState(0);
    /** When true, skip greedy auto-assign (edit open / user edited speeds). */
    const skipAutoAssignRef = useRef(false);

    const intervalOptions =
      intervalOptionsProp ?? subscriptionStore.intervalOptions;

    const requestAutoAssign = () => {
      skipAutoAssignRef.current = false;
      setAutoAssignKey((value) => value + 1);
    };

    useEffect(() => {
      if (!isOpen) {
        setPlatformsSheetOpen(false);
        return;
      }
      const next = getLocationDraft();
      setMain(next.main);
      const nextRadius = next.radiusMiles || DEFAULT_RADIUS_MILES;
      setRadiusMiles(nextRadius);
      setCommittedRadiusMiles(nextRadius);
      setPlatforms(
        next.platforms?.length > 0 ? next.platforms : ["facebook"],
      );
      setOtherSpeeds(next.otherSpeeds ?? {});
      setQuery(next.main?.displayName ?? "");
      setShowPredictions(false);
      setPredictions([]);
      setRowErrors({});
      setShowValidation(false);
      setAvailablePlatforms([]);
      skipAutoAssignRef.current = Object.values(next.otherSpeeds ?? {}).some(
        isLocationSpeedSelected,
      );
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
        void agent.Locations.search(term)
          .then((results) => {
            if (!cancelled) setPredictions(results);
          })
          .catch(() => {
            if (!cancelled) setPredictions([]);
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
      // Wait until Place Details resolved (live Google predictions start at 0,0).
      if (main.latitude === 0 && main.longitude === 0) {
        return;
      }

      let cancelled = false;
      setNearbyLoading(true);
      void agent.GroupSearch.suggestLocations({
        latitude: main.latitude,
        longitude: main.longitude,
        radiusMiles: committedRadiusMiles,
        centerLocationName: main.displayName || main.name,
      })
        .then((result: SuggestLocationsResult) => {
          if (cancelled) return;
          const results = result.suggestedLocations.map(
            suggestedLocationToResult,
          );
          setNearby(results);
          const enrichedMain =
            result.originalLocation != null
              ? enrichMainFromOriginal(main, result.originalLocation)
              : main;
          if (
            enrichedMain.id !== main.id ||
            enrichedMain.placeId !== main.placeId ||
            enrichedMain.geoNameId !== main.geoNameId ||
            enrichedMain.countryCode !== main.countryCode ||
            enrichedMain.timeZoneId !== main.timeZoneId ||
            enrichedMain.displayName !== main.displayName ||
            enrichedMain.name !== main.name
          ) {
            setMain(enrichedMain);
            setQuery(enrichedMain.displayName || enrichedMain.name);
          }
          // Remap speed keys onto placeIds after suggest (heals legacy center with no PlaceId).
          setOtherSpeeds((prev) => {
            const draftPlaces = getLocationDraft().placesById ?? {};
            const placesCache: Record<string, LocationResult> = {
              ...draftPlaces,
              [main.id]: enrichedMain,
              [placeRowId(enrichedMain) || enrichedMain.id]: enrichedMain,
            };
            for (const place of results) {
              placesCache[place.id] = place;
            }
            const saved = Object.entries(prev)
              .filter(([, speed]) => isLocationSpeedSelected(speed))
              .map(([id]) => placesCache[id])
              .filter((place): place is LocationResult => place != null);
            const targets = mergePlacesByPlaceId(enrichedMain, results, saved);
            const remapped = remapSpeedsByPlaceId(prev, placesCache, targets);
            const mainKey = placeRowId(enrichedMain) || enrichedMain.id;
            if (remapped.speeds[mainKey] == null && prev[main.id] != null) {
              remapped.speeds[mainKey] = prev[main.id];
            }
            setLocationDraft({
              ...getLocationDraft(),
              placesById: {
                ...getLocationDraft().placesById,
                ...remapped.placesById,
                [enrichedMain.id]: enrichedMain,
              },
            });
            return remapped.speeds;
          });
          setNearbyLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setNearby([]);
          setNearbyLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [
      main?.id,
      main?.latitude,
      main?.longitude,
      committedRadiusMiles,
      isOpen,
    ]);

    // Fetch platform availability for the selected location's country.
    useEffect(() => {
      if (!isOpen || main == null) return;
      if (main.latitude === 0 && main.longitude === 0) return;

      const country = inferCountryCode({
        countryCode: main.countryCode,
        displayName: main.displayName,
        name: main.name,
      });

      let cancelled = false;
      void agent.Platform.getAvailable(country)
        .then((list) => {
          if (cancelled) return;
          const available = normalizeAvailablePlatforms(list);
          setAvailablePlatforms((prev) =>
            prev.length === available.length &&
            prev.every((platform, index) => platform === available[index])
              ? prev
              : available,
          );
          setPlatforms((prev) => {
            const next = skipAutoAssignRef.current
              ? syncEnabledWithAvailable(prev, available)
              : defaultEnabledPlatforms(available);
            return prev.length === next.length &&
              prev.every((platform, index) => platform === next[index])
              ? prev
              : next;
          });
        })
        .catch((error) => {
          console.warn(
            "[LocationSheet] Failed to fetch available platforms:",
            error,
          );
          if (cancelled) return;
          const fallback = normalizeAvailablePlatforms(["facebook"]);
          setAvailablePlatforms((prev) =>
            prev.length === fallback.length &&
            prev.every((platform, index) => platform === fallback[index])
              ? prev
              : fallback,
          );
          setPlatforms((prev) => {
            const next = skipAutoAssignRef.current
              ? syncEnabledWithAvailable(prev, fallback)
              : defaultEnabledPlatforms(fallback);
            return prev.length === next.length &&
              prev.every((platform, index) => platform === next[index])
              ? prev
              : next;
          });
        });

      return () => {
        cancelled = true;
      };
    }, [
      isOpen,
      main?.id,
      main?.countryCode,
      main?.displayName,
      main?.name,
      main?.latitude,
      main?.longitude,
    ]);

    const placesById = useMemo(() => {
      const map: Record<string, LocationResult> = {
        ...(getLocationDraft().placesById ?? {}),
      };
      if (main != null) {
        map[main.id] = main;
        const key = placeRowId(main);
        if (key) map[key] = { ...main, id: key };
      }
      for (const place of nearby) {
        map[place.id] = place;
      }
      return map;
    }, [main, nearby]);

    const multiPlaces = useMemo(() => {
      const saved = Object.entries(otherSpeeds)
        .filter(([, speed]) => isLocationSpeedSelected(speed))
        .map(([id]) => placesById[id])
        .filter((place): place is LocationResult => place != null);
      return mergePlacesByPlaceId(main, nearby, saved);
    }, [main, nearby, otherSpeeds, placesById]);

    // After suggest + platforms settle, greedily assign best intervals top→bottom.
    useEffect(() => {
      if (!isOpen || main == null || nearbyLoading) return;
      if (skipAutoAssignRef.current) return;
      if (platforms.length === 0) return;

      const locations = [
        { locationId: main.id, locationName: main.name },
        ...nearby
          .filter((place) => place.id !== main.id)
          .map((place) => ({
            locationId: place.id,
            locationName: place.name,
          })),
      ];
      const assigned = autoAssignLocationSpeeds({
        platforms,
        locations,
        centerId: main.id,
        intervalOptions,
      });
      setOtherSpeeds((prev) => {
        const nextIds = Object.keys(assigned);
        const prevIds = Object.keys(prev);
        if (
          nextIds.length === prevIds.length &&
          nextIds.every((id) => prev[id] === assigned[id])
        ) {
          return prev;
        }
        return assigned;
      });
      setRowErrors({});
    }, [
      autoAssignKey,
      isOpen,
      main?.id,
      main?.name,
      nearbyLoading,
      nearby,
      platforms,
      intervalOptions,
    ]);

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
      main != null &&
      !nearbyLoading &&
      validationError == null &&
      Object.keys(rowErrors).length === 0;

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
        setAvailablePlatforms([]);
      }
    };

    const handleSelectMain = (place: LocationResult) => {
      setShowPredictions(false);
      setPredictions([]);
      setOtherSpeeds({});
      setRowErrors({});
      setShowValidation(false);
      setQuery(place.displayName);
      requestAutoAssign();

      // Live Google predictions need Place Details before we have coords.
      if (
        place.placeId != null &&
        (place.latitude === 0 || place.longitude === 0)
      ) {
        void agent.Locations.resolve(place)
          .then((resolved) => {
            setMain(resolved);
            setQuery(resolved.displayName);
          })
          .catch((error) => {
            console.warn("[LocationSheet] Failed to resolve place:", error);
            setMain(null);
          });
        return;
      }

      setMain(place);
    };

    const handlePlatformsChange = (next: LocationPlatform[]) => {
      setPlatforms(next);
      setShowValidation(true);
      setRowErrors({});
      requestAutoAssign();
    };

    const handleOtherSpeedChange = (id: string, speed: LocationRunSpeed) => {
      skipAutoAssignRef.current = true;
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
      const nextPlaces: Record<string, LocationResult> = { ...placesById };
      for (const place of multiPlaces) {
        nextPlaces[place.id] = place;
      }
      setLocationDraft({
        main,
        radiusMiles,
        platforms,
        otherSpeeds,
        placesById: nextPlaces,
      });
    };

    return (
      <>
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
            childSheetOpen={platformsSheetOpen}
            onQueryChange={handleQueryChange}
            onSelectMain={handleSelectMain}
            onRadiusChange={setRadiusMiles}
            onRadiusChangeEnd={(miles) => {
              setRadiusMiles(miles);
              setCommittedRadiusMiles(miles);
              requestAutoAssign();
            }}
            onPlatformsPress={() => setPlatformsSheetOpen(true)}
            onOtherSpeedChange={handleOtherSpeedChange}
            onPersist={handlePersist}
          />
        </SheetShell>
        <LocationPlatformsSheet
          isOpen={platformsSheetOpen}
          onOpenChange={setPlatformsSheetOpen}
          platforms={platforms}
          availablePlatforms={availablePlatforms}
          onPlatformsChange={handlePlatformsChange}
        />
      </>
    );
  },
);
