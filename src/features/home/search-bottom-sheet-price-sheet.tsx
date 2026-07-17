import type { JSX } from "react";
import { StyleSheet, View } from "react-native";
import {
  BottomSheet,
  Input,
  Typography,
  useBottomSheetAwareHandlers,
} from "heroui-native";

const SHEET_BACKGROUND_STYLE = {
  borderTopLeftRadius: 32,
  borderTopRightRadius: 32,
  borderCurve: "continuous" as const,
};

export function sanitizePriceInput(text: string): string {
  return text.replace(/[^0-9]/g, "");
}

export function formatPriceRangeLabel(min: string, max: string): string {
  return `${min === "" ? "Any" : min} - ${max === "" ? "Any" : max}`;
}

function PriceRangeInputs({
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <View style={styles.row}>
      <Input
        value={min}
        onChangeText={(text) => onMinChange(sanitizePriceInput(text))}
        placeholder="Any"
        keyboardType="number-pad"
        variant="secondary"
        style={styles.input}
        className="text-center"
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <Typography type="body" className="text-muted" style={styles.dash}>
        -
      </Typography>
      <Input
        value={max}
        onChangeText={(text) => onMaxChange(sanitizePriceInput(text))}
        placeholder="Any"
        keyboardType="number-pad"
        variant="secondary"
        style={styles.input}
        className="text-center"
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
  },
  dash: {
    flexShrink: 0,
  },
});

interface SearchBottomSheetPriceSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

export function SearchBottomSheetPriceSheet({
  isOpen,
  onOpenChange,
  min,
  max,
  onMinChange,
  onMaxChange,
}: SearchBottomSheetPriceSheetProps): JSX.Element {
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal disableFullWindowOverlay>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          keyboardBehavior="extend"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          backgroundClassName="bg-surface-secondary"
          backgroundStyle={SHEET_BACKGROUND_STYLE}
          handleIndicatorClassName="bg-separator"
        >
          <View className="gap-4 px-5 pb-8 pt-1">
            <BottomSheet.Title>Price</BottomSheet.Title>
            <PriceRangeInputs
              min={min}
              max={max}
              onMinChange={onMinChange}
              onMaxChange={onMaxChange}
            />
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
