import { Ionicons } from "@expo/vector-icons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { JSX, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { View, type TextInput } from "react-native";
import {
  Accordion,
  BottomSheet,
  Button,
  Chip,
  Input,
  Menu,
  Separator,
  Typography,
  useBottomSheet,
  useBottomSheetAwareHandlers,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { SearchSheetGroup } from "@/features/home/search-sheet-group";
import { SheetShell } from "@/features/home/sheet-shell";

const StyledIonicons = withUniwind(Ionicons);
const StyledBottomSheetScrollView = withUniwind(BottomSheetScrollView);

type KeywordTone = "required" | "ignored";

export interface KeywordsState {
  titleIncluders: string[];
  titleExcluders: string[];
  descriptionIncluders: string[];
  descriptionExcluders: string[];
}

export const EMPTY_KEYWORDS: KeywordsState = {
  titleIncluders: [],
  titleExcluders: [],
  descriptionIncluders: [],
  descriptionExcluders: [],
};

export function formatKeywordsLabel(keywords: KeywordsState): string {
  const total =
    keywords.titleIncluders.length +
    keywords.titleExcluders.length +
    keywords.descriptionIncluders.length +
    keywords.descriptionExcluders.length;
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
  caretAtEndToken: number;
}): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  useEffect(() => {
    if (caretAtEndToken === 0) return;
    const end = value.length;
    const id = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setNativeProps({
        selection: { start: end, end },
      });
    }, 80);
    return () => clearTimeout(id);
  }, [caretAtEndToken, inputRef, value.length]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChangeText={onChangeText}
      placeholder="Add keyword"
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="done"
      onSubmitEditing={onSubmit}
      variant="secondary"
      className="h-auto min-h-0 w-full border-0 bg-transparent px-0 py-0 text-[15px] shadow-none ios:outline-0 ios:focus:outline-transparent android:border-0 android:focus:border-transparent text-foreground"
      placeholderColorClassName="text-muted"
      onFocus={onFocus}
      onBlur={onBlur}
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

