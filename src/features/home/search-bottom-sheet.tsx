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

import PlatformIcon from "@/components/icons/PlatformIcon";
import {
  isCustomSearchQueryValid,
  SearchBottomSheetCriteria,
} from "@/features/home/search-bottom-sheet-criteria";
import { SearchBottomSheetHeader } from "@/features/home/search-bottom-sheet-header";
import { SearchBottomSheetKeywordsSheet } from "@/features/home/search-bottom-sheet-keywords-sheet";
import {
  DEFAULT_SEARCH_PLATFORMS,
  formatPlatformsLabel,
  SearchBottomSheetPlatformsSheet,
} from "@/features/home/search-bottom-sheet-platforms-sheet";
import { SearchBottomSheetPriceSheet } from "@/features/home/search-bottom-sheet-price-sheet";
import { SearchBottomSheetRow } from "@/features/home/search-bottom-sheet-row";
import { SearchBottomSheetSection } from "@/features/home/search-bottom-sheet-section";
import { SearchBottomSheetTypeSelect } from "@/features/home/search-bottom-sheet-type-select";
import { SheetShell } from "@/features/home/sheet-shell";
import type { HomePlatform, SearchType } from "@/mocks/data/home";

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
  minPrice,
  maxPrice,
  onPriceOpenChange,
  onMinChange,
  onMaxChange,
  keywordIncluders,
  keywordExcluders,
  onKeywordsOpenChange,
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
  minPrice: string;
  maxPrice: string;
  onPriceOpenChange: (open: boolean) => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  keywordIncluders: string[];
  keywordExcluders: string[];
  onKeywordsOpenChange: (open: boolean) => void;
  selectedPlatforms: HomePlatform[];
  onPlatformsOpenChange: (open: boolean) => void;
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
      keyboardBehavior="extend"
      contentContainerClassName="h-full bg-surface-secondary p-0"
      backgroundClassName="rounded-t-[32px] bg-surface-secondary"
      handleComponent={null}
    >
      <View className="flex-1">
        <SearchBottomSheetHeader onClose={dismiss} onConfirm={handleConfirm} />

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
          price={{
            min: minPrice,
            max: maxPrice,
            onOpenChange: onPriceOpenChange,
            onMinChange,
            onMaxChange,
          }}
          keywords={{
            includers: keywordIncluders,
            excluders: keywordExcluders,
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
  const [keywordsOpen, setKeywordsOpen] = useState(false);
  const [platformsOpen, setPlatformsOpen] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchType, setSearchType] = useState<SearchType | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [customQueryInvalid, setCustomQueryInvalid] = useState(false);
  const [keywordIncluders, setKeywordIncluders] = useState<string[]>([]);
  const [keywordExcluders, setKeywordExcluders] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<HomePlatform[]>(
    DEFAULT_SEARCH_PLATFORMS,
  );

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type);
    if (type !== "custom") {
      setCustomQuery("");
      setCustomQueryInvalid(false);
    }
  };

  const handleClose = () => {
    setPriceOpen(false);
    setKeywordsOpen(false);
    setPlatformsOpen(false);
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
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceOpenChange={setPriceOpen}
          onMinChange={setMinPrice}
          onMaxChange={setMaxPrice}
          keywordIncluders={keywordIncluders}
          keywordExcluders={keywordExcluders}
          onKeywordsOpenChange={setKeywordsOpen}
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

      <SearchBottomSheetKeywordsSheet
        isOpen={visible && keywordsOpen}
        onOpenChange={setKeywordsOpen}
        includers={keywordIncluders}
        excluders={keywordExcluders}
        onIncludersChange={setKeywordIncluders}
        onExcludersChange={setKeywordExcluders}
      />

      <SearchBottomSheetPlatformsSheet
        isOpen={visible && platformsOpen}
        onOpenChange={setPlatformsOpen}
        platforms={selectedPlatforms}
        onPlatformsChange={setSelectedPlatforms}
      />
    </>
  );
}
