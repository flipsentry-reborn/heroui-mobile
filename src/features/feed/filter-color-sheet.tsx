import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { BottomSheet, useBottomSheet } from "heroui-native";

import { SearchBottomSheetHeader } from "@/features/home/search-bottom-sheet-header";
import { SearchSheetGroup } from "@/features/home/search-sheet-group";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import { FILTER_COLOR_PRESETS, isValidFilterHex } from "@/models/user-filter";

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
  const snapPoints = useMemo(() => ["45%", "65%"], []);
  const selected = color.trim().toUpperCase();
  const canSave = isValidFilterHex(selected) && !usedColors.has(selected);
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
        <SearchBottomSheetHeader
          title="Color"
          onCancel={dismiss}
          onSave={handleSave}
          saveDisabled={!canSave}
        />

        <SearchSheetGroup title="Choose a color">
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
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    isSelected ? "border-[3px] border-foreground" : "border border-transparent"
                  } ${isUsed ? "opacity-40" : "opacity-100"}`}
                  style={{ backgroundColor: preset }}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: isSelected,
                    disabled,
                  }}
                  accessibilityLabel={isUsed ? `Color ${preset} already used` : `Color ${preset}`}
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

function ColorSheetDraft({
  initialColor,
  usedColors,
  onColorChange,
}: {
  initialColor: string;
  usedColors: ReadonlySet<string>;
  onColorChange: (color: string) => void;
}): JSX.Element {
  const [draftColor, setDraftColor] = useState(initialColor);

  return (
    <ColorSheetContent
      color={draftColor}
      usedColors={usedColors}
      onColorChange={setDraftColor}
      onPersist={onColorChange}
    />
  );
}

export function FilterColorSheet({
  isOpen,
  onOpenChange,
  color,
  usedColors,
  onColorChange,
}: FilterColorSheetProps): JSX.Element | null {
  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <ColorSheetDraft
        key={isOpen ? color : "closed"}
        initialColor={color}
        usedColors={usedColors}
        onColorChange={onColorChange}
      />
    </SheetShell>
  );
}
