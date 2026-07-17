import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { View } from "react-native";
import { PressableFeedback, Typography } from "heroui-native";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

interface SearchBottomSheetHeaderProps {
  title?: string;
  onClose: () => void;
  onConfirm: () => void;
  closeLabel?: string;
  confirmLabel?: string;
}

export function SearchBottomSheetHeader({
  title = "New Search",
  onClose,
  onConfirm,
  closeLabel = "Cancel",
  confirmLabel = "Save",
}: SearchBottomSheetHeaderProps): JSX.Element {
  return (
    <View className="flex-row items-center px-8 pt-3 pb-2">
      <PressableFeedback
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        className="h-9 w-9 items-center justify-center rounded-full bg-danger/15"
        animation={{ scale: { value: 0.92 } }}
      >
        <StyledIonicons name="close" size={20} className="text-danger" />
      </PressableFeedback>
      <View className="flex-1 items-center px-2">
        <Typography type="body" weight="normal">
          {title}
        </Typography>
      </View>
      <PressableFeedback
        onPress={onConfirm}
        accessibilityRole="button"
        accessibilityLabel={confirmLabel}
        className="h-9 w-9 items-center justify-center rounded-full bg-sky-500/15"
        animation={{ scale: { value: 0.92 } }}
      >
        <StyledIonicons name="checkmark" size={20} className="text-sky-500" />
      </PressableFeedback>
    </View>
  );
}
