import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { View } from "react-native";
import { PressableFeedback, Typography, useThemeColor } from "heroui-native";

interface FeedDetailActionsProps {
  isFavorite: boolean;
  onSave: () => void;
  onDelete: () => void;
  onShare: () => void;
}

/** Frameless Saved / Delete / Share - equal-width full row. */
export function FeedDetailActions({
  isFavorite,
  onSave,
  onDelete,
  onShare,
}: FeedDetailActionsProps): JSX.Element {
  const foreground = useThemeColor("foreground");

  return (
    <View className="w-full flex-row items-center py-2">
      <PressableFeedback
        onPress={onSave}
        accessibilityLabel={isFavorite ? "Saved" : "Save"}
        animation={{ scale: { value: 0.96 } }}
        className="min-w-0 flex-1 flex-row items-center justify-center gap-2 py-2"
      >
        <Ionicons
          name={isFavorite ? "bookmark" : "bookmark-outline"}
          size={18}
          color={foreground}
        />
        <Typography type="body-sm" weight="medium" className="text-[13px] text-foreground">
          Saved
        </Typography>
      </PressableFeedback>

      <PressableFeedback
        onPress={onDelete}
        accessibilityLabel="Delete"
        animation={{ scale: { value: 0.96 } }}
        className="min-w-0 flex-1 flex-row items-center justify-center gap-2 py-2"
      >
        <Ionicons name="trash-outline" size={18} color={foreground} />
        <Typography type="body-sm" weight="medium" className="text-[13px] text-foreground">
          Delete
        </Typography>
      </PressableFeedback>

      <PressableFeedback
        onPress={onShare}
        accessibilityLabel="Share"
        animation={{ scale: { value: 0.96 } }}
        className="min-w-0 flex-1 flex-row items-center justify-center gap-2 py-2"
      >
        <Ionicons name="arrow-redo-outline" size={18} color={foreground} />
        <Typography type="body-sm" weight="medium" className="text-[13px] text-foreground">
          Share
        </Typography>
      </PressableFeedback>
    </View>
  );
}
