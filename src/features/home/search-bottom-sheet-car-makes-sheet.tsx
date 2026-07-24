import { Ionicons } from "@expo/vector-icons";
import { BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
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

import agent from "@/api/agent";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import type { CarMake } from "@/models/car-make";

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
  if (selection.anyMake || selection.selectedIds.length === 0) return "All makes";
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
  const [makes, setMakes] = useState<CarMake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const snapPoints = useMemo(() => ["90%"], []);
  const dismiss = () => onOpenChange(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await agent.CarMakes.list();
        if (cancelled) return;
        setMakes(data);
      } catch {
        if (cancelled) return;
        setError("Failed to load car makes.");
        setMakes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const makeNames = useMemo(() => makes.map((make) => make.make), [makes]);

  const selectedSet = useMemo(
    () => new Set(selection.selectedIds),
    [selection.selectedIds],
  );

  const filteredMakes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return makes;
    return makes.filter((make) => make.make.toLowerCase().includes(q));
  }, [makes, query]);

  const selectAny = () => {
    onSelectionChange({ anyMake: true, selectedIds: [] });
  };

  const clearAll = () => {
    onSelectionChange({ anyMake: false, selectedIds: [] });
  };

  /** List row: tap All makes on → anyMake; tap again → clear everything. */
  const toggleAllMakesRow = () => {
    if (makeNames.length === 0) return;
    if (selection.anyMake) {
      clearAll();
      return;
    }
    selectAny();
  };

  /** Header: Select all → All makes; Clear → nothing selected. */
  const handleHeaderSelectAll = () => {
    if (makeNames.length === 0) return;
    if (selection.anyMake || selection.selectedIds.length > 0) {
      clearAll();
      return;
    }
    selectAny();
  };

  const toggleMake = (makeName: string) => {
    if (selection.anyMake) return;

    if (selectedSet.has(makeName)) {
      const nextIds = selection.selectedIds.filter((item) => item !== makeName);
      onSelectionChange({ anyMake: false, selectedIds: nextIds });
      return;
    }
    onSelectionChange({
      anyMake: false,
      selectedIds: [...selection.selectedIds, makeName],
    });
  };

  const handleSave = () => {
    if (selection.anyMake) {
      onPersist({ anyMake: true, selectedIds: [] });
    } else if (selection.selectedIds.length === 0) {
      return;
    } else {
      onPersist({ anyMake: false, selectedIds: selection.selectedIds });
    }
    dismiss();
  };

  const individualsLocked = selection.anyMake;
  const canSave =
    !loading &&
    error == null &&
    (selection.anyMake || selection.selectedIds.length > 0);

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      enableOverDrag={false}
      enableDynamicSizing={false}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      className={SHEET_CONTENT_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
      handleComponent={null}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME}
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
              selection.anyMake || selection.selectedIds.length > 0
                ? "Clear all makes"
                : "Select all makes"
            }
            disabled={loading || makeNames.length === 0}
            onPress={handleHeaderSelectAll}
            className="min-w-16 items-end py-1"
            hitSlop={8}
          >
            <Typography
              type="body-sm"
              className={
                loading || makeNames.length === 0
                  ? "text-muted"
                  : "text-sky-400"
              }
            >
              {selection.anyMake || selection.selectedIds.length > 0
                ? "Clear"
                : "Select all"}
            </Typography>
          </Pressable>
        </View>

        <StyledBottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerClassName="gap-3 px-3 pb-4 pt-3"
        >
          {loading ? (
            <View className="items-center gap-3 py-16">
              <ActivityIndicator />
              <Typography type="body-sm" className="text-muted">
                Loading car makes…
              </Typography>
            </View>
          ) : error != null ? (
            <Typography type="body-sm" className="px-2 py-8 text-center text-danger">
              {error}
            </Typography>
          ) : (
            <ListGroup className="overflow-hidden rounded-3xl p-0">
              <View className="px-4 pb-2 pt-3">
                <BottomSheetTextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search makes"
                  placeholderTextColor={muted}
                  autoCorrect={false}
                  autoCapitalize="none"
                  editable={!individualsLocked}
                  style={{
                    height: 40,
                    color: foreground,
                    fontSize: 15,
                    opacity: individualsLocked ? 0.4 : 1,
                  }}
                />
              </View>
              <Separator className="mx-4 bg-muted/40" />

              <MakeRow
                label="All makes"
                selected={selection.anyMake}
                onToggle={toggleAllMakesRow}
              />
              <Separator className="mx-4 bg-muted/40" />

              {filteredMakes.map((make, index) => (
                <View key={make.make}>
                  <MakeRow
                    label={make.make}
                    selected={
                      selection.anyMake || selectedSet.has(make.make)
                    }
                    disabled={individualsLocked}
                    onToggle={() => toggleMake(make.make)}
                  />
                  {index < filteredMakes.length - 1 ? (
                    <Separator className="mx-4 bg-muted/40" />
                  ) : null}
                </View>
              ))}
            </ListGroup>
          )}

          {!loading && error == null && filteredMakes.length === 0 ? (
            <Typography type="body-xs" className="px-1 text-muted">
              No makes match “{query.trim()}”.
            </Typography>
          ) : null}

          {!loading &&
          error == null &&
          !selection.anyMake &&
          selection.selectedIds.length === 0 ? (
            <Typography type="body-xs" className="px-1 text-muted">
              Select at least one make, or choose All makes.
            </Typography>
          ) : null}
        </StyledBottomSheetScrollView>

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