function KeywordBlock({
  title,
  tone,
  values,
  draft,
  onDraftChange,
  onAdd,
  onRemove,
  isLast,
}: {
  title: string;
  tone: KeywordTone;
  values: string[];
  draft: string;
  onDraftChange: (value: string) => void;
  onAdd: (text: string) => void;
  onRemove: (value: string) => void;
  isLast?: boolean;
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

  const handleEdit = (keyword: string) => {
    onRemove(keyword);
    onDraftChange(keyword);
    setCaretAtEndToken((token) => token + 1);
  };

  return (
    <>
      <View className="gap-2.5 px-4 py-3.5">
        <Typography type="body-xs" className="text-muted">
          {title}
        </Typography>
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
          onSubmit={() => onAdd(draft)}
          inputRef={inputRef}
          caretAtEndToken={caretAtEndToken}
        />
      </View>
      {!isLast ? <Separator className="mx-4 bg-muted/40" /> : null}
    </>
  );
}

/** Small left label + card with Required / Ignored. */
function KeywordsFieldGroup({
  label,
  includers,
  excluders,
  includerDraft,
  excluderDraft,
  onIncluderDraftChange,
  onExcluderDraftChange,
  onIncludersChange,
  onExcludersChange,
}: {
  label: string;
  includers: string[];
  excluders: string[];
  includerDraft: string;
  excluderDraft: string;
  onIncluderDraftChange: (value: string) => void;
  onExcluderDraftChange: (value: string) => void;
  onIncludersChange: (values: string[]) => void;
  onExcludersChange: (values: string[]) => void;
}): JSX.Element {
  return (
    <SearchSheetGroup title={label}>
      <KeywordBlock
        title="Required"
        tone="required"
        values={includers}
        draft={includerDraft}
        onDraftChange={onIncluderDraftChange}
        onAdd={(text) => {
          onIncludersChange(addKeywordSegments(includers, text));
          onIncluderDraftChange("");
        }}
        onRemove={(value) =>
          onIncludersChange(removeKeyword(includers, value))
        }
      />
      <KeywordBlock
        title="Ignored"
        tone="ignored"
        values={excluders}
        draft={excluderDraft}
        onDraftChange={onExcluderDraftChange}
        onAdd={(text) => {
          onExcludersChange(addKeywordSegments(excluders, text));
          onExcluderDraftChange("");
        }}
        onRemove={(value) =>
          onExcludersChange(removeKeyword(excluders, value))
        }
        isLast
      />
    </SearchSheetGroup>
  );
}

function KeywordsSheetContent({
  keywords,
  onKeywordsChange,
  onPersist,
}: {
  keywords: KeywordsState;
  onKeywordsChange: (next: KeywordsState) => void;
  onPersist: (next: KeywordsState) => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const [titleIncluderDraft, setTitleIncluderDraft] = useState("");
  const [titleExcluderDraft, setTitleExcluderDraft] = useState("");
  const [descriptionIncluderDraft, setDescriptionIncluderDraft] = useState("");
  const [descriptionExcluderDraft, setDescriptionExcluderDraft] = useState("");
  const snapPoints = useMemo(() => ["92%"], []);
  const dismiss = () => onOpenChange(false);

  const patch = (partial: Partial<KeywordsState>) => {
    onKeywordsChange({ ...keywords, ...partial });
  };

  const handleSave = () => {
    const next: KeywordsState = {
      titleIncluders: addKeywordSegments(
        keywords.titleIncluders,
        titleIncluderDraft,
      ),
      titleExcluders: addKeywordSegments(
        keywords.titleExcluders,
        titleExcluderDraft,
      ),
      descriptionIncluders: addKeywordSegments(
        keywords.descriptionIncluders,
        descriptionIncluderDraft,
      ),
      descriptionExcluders: addKeywordSegments(
        keywords.descriptionExcluders,
        descriptionExcluderDraft,
      ),
    };
    setTitleIncluderDraft("");
    setTitleExcluderDraft("");
    setDescriptionIncluderDraft("");
    setDescriptionExcluderDraft("");
    onPersist(next);
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
        <View className="items-center px-5 pb-1 pt-4">
          <Typography type="body" weight="normal">
            Keywords
          </Typography>
        </View>

        <StyledBottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerClassName="pb-2 pt-2"
        >
          <View className="mb-3 px-3">
            <Accordion
              variant="surface"
              selectionMode="single"
              hideSeparator
              isCollapsible
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
                    Title and Description each have Required and Ignored
                    keywords. Required must match; Ignored hides matching
                    listings.
                  </Typography>
                </Accordion.Content>
              </Accordion.Item>
            </Accordion>
          </View>

          <KeywordsFieldGroup
            label="Title"
            includers={keywords.titleIncluders}
            excluders={keywords.titleExcluders}
            includerDraft={titleIncluderDraft}
            excluderDraft={titleExcluderDraft}
            onIncluderDraftChange={setTitleIncluderDraft}
            onExcluderDraftChange={setTitleExcluderDraft}
            onIncludersChange={(titleIncluders) => patch({ titleIncluders })}
            onExcludersChange={(titleExcluders) => patch({ titleExcluders })}
          />

          <KeywordsFieldGroup
            label="Description"
            includers={keywords.descriptionIncluders}
            excluders={keywords.descriptionExcluders}
            includerDraft={descriptionIncluderDraft}
            excluderDraft={descriptionExcluderDraft}
            onIncluderDraftChange={setDescriptionIncluderDraft}
            onExcluderDraftChange={setDescriptionExcluderDraft}
            onIncludersChange={(descriptionIncluders) =>
              patch({ descriptionIncluders })
            }
            onExcludersChange={(descriptionExcluders) =>
              patch({ descriptionExcluders })
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
  keywords: KeywordsState;
  onKeywordsChange: (keywords: KeywordsState) => void;
}

export function SearchBottomSheetKeywordsSheet({
  isOpen,
  onOpenChange,
  keywords,
  onKeywordsChange,
}: SearchBottomSheetKeywordsSheetProps): JSX.Element | null {
  const [draft, setDraft] = useState(keywords);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(keywords);
  }, [isOpen, keywords]);

  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <KeywordsSheetContent
        keywords={draft}
        onKeywordsChange={setDraft}
        onPersist={onKeywordsChange}
      />
    </SheetShell>
  );
}
