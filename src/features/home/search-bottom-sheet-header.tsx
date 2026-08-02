import type { JSX, ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Typography } from "heroui-native";

interface SearchBottomSheetHeaderProps {
  title?: string;
  onCancel?: () => void;
  onSave?: () => void;
  cancelDisabled?: boolean;
  saveDisabled?: boolean;
  cancelLabel?: string;
  saveLabel?: string;
  /** Optional content beside the title (e.g. count badge). */
  titleAccessory?: ReactNode;
}

/**
 * Sheet chrome: Cancel (left, danger) · Title (center) · Save (right, sky).
 */
export function SearchBottomSheetHeader({
  title = "New Search",
  onCancel,
  onSave,
  cancelDisabled = false,
  saveDisabled = false,
  cancelLabel = "Cancel",
  saveLabel = "Save",
  titleAccessory,
}: SearchBottomSheetHeaderProps): JSX.Element {
  const hasActions = onCancel != null || onSave != null;

  if (!hasActions) {
    return (
      <View className="items-center px-5 pb-1 pt-4">
        <View className="flex-row items-center justify-center gap-2">
          <Typography type="body" weight="semibold" className="text-foreground">
            {title}
          </Typography>
          {titleAccessory}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row items-center px-5 pb-1 pt-4">
      <View className="min-w-[76px] items-start justify-center pl-1">
        {onCancel != null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
            disabled={cancelDisabled}
            onPress={onCancel}
            hitSlop={8}
            className={`py-1 ${cancelDisabled ? "opacity-40" : "opacity-100"}`}
          >
            <Typography
              type="body"
              weight="semibold"
              className={cancelDisabled ? "text-danger/50" : "text-danger"}
            >
              {cancelLabel}
            </Typography>
          </Pressable>
        ) : (
          <View className="h-5 w-14" />
        )}
      </View>

      <View className="min-w-0 flex-1 flex-row items-center justify-center gap-2 px-2">
        <Typography
          type="body"
          weight="semibold"
          numberOfLines={1}
          className="text-foreground"
        >
          {title}
        </Typography>
        {titleAccessory}
      </View>

      <View className="min-w-[76px] items-end justify-center pr-1">
        {onSave != null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saveLabel}
            disabled={saveDisabled}
            onPress={onSave}
            hitSlop={8}
            className={`py-1 ${saveDisabled ? "opacity-35" : "opacity-100"}`}
          >
            <Typography
              type="body"
              weight="semibold"
              className={saveDisabled ? "text-muted" : "text-sky-500"}
            >
              {saveLabel}
            </Typography>
          </Pressable>
        ) : (
          <View className="h-5 w-14" />
        )}
      </View>
    </View>
  );
}
