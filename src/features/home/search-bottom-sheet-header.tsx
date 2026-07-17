import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { Pressable, View } from "react-native";
import { Typography, useThemeColor } from "heroui-native";

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
  const [foreground] = useThemeColor(["foreground"]);

  return (
    <View className="flex-row items-center px-8 pt-3 pb-2">
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-full border border-foreground"
          style={{ opacity: 0.4 }}
        >
          <Ionicons name="close" size={18} color={foreground} />
        </View>
      </Pressable>
      <View className="flex-1 items-center px-2">
        <Typography type="body" weight="normal">
          {title}
        </Typography>
      </View>
      <Pressable
        onPress={onConfirm}
        accessibilityRole="button"
        accessibilityLabel={confirmLabel}
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-full border border-foreground"
          style={{ opacity: 0.4 }}
        >
          <Ionicons name="checkmark" size={18} color={foreground} />
        </View>
      </Pressable>
    </View>
  );
}
