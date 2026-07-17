import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import type { JSX, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { View, type TextInput } from "react-native";
import {
  Accordion,
  BottomSheet,
  Button,
  Chip,
  ListGroup,
  Menu,
  Separator,
  Typography,
  useBottomSheet,
  useThemeColor,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { SheetShell } from "@/features/home/sheet-shell";

const StyledIonicons = withUniwind(Ionicons);
const StyledBottomSheetScrollView = withUniwind(BottomSheetScrollView);

type KeywordTone = "required" | "ignored";

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
  inputRef,
  caretAtEndToken,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  inputRef: RefObject<TextInput | null>;
  /** Bumps when Edit puts text into the field — focus + caret at end. */
  caretAtEndToken: number;
}): JSX.Element {
  const [muted, foreground] = useThemeColor(["muted", "foreground"]);

  useEffect(() => {
    if (caretAtEndToken === 0) return;
    const end = value.length;
    // Wait for Menu dismiss so focus/caret aren't stolen.
    const id = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setNativeProps({
        selection: { start: end, end },
      });
    }, 80);
    return () => clearTimeout(id);
  }, [caretAtEndToken, inputRef, value.length]);

  return (
    <BottomSheetTextInput
      ref={inputRef}
      value={value}
      onChangeText={onChangeText}
      placeholder="Add keyword"
      placeholderTextColor={muted}
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="done"
      onSubmitEditing={onSubmit}
      style={{
        height: 40,
        minHeight: 40,
        width: "100%",
        paddingHorizontal: 0,
        paddingVertical: 0,
        backgroundColor: "transparent",
        color: foreground,
        fontSize: 15,
      }}
    />
  );
}

function KeywordChip({
  keyword,
  tone,
  onEdit,
  onDelete,
}: {
  keyword: string;
  tone: KeywordTone;
  onEdit: () => void;
  onDelete: () => void;
}): JSX.Element {
  // Theme accent is B/W — Required needs explicit blue (ref image), Ignored uses danger.
  const chipClassName =
    tone === "required"
      ? "rounded-full bg-sky-500/25 px-2.5 py-1"
      : "rounded-full px-2.5 py-1";
  const labelClassName =
    tone === "required"
      ? "text-xs text-sky-400"
      : "text-xs text-danger-soft-foreground";

  return (
    <Menu>
      <Menu.Trigger asChild>
        <Chip
          size="sm"
          variant="soft"
          color={tone === "required" ? "default" : "danger"}
          className={chipClassName}
          accessibilityRole="button"
          accessibilityLabel={`Options for ${keyword}`}
        >
          <Chip.Label className={labelClassName}>{keyword}</Chip.Label>
        </Chip>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Overlay />
        <Menu.Content presentation="popover" width={160} placement="top">
          <Menu.Item onPress={onEdit}>
            <StyledIonicons
              name="create-outline"
              size={18}
              className="text-foreground"
            />
            <Menu.ItemTitle>Edit</Menu.ItemTitle>
          </Menu.Item>
          <Menu.Item variant="danger" onPress={onDelete}>
            <StyledIonicons
              name="trash-outline"
              size={18}
              className="text-danger"
            />
            <Menu.ItemTitle>Delete</Menu.ItemTitle>
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  );
}

function KeywordSection({
  title,
  tone,
  values,
  draft,
  onDraftChange,
  onAdd,
  onRemove,
}: {
  title: string;
  tone: KeywordTone;
  values: string[];
  draft: string;
  onDraftChange: (value: string) => void;
  onAdd: (text: string) => void;
  onRemove: (value: string) => void;
}): JSX.Element {
  const inputRef = useRef<TextInput>(null);
  const [caretAtEndToken, setCaretAtEndToken] = useState(0);

  const handleChangeText = (text: string) => {
    if (text.includes(",")) {
      onAdd(text);
      return;
    }
    onDraftChange(text);
  };

  const handleAdd = () => {
    onAdd(draft);
  };

  const handleEdit = (keyword: string) => {
    onRemove(keyword);
    onDraftChange(keyword);
    setCaretAtEndToken((token) => token + 1);
  };

  return (
    <ListGroup className="mx-3 rounded-3xl p-0">
      <View className="px-4 pb-2.5 pt-3.5">
        <Typography type="body-xs" className="text-muted">
          {title}
        </Typography>
      </View>
      <Separator className="mx-4 bg-muted/40" />
      <View className="gap-2 px-4 pb-3.5 pt-2">
        {values.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {values.map((keyword) => (
              <KeywordChip
                key={keyword}
                keyword={keyword}
                tone={tone}
                onEdit={() => handleEdit(keyword)}
                onDelete={() => onRemove(keyword)}
              />
            ))}
          </View>
        ) : null}
        <KeywordFieldInput
          value={draft}
          onChangeText={handleChangeText}
          onSubmit={handleAdd}
          inputRef={inputRef}
          caretAtEndToken={caretAtEndToken}
        />
      </View>
    </ListGroup>
  );
}

/**
 * HeroUI scrollable sheet pattern:
 * snapPoints + enableDynamicSizing={false} + contentContainerClassName="h-full"
 * @see heroui-native BottomSheet.md — "Scrollable with Snap Points"
 */
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
  const [includerDraft, setIncluderDraft] = useState("");
  const [excluderDraft, setExcluderDraft] = useState("");
  // ~30% taller than a mid cut-off sheet (~60%) → open near full usable height
  const snapPoints = useMemo(() => ["90%"], []);
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
        <View className="items-center px-5 pt-4 pb-1">
          <Typography type="body" weight="normal">
            Keywords
          </Typography>
        </View>

        <StyledBottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerClassName="gap-3 px-0 pb-4 pt-3"
        >
          <Accordion
            variant="surface"
            selectionMode="single"
            hideSeparator
            isCollapsible
            className="mx-3"
          >
            <Accordion.Item value="guide">
              <Accordion.Trigger>
                <View className="flex-row items-center gap-2.5">
                  <StyledIonicons
                    name="sparkles"
                    size={16}
                    className="text-violet-400"
                  />
                  <Typography
                    type="body-sm"
                    weight="semibold"
                    className="text-foreground"
                  >
                    Guide
                  </Typography>
                </View>
                <Accordion.Indicator />
              </Accordion.Trigger>
              <Accordion.Content>
                <Typography type="body-xs" className="text-muted">
                  Required words must appear in the listing title. Ignored words
                  hide matching titles.
                </Typography>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>

          <KeywordSection
            title="Required"
            tone="required"
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
            title="Ignored"
            tone="ignored"
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
