import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Button,
  Chip,
  Description,
  Input,
  Label,
  Typography,
  useBottomSheet,
  useBottomSheetAwareHandlers,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { SheetShell } from "@/features/home/sheet-shell";

const StyledIonicons = withUniwind(Ionicons);

export function formatKeywordsLabel(
  includers: string[],
  excluders: string[],
): string {
  const total = includers.length + excluders.length;
  if (total === 0) return "None";
  return String(total);
}

function addKeyword(list: string[], value: string): string[] {
  const trimmed = value.trim();
  if (trimmed === "" || list.includes(trimmed)) return list;
  return [...list, trimmed];
}

function addKeywordSegments(list: string[], text: string): string[] {
  return text
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .reduce((next, segment) => addKeyword(next, segment), list);
}

function removeKeyword(list: string[], value: string): string[] {
  return list.filter((item) => item !== value);
}

function KeywordFieldInput({
  value,
  onChangeText,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder: string;
}): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <Input
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      variant="primary"
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="done"
      onSubmitEditing={onSubmit}
      className="h-8 min-h-8 flex-1 px-2 py-0 text-sm text-foreground"
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

function KeywordSection({
  title,
  placeholder,
  help,
  values,
  draft,
  onDraftChange,
  onAdd,
  onRemove,
}: {
  title: string;
  placeholder: string;
  help: string;
  values: string[];
  draft: string;
  onDraftChange: (value: string) => void;
  onAdd: (text: string) => void;
  onRemove: (value: string) => void;
}): JSX.Element {
  const handleChangeText = (text: string) => {
    if (text.includes(",")) {
      onAdd(text);
      return;
    }
    onDraftChange(text);
  };

  const handleAddPress = () => {
    onAdd(draft);
  };

  return (
    <View className="gap-2.5">
      <Label>{title}</Label>
      <View className="flex-row items-center gap-2">
        <KeywordFieldInput
          value={draft}
          onChangeText={handleChangeText}
          onSubmit={handleAddPress}
          placeholder={placeholder}
        />
        <Button size="sm" variant="primary" onPress={handleAddPress}>
          <Button.Label>Add</Button.Label>
        </Button>
      </View>
      {values.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {values.map((keyword) => (
            <Chip
              key={keyword}
              size="sm"
              variant="secondary"
              color="default"
              onPress={() => onRemove(keyword)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${keyword}`}
            >
              <Chip.Label>{keyword}</Chip.Label>
              <StyledIonicons name="close" size={14} className="text-muted" />
            </Chip>
          ))}
        </View>
      ) : null}
      <Description className="italic">{help}</Description>
    </View>
  );
}

function KeywordsSheetContent({
  includers,
  excluders,
  onIncludersChange,
  onExcludersChange,
  onPersist,
}: {
  includers: string[];
  excluders: string[];
  onIncludersChange: (values: string[]) => void;
  onExcludersChange: (values: string[]) => void;
  onPersist: (includers: string[], excluders: string[]) => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const snapPoints = useMemo(() => ["92%"], []);
  const [includerDraft, setIncluderDraft] = useState("");
  const [excluderDraft, setExcluderDraft] = useState("");
  const dismiss = () => onOpenChange(false);

  const handleSave = () => {
    const nextIncluders = addKeywordSegments(includers, includerDraft);
    const nextExcluders = addKeywordSegments(excluders, excluderDraft);
    setIncluderDraft("");
    setExcluderDraft("");
    onPersist(nextIncluders, nextExcluders);
    dismiss();
  };

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      keyboardBehavior="extend"
      android_keyboardInputMode="adjustResize"
      backgroundClassName="rounded-t-[32px] bg-surface-secondary"
      handleComponent={null}
      contentContainerClassName="bg-surface-secondary p-0"
    >
      <View>
        <View className="items-center px-5 pt-4 pb-1">
          <Typography type="body" weight="normal">
            Keywords
          </Typography>
        </View>

        <View className="gap-6 px-5 pb-2 pt-3">
          <KeywordSection
            title="Text Includer (Optional)"
            placeholder="Enter keywords to include"
            help="Only shows listings with at least one of these words (separate multiple with commas)"
            values={includers}
            draft={includerDraft}
            onDraftChange={setIncluderDraft}
            onAdd={(text) => {
              onIncludersChange(addKeywordSegments(includers, text));
              setIncluderDraft("");
            }}
            onRemove={(value) =>
              onIncludersChange(removeKeyword(includers, value))
            }
          />
          <KeywordSection
            title="Text Excluder (Optional)"
            placeholder="Enter keywords to exclude"
            help="Hides listings containing any of these words (separate multiple with commas)"
            values={excluders}
            draft={excluderDraft}
            onDraftChange={setExcluderDraft}
            onAdd={(text) => {
              onExcludersChange(addKeywordSegments(excluders, text));
              setExcluderDraft("");
            }}
            onRemove={(value) =>
              onExcludersChange(removeKeyword(excluders, value))
            }
          />
        </View>

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

interface SearchBottomSheetKeywordsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  includers: string[];
  excluders: string[];
  onIncludersChange: (values: string[]) => void;
  onExcludersChange: (values: string[]) => void;
}

export function SearchBottomSheetKeywordsSheet({
  isOpen,
  onOpenChange,
  includers,
  excluders,
  onIncludersChange,
  onExcludersChange,
}: SearchBottomSheetKeywordsSheetProps): JSX.Element | null {
  const [draftIncluders, setDraftIncluders] = useState(includers);
  const [draftExcluders, setDraftExcluders] = useState(excluders);

  useEffect(() => {
    if (!isOpen) return;
    setDraftIncluders(includers);
    setDraftExcluders(excluders);
  }, [isOpen, includers, excluders]);

  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <KeywordsSheetContent
        includers={draftIncluders}
        excluders={draftExcluders}
        onIncludersChange={setDraftIncluders}
        onExcludersChange={setDraftExcluders}
        onPersist={(nextIncluders, nextExcluders) => {
          onIncludersChange(nextIncluders);
          onExcludersChange(nextExcluders);
        }}
      />
    </SheetShell>
  );
}
