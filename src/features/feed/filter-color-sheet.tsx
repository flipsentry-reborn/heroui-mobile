import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import {
  BottomSheet,
  Button,
  Typography,
  useBottomSheet,
  useThemeColor,
} from "heroui-native";

import { SearchSheetGroup } from "@/features/home/search-sheet-group";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import {
  FILTER_COLOR_PRESETS,
  isValidFilterHex,
} from "@/models/user-filter";

function ColorSheetContent({
  color,
  usedColors,
  onColorChange,
  onPersist,
}: {
  color: string;
  usedColors: ReadonlySet<string>;
  onColorChange: (value: string) => void;
  onPersist: (color: string) => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const [border] = useThemeColor(["border"]);
  const snapPoints = useMemo(() => ["45%", "65%"], []);
  const selected = color.trim().toUpperCase();
  const canSave =
    isValidFilterHex(selected) && !usedColors.has(selected);
  const dismiss = () => onOpenChange(false);

  const handleSave = () => {
    if (!canSave) return;
    onPersist(selected);
    dismiss();
  };

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enableOverDrag={false}
      className={SHEET_CONTENT_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
      handleComponent={null}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME}
    >
      <View>
        <View className="items-center px-5 pb-1 pt-4">
          <Typography type="body" weight="normal">
            Color
          </Typography>
        </View>

        <SearchSheetGroup>
          <View className="flex-row flex-wrap gap-3 px-4 py-4">
            {FILTER_COLOR_PRESETS.map((preset) => {
              const isSelected = selected === preset;
              const isUsed = usedColors.has(preset);
              const disabled = isUsed;

              return (
                <Pressable
                  key={preset}
                  disabled={disabled}
                  onPress={() => onColorChange(preset)}
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: preset,
                    opacity: isUsed ? 0.4 : 1,
                    borderWidth: isSelected ? 3 : 1,
                    borderColor: isSelected ? border : "transparent",
                  }}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: isSelected,
                    disabled,
                  }}
                  accessibilityLabel={
                    isUsed
                      ? `Color ${preset} already used`
                      : `Color ${preset}`
                  }
                >
                  {isUsed ? (
                    <View className="absolute inset-0 items-center justify-center rounded-full bg-black/35">
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </SearchSheetGroup>

        <View className="flex-row gap-3 px-5 pb-6 pt-2">
          <Button
            variant="tertiary"
            className="min-h-12 flex-1 rounded-2xl bg-surface"
            onPress={dismiss}
          >
            <Button.Label>Cancel</Button.Label>
          </Button>
          <Button
            variant="primary"
            className="min-h-12 flex-1 rounded-2xl"
            isDisabled={!canSave}
            onPress={handleSave}
          >
            <Button.Label>Save</Button.Label>
          </Button>
        </View>
      </View>
    </BottomSheet.Content>
  );
}

interface FilterColorSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  color: string;
  usedColors: ReadonlySet<string>;
  onColorChange: (color: string) => void;
}

export function FilterColorSheet({
  isOpen,
  onOpenChange,
  color,
  usedColors,
  onColorChange,
}: FilterColorSheetProps): JSX.Element | null {
  const [draftColor, setDraftColor] = useState(color);

  useEffect(() => {
    if (!isOpen) return;
    setDraftColor(color);
  }, [color, isOpen]);

  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <ColorSheetContent
        color={draftColor}
        usedColors={usedColors}
        onColorChange={setDraftColor}
        onPersist={onColorChange}
      />
    </SheetShell>
  );
}
