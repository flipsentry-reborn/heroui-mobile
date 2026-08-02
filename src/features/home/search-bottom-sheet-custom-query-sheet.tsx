import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Button,
  Typography,
  useBottomSheet,
} from "heroui-native";

import {
  CustomSearchInput,
  isCustomSearchQueryValid,
} from "@/features/home/search-bottom-sheet-criteria";
import {
  SearchSheetGroup,
  SearchSheetRow,
} from "@/features/home/search-sheet-group";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";

function CustomQuerySheetContent({
  title,
  fieldTitle,
  value,
  onChange,
  onPersist,
  placeholder,
}: {
  title: string;
  fieldTitle: string;
  value: string;
  onChange: (value: string) => void;
  onPersist: (value: string) => void;
  placeholder?: string;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const snapPoints = useMemo(() => ["40%", "70%"], []);
  const canSave = isCustomSearchQueryValid(value);
  const dismiss = () => onOpenChange(false);

  const handleSave = () => {
    if (!canSave) return;
    onPersist(value.trim());
    dismiss();
  };

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enableOverDrag={false}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      className={SHEET_CONTENT_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
      handleComponent={null}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME}
    >
      <View>
        <View className="items-center px-5 pb-1 pt-4">
          <Typography type="body" weight="normal">
            {title}
          </Typography>
        </View>
        <SearchSheetGroup>
          <SearchSheetRow
            title={fieldTitle}
            required
            requiredTone="warning"
            expandRight
            isLast
            right={
              <CustomSearchInput
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoFocus
                invalidTone="warning"
              />
            }
          />
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

interface SearchBottomSheetCustomQuerySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  /** Sheet title — e.g. Search / Name. */
  title?: string;
  /** Left label on the field row. */
  fieldTitle?: string;
  placeholder?: string;
}

export function SearchBottomSheetCustomQuerySheet({
  isOpen,
  onOpenChange,
  value,
  onChange,
  title = "Search",
  fieldTitle = "Search",
  placeholder = "Required",
}: SearchBottomSheetCustomQuerySheetProps): JSX.Element | null {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(value);
  }, [isOpen, value]);

  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <CustomQuerySheetContent
        key={isOpen ? value : "closed"}
        title={title}
        fieldTitle={fieldTitle}
        value={draft}
        onChange={setDraft}
        onPersist={onChange}
        placeholder={placeholder}
      />
    </SheetShell>
  );
}
