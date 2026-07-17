import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Input,
  Typography,
  useBottomSheetAwareHandlers,
  useThemeColor,
} from "heroui-native";

import { SearchBottomSheetCriteria } from "@/features/home/search-bottom-sheet-criteria";
import { SearchBottomSheetHeader } from "@/features/home/search-bottom-sheet-header";
import { SearchBottomSheetPriceSheet } from "@/features/home/search-bottom-sheet-price-sheet";
import { SearchBottomSheetRow } from "@/features/home/search-bottom-sheet-row";
import { SearchBottomSheetSection } from "@/features/home/search-bottom-sheet-section";

function KeyboardTestInput(): JSX.Element {
  const [value, setValue] = useState("");
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <Input
      value={value}
      onChangeText={setValue}
      placeholder="Keyboard test"
      variant="secondary"
      className="w-full"
      onFocus={onFocus}
      onBlur={onBlur}
    />
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
  const [muted] = useThemeColor(["muted"]);
  const [priceOpen, setPriceOpen] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  return (
    <>
      <BottomSheet
        isOpen={visible}
        onOpenChange={(open) => {
          if (!open) {
            setPriceOpen(false);
            onClose();
          }
        }}
      >
        <BottomSheet.Portal disableFullWindowOverlay>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            snapPoints={["90%"]}
            enableDynamicSizing={false}
            enableOverDrag={false}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
            contentContainerClassName="h-full p-0"
            backgroundClassName="bg-surface-secondary"
            backgroundStyle={{
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderCurve: "continuous",
            }}
            handleComponent={null}
          >
            <View className="flex-1">
              <SearchBottomSheetHeader onClose={onClose} onConfirm={onClose} />

              <SearchBottomSheetSection>
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
                price={{
                  min: minPrice,
                  max: maxPrice,
                  onOpenChange: setPriceOpen,
                  onMinChange: setMinPrice,
                  onMaxChange: setMaxPrice,
                }}
              />

              <View className="mt-auto px-5 pb-8">
                <KeyboardTestInput />
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

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
