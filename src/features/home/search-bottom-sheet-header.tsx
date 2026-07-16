import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { View } from "react-native";
import { PressableFeedback, Typography, useThemeColor } from "heroui-native";

interface SearchBottomSheetHeaderProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function SearchBottomSheetHeader({
  onClose,
  onConfirm,
}: SearchBottomSheetHeaderProps): JSX.Element {
  const [foreground] = useThemeColor(["foreground"]);

  return (
    <View className="flex-row items-center px-8 pt-3 pb-1">
      <PressableFeedback
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-full border border-foreground"
          style={{ opacity: 0.4 }}
        >
          <Ionicons name="close" size={18} color={foreground} />
        </View>
      </PressableFeedback>
      <View className="flex-1 items-center px-2">
        <Typography type="body" weight="normal">
          New Search
        </Typography>
      </View>
      <PressableFeedback
        onPress={onConfirm}
        accessibilityRole="button"
        accessibilityLabel="Confirm"
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-full border border-foreground"
          style={{ opacity: 0.4 }}
        >
          <Ionicons name="checkmark" size={18} color={foreground} />
        </View>
      </PressableFeedback>
    </View>
  );
}
