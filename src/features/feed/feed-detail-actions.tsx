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

/** Frameless Saved / Share / Delete - icon + label only. */
export function FeedDetailActions({
  isFavorite,
  onSave,
  onDelete,
  onShare,
}: FeedDetailActionsProps): JSX.Element {
  const foreground = useThemeColor("foreground");

  return (
    <View className="flex-row items-center justify-center gap-7 py-2">
      <PressableFeedback
        onPress={onSave}
        accessibilityLabel={isFavorite ? "Saved" : "Save"}
        animation={{ scale: { value: 0.96 } }}
        className="flex-row items-center gap-2 px-1 py-1.5"
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
        onPress={onShare}
        accessibilityLabel="Share"
        animation={{ scale: { value: 0.96 } }}
        className="flex-row items-center gap-2 px-1 py-1.5"
      >
        <Ionicons name="share-outline" size={18} color={foreground} />
        <Typography type="body-sm" weight="medium" className="text-[13px] text-foreground">
          Share
        </Typography>
      </PressableFeedback>

      <PressableFeedback
        onPress={onDelete}
        accessibilityLabel="Delete"
        animation={{ scale: { value: 0.96 } }}
        className="flex-row items-center gap-2 px-1 py-1.5"
      >
        <Ionicons name="trash-outline" size={18} color={foreground} />
        <Typography type="body-sm" weight="medium" className="text-[13px] text-foreground">
          Delete
        </Typography>
      </PressableFeedback>
    </View>
  );
}
