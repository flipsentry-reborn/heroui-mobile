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

import { SearchBottomSheetCriteria } from "@/features/home/search-bottom-sheet-criteria";
import { SearchBottomSheetHeader } from "@/features/home/search-bottom-sheet-header";
import { SearchBottomSheetPriceSheet } from "@/features/home/search-bottom-sheet-price-sheet";
import { SearchBottomSheetRow } from "@/features/home/search-bottom-sheet-row";
import { SearchBottomSheetSection } from "@/features/home/search-bottom-sheet-section";
import { SearchBottomSheetTypeSelect } from "@/features/home/search-bottom-sheet-type-select";
import { SheetShell } from "@/features/home/sheet-shell";
import type { SearchType } from "@/mocks/data/home";

function SearchSheetContent({
  locationLabel,
  onLocationPress,
  searchType,
  onSearchTypeChange,
  minPrice,
  maxPrice,
  onPriceOpenChange,
  onMinChange,
  onMaxChange,
}: {
  locationLabel: string;
  onLocationPress?: () => void;
  searchType: SearchType | null;
  onSearchTypeChange: (type: SearchType) => void;
  minPrice: string;
  maxPrice: string;
  onPriceOpenChange: (open: boolean) => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const [muted] = useThemeColor(["muted"]);
  const snapPoints = useMemo(() => ["70%", "92%"], []);
  const dismiss = () => onOpenChange(false);

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      enableOverDrag={false}
      enableDynamicSizing={false}
      keyboardBehavior="extend"
      contentContainerClassName="h-full bg-surface-secondary p-0"
      backgroundClassName="rounded-t-[32px] bg-surface-secondary"
      handleComponent={null}
    >
      <View className="flex-1">
        <SearchBottomSheetHeader onClose={dismiss} onConfirm={dismiss} />

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
          hasSearchType={searchType != null}
          price={{
            min: minPrice,
            max: maxPrice,
            onOpenChange: onPriceOpenChange,
            onMinChange,
            onMaxChange,
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
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchType, setSearchType] = useState<SearchType | null>(null);

  const handleClose = () => {
    setPriceOpen(false);
    onClose();
  };

  return (
    <>
      <SheetShell visible={visible} onClose={handleClose}>
        <SearchSheetContent
          locationLabel={locationLabel}
          onLocationPress={onLocationPress}
          searchType={searchType}
          onSearchTypeChange={setSearchType}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceOpenChange={setPriceOpen}
          onMinChange={setMinPrice}
          onMaxChange={setMaxPrice}
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
    </>
  );
}
