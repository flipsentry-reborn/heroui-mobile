import { Ionicons } from "@expo/vector-icons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import {
  Accordion,
  BottomSheet,
  Button,
  PressableFeedback,
  Typography,
  useBottomSheet,
  useThemeColor,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { SheetShell } from "@/features/home/sheet-shell";
import {
  MOCK_IPHONE_SERIES,
  type IphoneModelOption,
} from "@/mocks/data/iphone";

const StyledBottomSheetScrollView = withUniwind(BottomSheetScrollView);
const StyledIonicons = withUniwind(Ionicons);

export function formatIphoneModelsLabel(selectedIds: string[]): string {
  if (selectedIds.length === 0) return "None";
  return String(selectedIds.length);
}

function ModelRow({
  model,
  selected,
  onToggle,
}: {
  model: IphoneModelOption;
  selected: boolean;
  onToggle: () => void;
}): JSX.Element {
  const [accent, muted] = useThemeColor(["accent", "muted"]);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={model.label}
      onPress={onToggle}
      className="flex-row items-center gap-3 py-2.5"
    >
      <Ionicons
        name={selected ? "checkbox" : "square-outline"}
        size={20}
        color={selected ? accent : muted}
      />
      <Typography type="body-sm" className="text-foreground">
        {model.label}
      </Typography>
    </Pressable>
  );
}

function IphoneModelsSheetContent({
  selectedIds,
  onSelectedIdsChange,
  onPersist,
}: {
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onPersist: (ids: string[]) => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const snapPoints = useMemo(() => ["90%"], []);
  const dismiss = () => onOpenChange(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleModel = (id: string) => {
    if (selectedSet.has(id)) {
      onSelectedIdsChange(selectedIds.filter((item) => item !== id));
      return;
    }
    onSelectedIdsChange([...selectedIds, id]);
  };

  const handleSave = () => {
    onPersist(selectedIds);
    dismiss();
  };

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      enableOverDrag={false}
      enableDynamicSizing={false}
      backgroundClassName="rounded-t-[32px] bg-surface-secondary"
      handleComponent={null}
      contentContainerClassName="h-full bg-surface-secondary p-0"
    >
      <View className="flex-1">
        <View className="items-center px-5 pb-1 pt-4">
          <Typography type="body" weight="normal">
            Models
          </Typography>
        </View>

        <StyledBottomSheetScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerClassName="gap-3 px-3 pb-4 pt-3"
        >
          {/*
            HeroUI Accordion only exposes variant "default" | "surface".
            Depth press uses docs pattern: Trigger asChild + PressableFeedback.Highlight.
            All series start collapsed (no defaultValue).
          */}
          <Accordion
            selectionMode="single"
            variant="surface"
            isCollapsible
            hideSeparator
            className="rounded-3xl"
          >
            {MOCK_IPHONE_SERIES.map((series) => (
              <Accordion.Item key={series.id} value={series.id}>
                <Accordion.Trigger asChild>
                  <PressableFeedback animation={{ scale: false }}>
                    <PressableFeedback.Scale className="min-h-12 flex-1 flex-row items-center gap-3 px-4 py-3">
                      <StyledIonicons
                        name="phone-portrait-outline"
                        size={16}
                        className="text-muted"
                      />
                      <Typography
                        type="body-sm"
                        weight="semibold"
                        className="flex-1 text-foreground"
                      >
                        {series.title}
                      </Typography>
                      <Typography type="body-xs" className="text-muted">
                        {
                          series.models.filter((m) => selectedSet.has(m.id))
                            .length
                        }
                        /{series.models.length}
                      </Typography>
                    </PressableFeedback.Scale>
                    <Accordion.Indicator className="pr-4" />
                    <PressableFeedback.Highlight
                      animation={{ opacity: { value: [0, 0.05] } }}
                    />
                  </PressableFeedback>
                </Accordion.Trigger>
                <Accordion.Content className="px-4 pb-3 pt-0">
                  <View className="gap-0.5 pl-1">
                    {series.models.map((model) => (
                      <ModelRow
                        key={model.id}
                        model={model}
                        selected={selectedSet.has(model.id)}
                        onToggle={() => toggleModel(model.id)}
                      />
                    ))}
                  </View>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion>
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

interface SearchBottomSheetIphoneModelsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
}

export function SearchBottomSheetIphoneModelsSheet({
  isOpen,
  onOpenChange,
  selectedIds,
  onSelectedIdsChange,
}: SearchBottomSheetIphoneModelsSheetProps): JSX.Element | null {
  const [draftIds, setDraftIds] = useState(selectedIds);

  useEffect(() => {
    if (!isOpen) return;
    setDraftIds(selectedIds);
  }, [isOpen, selectedIds]);

  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <IphoneModelsSheetContent
        selectedIds={draftIds}
        onSelectedIdsChange={setDraftIds}
        onPersist={onSelectedIdsChange}
      />
    </SheetShell>
  );
}
