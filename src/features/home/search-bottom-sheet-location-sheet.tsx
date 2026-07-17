import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { BottomSheet, Button, Typography, useBottomSheet } from "heroui-native";
import { withUniwind } from "uniwind";

import { LocationMainSearch } from "@/features/home/location-main-search";
import { LocationMap } from "@/features/home/location-map";
import { LocationOtherList } from "@/features/home/location-other-list";
import { LocationRadius } from "@/features/home/location-radius";
import { SheetShell } from "@/features/home/sheet-shell";
import {
  DEFAULT_RADIUS_MILES,
  isLocationSpeedSelected,
  type LocationResult,
  type LocationRunSpeed,
} from "@/mocks/data/locations";
import {
  getLocationDraft,
  getNearbyLocations,
  searchLocations,
  setLocationDraft,
} from "@/mocks/services/location";

const StyledBottomSheetScrollView = withUniwind(BottomSheetScrollView);

function LocationSheetContent({
  main,
  radiusMiles,
  otherSpeeds,
  query,
  predictions,
  showPredictions,
  nearby,
  nearbyLoading,
  selectedOthers,
  onQueryChange,
  onSelectMain,
  onRadiusChange,
  onOtherSpeedChange,
  onPersist,
}: {
  main: LocationResult | null;
  radiusMiles: number;
  otherSpeeds: Record<string, LocationRunSpeed>;
  query: string;
  predictions: LocationResult[];
  showPredictions: boolean;
  nearby: LocationResult[];
  nearbyLoading: boolean;
  selectedOthers: LocationResult[];
  onQueryChange: (value: string) => void;
  onSelectMain: (place: LocationResult) => void;
  onRadiusChange: (miles: number) => void;
  onOtherSpeedChange: (id: string, speed: LocationRunSpeed) => void;
  onPersist: () => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const snapPoints = useMemo(() => ["92%"], []);
  const dismiss = () => onOpenChange(false);

  const handleSave = () => {
    onPersist();
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
      className="overflow-hidden"
      backgroundClassName="rounded-t-[32px] bg-surface-secondary"
      handleComponent={null}
      contentContainerClassName="h-full p-0"
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
            others={selectedOthers}
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
              <LocationOtherList
                places={nearby}
                speeds={otherSpeeds}
                onSpeedChange={onOtherSpeedChange}
                loading={nearbyLoading}
              />
            </>
          ) : (
            <Typography type="body-xs" className="mx-1 text-muted">
              Search and select a main location to set radius and nearby areas.
            </Typography>
          )}
        </StyledBottomSheetScrollView>

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
            isDisabled={main == null}
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
}

export function SearchBottomSheetLocationSheet({
  isOpen,
  onOpenChange,
}: SearchBottomSheetLocationSheetProps): JSX.Element | null {
  const draft = useMemo(() => getLocationDraft(), []);
  const [main, setMain] = useState<LocationResult | null>(draft.main);
  const [radiusMiles, setRadiusMiles] = useState(
    draft.radiusMiles || DEFAULT_RADIUS_MILES,
  );
  const [otherSpeeds, setOtherSpeeds] = useState<
    Record<string, LocationRunSpeed>
  >(draft.otherSpeeds);
  const [query, setQuery] = useState(draft.main?.displayName ?? "");
  const [predictions, setPredictions] = useState<LocationResult[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [nearby, setNearby] = useState<LocationResult[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const next = getLocationDraft();
    setMain(next.main);
    setRadiusMiles(next.radiusMiles || DEFAULT_RADIUS_MILES);
    setOtherSpeeds(next.otherSpeeds ?? {});
    setQuery(next.main?.displayName ?? "");
    setShowPredictions(false);
    setPredictions([]);
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
        for (const place of results) {
          if (prev[place.id] != null) next[place.id] = prev[place.id];
        }
        return next;
      });
      setNearbyLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [main, isOpen]);

  const selectedOthers = nearby.filter((place) =>
    isLocationSpeedSelected(otherSpeeds[place.id] ?? "none"),
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowPredictions(true);
    if (main != null && value.trim() !== main.displayName) {
      setMain(null);
      setOtherSpeeds({});
    }
  };

  const handleSelectMain = (place: LocationResult) => {
    setMain(place);
    setQuery(place.displayName);
    setShowPredictions(false);
    setPredictions([]);
    setOtherSpeeds({});
  };

  const handleOtherSpeedChange = (id: string, speed: LocationRunSpeed) => {
    setOtherSpeeds((prev) => {
      if (speed === "none") {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: speed };
    });
  };

  const handlePersist = () => {
    if (main == null) return;
    setLocationDraft({
      main,
      radiusMiles,
      otherSpeeds,
    });
  };

  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <LocationSheetContent
        main={main}
        radiusMiles={radiusMiles}
        otherSpeeds={otherSpeeds}
        query={query}
        predictions={predictions}
        showPredictions={showPredictions}
        nearby={nearby}
        nearbyLoading={nearbyLoading}
        selectedOthers={selectedOthers}
        onQueryChange={handleQueryChange}
        onSelectMain={handleSelectMain}
        onRadiusChange={setRadiusMiles}
        onOtherSpeedChange={handleOtherSpeedChange}
        onPersist={handlePersist}
      />
    </SheetShell>
  );
}
