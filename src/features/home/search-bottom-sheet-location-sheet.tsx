import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  BottomSheet,
  PressableFeedback,
  Typography,
  useBottomSheet,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { LocationMainSearch } from "@/features/home/location-main-search";
import { LocationMap } from "@/features/home/location-map";
import { LocationOtherList } from "@/features/home/location-other-list";
import { LocationRadius } from "@/features/home/location-radius";
import { SheetShell } from "@/features/home/sheet-shell";
import {
  DEFAULT_RADIUS_MILES,
  type LocationResult,
} from "@/mocks/data/locations";
import {
  getLocationDraft,
  getNearbyLocations,
  searchLocations,
  setLocationDraft,
} from "@/mocks/services/location";

const StyledIonicons = withUniwind(Ionicons);

function LocationSheetContent({
  main,
  radiusMiles,
  otherIds,
  query,
  predictions,
  showPredictions,
  nearby,
  nearbyLoading,
  selectedOthers,
  onQueryChange,
  onSelectMain,
  onRadiusChange,
  onToggleOther,
  onPersist,
}: {
  main: LocationResult | null;
  radiusMiles: number;
  otherIds: string[];
  query: string;
  predictions: LocationResult[];
  showPredictions: boolean;
  nearby: LocationResult[];
  nearbyLoading: boolean;
  selectedOthers: LocationResult[];
  onQueryChange: (value: string) => void;
  onSelectMain: (place: LocationResult) => void;
  onRadiusChange: (miles: number) => void;
  onToggleOther: (id: string, selected: boolean) => void;
  onPersist: () => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const snapPoints = useMemo(() => ["92%"], []);

  const handleBack = () => {
    onPersist();
    onOpenChange(false);
  };

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      enableOverDrag={false}
      enableDynamicSizing={false}
      keyboardBehavior="extend"
      backgroundClassName="rounded-t-[32px] bg-surface-secondary"
      handleComponent={null}
      contentContainerClassName="h-full bg-surface-secondary p-0"
    >
      <View className="flex-1">
        <View className="flex-row items-center px-8 pt-3 pb-2">
          <PressableFeedback
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="h-9 w-9 items-center justify-center rounded-full bg-danger/15"
            animation={{ scale: { value: 0.92 } }}
          >
            <StyledIonicons name="close" size={20} className="text-danger" />
          </PressableFeedback>
          <View className="flex-1 items-center px-2">
            <Typography type="body" weight="normal">
              Location
            </Typography>
          </View>
          <View className="h-9 w-9" />
        </View>

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-5 px-3 pb-8 pt-2"
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
                selectedIds={otherIds}
                onToggle={onToggleOther}
                loading={nearbyLoading}
              />
            </>
          ) : (
            <Typography type="body-xs" className="mx-1 text-muted">
              Search and select a main location to set radius and nearby areas.
            </Typography>
          )}
        </ScrollView>
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
  const [otherIds, setOtherIds] = useState<string[]>(draft.otherIds);
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
    setOtherIds(next.otherIds);
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
      setOtherIds((prev) =>
        prev.filter((id) => results.some((place) => place.id === id)),
      );
      setNearbyLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [main, isOpen]);

  const selectedOthers = nearby.filter((place) => otherIds.includes(place.id));

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowPredictions(true);
    if (main != null && value.trim() !== main.displayName) {
      setMain(null);
      setOtherIds([]);
    }
  };

  const handleSelectMain = (place: LocationResult) => {
    setMain(place);
    setQuery(place.displayName);
    setShowPredictions(false);
    setPredictions([]);
    setOtherIds([]);
  };

  const handleToggleOther = (id: string, selected: boolean) => {
    setOtherIds((prev) => {
      if (selected) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((value) => value !== id);
    });
  };

  const handlePersist = () => {
    if (main == null) return;
    setLocationDraft({
      main,
      radiusMiles,
      otherIds,
    });
  };

  return (
    <SheetShell
      visible={isOpen}
      onClose={() => {
        handlePersist();
        onOpenChange(false);
      }}
    >
      <LocationSheetContent
        main={main}
        radiusMiles={radiusMiles}
        otherIds={otherIds}
        query={query}
        predictions={predictions}
        showPredictions={showPredictions}
        nearby={nearby}
        nearbyLoading={nearbyLoading}
        selectedOthers={selectedOthers}
        onQueryChange={handleQueryChange}
        onSelectMain={handleSelectMain}
        onRadiusChange={setRadiusMiles}
        onToggleOther={handleToggleOther}
        onPersist={handlePersist}
      />
    </SheetShell>
  );
}
