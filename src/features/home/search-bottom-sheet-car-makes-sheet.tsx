import { Ionicons } from "@expo/vector-icons";
import { BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import {
  BottomSheet,
  Button,
  ListGroup,
  Separator,
  Typography,
  useBottomSheet,
  useThemeColor,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { SheetShell } from "@/features/home/sheet-shell";
import { MOCK_CAR_MAKES } from "@/mocks/data/car";

const StyledBottomSheetScrollView = withUniwind(BottomSheetScrollView);

export interface CarMakesSelection {
  /** True when every make is in scope (no specific filter). */
  anyMake: boolean;
  selectedIds: string[];
}

export const DEFAULT_CAR_MAKES: CarMakesSelection = {
  anyMake: true,
  selectedIds: [],
};

export function formatCarMakesLabel(selection: CarMakesSelection): string {
  if (selection.anyMake || selection.selectedIds.length === 0) return "Any";
  return String(selection.selectedIds.length);
}

function MakeRow({
  label,
  selected,
  disabled,
  onToggle,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}): JSX.Element {
  const [accent, muted] = useThemeColor(["accent", "muted"]);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onToggle}
      className={`flex-row items-center gap-3 px-4 py-3 ${disabled ? "opacity-40" : ""}`}
    >
      <Ionicons
        name={selected ? "checkbox" : "square-outline"}
        size={20}
        color={selected ? accent : muted}
      />
      <Typography type="body-sm" className="flex-1 text-foreground">
        {label}
      </Typography>
    </Pressable>
  );
}

function CarMakesSheetContent({
  selection,
  onSelectionChange,
  onPersist,
}: {
  selection: CarMakesSelection;
  onSelectionChange: (next: CarMakesSelection) => void;
  onPersist: (next: CarMakesSelection) => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const [muted, foreground] = useThemeColor(["muted", "foreground"]);
  const [query, setQuery] = useState("");
  const snapPoints = useMemo(() => ["90%"], []);
  const dismiss = () => onOpenChange(false);

  const selectedSet = useMemo(
    () => new Set(selection.selectedIds),
    [selection.selectedIds],
  );
  const filteredMakes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return MOCK_CAR_MAKES;
    return MOCK_CAR_MAKES.filter((make) =>
      make.label.toLowerCase().includes(q),
    );
  }, [query]);

  const allSpecificSelected =
    !selection.anyMake &&
    selection.selectedIds.length === MOCK_CAR_MAKES.length;

  const selectAny = () => {
    onSelectionChange({ anyMake: true, selectedIds: [] });
  };

  const toggleMake = (id: string) => {
    if (selection.anyMake) {
      onSelectionChange({ anyMake: false, selectedIds: [id] });
      return;
    }
    if (selectedSet.has(id)) {
      const nextIds = selection.selectedIds.filter((item) => item !== id);
      if (nextIds.length === 0) {
        onSelectionChange({ anyMake: true, selectedIds: [] });
        return;
      }
      onSelectionChange({ anyMake: false, selectedIds: nextIds });
      return;
    }
    onSelectionChange({
      anyMake: false,
      selectedIds: [...selection.selectedIds, id],
    });
  };

  const handleSelectAll = () => {
    if (allSpecificSelected) {
      selectAny();
      return;
    }
    onSelectionChange({
      anyMake: false,
      selectedIds: MOCK_CAR_MAKES.map((make) => make.id),
    });
  };

  const handleSave = () => {
    if (selection.anyMake || selection.selectedIds.length === 0) {
      onPersist({ anyMake: true, selectedIds: [] });
    } else {
      onPersist({ anyMake: false, selectedIds: selection.selectedIds });
    }
    dismiss();
  };

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      enableOverDrag={false}
      enableDynamicSizing={false}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundClassName="rounded-t-[32px] bg-surface-secondary"
      handleComponent={null}
      contentContainerClassName="h-full bg-surface-secondary p-0"
    >
      <View className="flex-1">
        <View className="flex-row items-center justify-between px-5 pb-1 pt-4">
          <View className="w-16" />
          <Typography type="body" weight="normal">
            Makes
          </Typography>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              allSpecificSelected ? "Clear make selection" : "Select all makes"
            }
            onPress={handleSelectAll}
            className="min-w-16 items-end py-1"
            hitSlop={8}
          >
            <Typography type="body-sm" className="text-sky-400">
              {allSpecificSelected ? "Clear" : "Select all"}
            </Typography>
          </Pressable>
        </View>

        <StyledBottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerClassName="gap-3 px-3 pb-4 pt-3"
        >
          <ListGroup className="overflow-hidden rounded-3xl p-0">
            <View className="px-4 pb-2 pt-3">
              <BottomSheetTextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search makes"
                placeholderTextColor={muted}
                autoCorrect={false}
                autoCapitalize="none"
                style={{
                  height: 40,
                  color: foreground,
                  fontSize: 15,
                }}
              />
            </View>
            <Separator className="mx-4 bg-muted/40" />

            <MakeRow
              label="Any"
              selected={selection.anyMake || selection.selectedIds.length === 0}
              onToggle={selectAny}
            />
            <Separator className="mx-4 bg-muted/40" />

            {filteredMakes.map((make, index) => (
              <View key={make.id}>
                <MakeRow
                  label={make.label}
                  selected={!selection.anyMake && selectedSet.has(make.id)}
                  onToggle={() => toggleMake(make.id)}
                />
                {index < filteredMakes.length - 1 ? (
                  <Separator className="mx-4 bg-muted/40" />
                ) : null}
              </View>
            ))}
          </ListGroup>

          {filteredMakes.length === 0 ? (
            <Typography type="body-xs" className="px-1 text-muted">
              No makes match “{query.trim()}”.
            </Typography>
          ) : null}
        </StyledBottomSheetScrollView>

        <View className="flex-row gap-3 px-5 pb-6 pt-2">
          <Button
            variant="secondary"
            className="min-h-12 flex-1"
            onPress={dismiss}
          >
            <Button.Label>Cancel</Button.Label>
          </Button>
          <Button
            variant="primary"
            className="min-h-12 flex-1"
            onPress={handleSave}
          >
            <Button.Label>Save</Button.Label>
          </Button>
        </View>
      </View>
    </BottomSheet.Content>
  );
}

interface SearchBottomSheetCarMakesSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selection: CarMakesSelection;
  onSelectionChange: (selection: CarMakesSelection) => void;
}

export function SearchBottomSheetCarMakesSheet({
  isOpen,
  onOpenChange,
  selection,
  onSelectionChange,
}: SearchBottomSheetCarMakesSheetProps): JSX.Element | null {
  const [draft, setDraft] = useState(selection);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(selection);
    setSessionKey((key) => key + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open-only snapshot
  }, [isOpen]);

  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <CarMakesSheetContent
        key={sessionKey}
        selection={draft}
        onSelectionChange={setDraft}
        onPersist={onSelectionChange}
      />
    </SheetShell>
  );
}
