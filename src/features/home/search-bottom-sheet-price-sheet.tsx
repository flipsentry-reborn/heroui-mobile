import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Button,
  FieldError,
  Input,
  Typography,
  useBottomSheet,
  useBottomSheetAwareHandlers,
} from "heroui-native";

import {
  SearchSheetGroup,
  SearchSheetRow,
} from "@/features/home/search-sheet-group";
import { SheetShell } from "@/features/home/sheet-shell";

export function sanitizePriceInput(text: string): string {
  return text.replace(/[^0-9]/g, "");
}

/** Non-breaking spaces so "Any - Any" stays on one row in criteria. */
export function formatPriceRangeLabel(min: string, max: string): string {
  const left = min === "" ? "Any" : min;
  const right = max === "" ? "Any" : max;
  return `${left}\u00A0-\u00A0${right}`;
}

function getPriceRangeError(min: string, max: string): string | null {
  if (min === "" || max === "") return null;
  if (Number(min) > Number(max)) {
    return "Minimum cannot be greater than Maximum";
  }
  return null;
}

function PriceFieldInput({
  value,
  onChange,
  isInvalid,
}: {
  value: string;
  onChange: (value: string) => void;
  isInvalid: boolean;
}): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <Input
      value={value}
      onChangeText={(text) => onChange(sanitizePriceInput(text))}
      placeholder="Any"
      keyboardType="number-pad"
      variant="primary"
      isInvalid={isInvalid}
      textAlign="center"
      className="h-8 min-h-8 w-40 px-2 py-0 text-sm text-foreground"
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

function PriceSheetContent({
  min,
  max,
  onMinChange,
  onMaxChange,
  onPersist,
}: {
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onPersist: (min: string, max: string) => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const snapPoints = useMemo(() => ["92%"], []);
  const error = getPriceRangeError(min, max);
  const isInvalid = error != null;
  const dismiss = () => onOpenChange(false);

  const handleSave = () => {
    if (error != null) return;
    onPersist(min, max);
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
            Price
          </Typography>
        </View>
        <SearchSheetGroup>
          <SearchSheetRow
            title="Minimum"
            isLast={false}
            right={
              <PriceFieldInput
                value={min}
                onChange={onMinChange}
                isInvalid={isInvalid}
              />
            }
          />
          <SearchSheetRow
            title="Maximum"
            isLast
            right={
              <PriceFieldInput
                value={max}
                onChange={onMaxChange}
                isInvalid={isInvalid}
              />
            }
          />
        </SearchSheetGroup>
        {error ? (
          <FieldError isInvalid className="mx-5 -mt-3">
            {error}
          </FieldError>
        ) : null}
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
            isDisabled={isInvalid}
            onPress={handleSave}
          >
            <Button.Label>Save</Button.Label>
          </Button>
        </View>
      </View>
    </BottomSheet.Content>
  );
}

interface SearchBottomSheetPriceSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

export function SearchBottomSheetPriceSheet({
  isOpen,
  onOpenChange,
  min,
  max,
  onMinChange,
  onMaxChange,
}: SearchBottomSheetPriceSheetProps): JSX.Element | null {
  const [draftMin, setDraftMin] = useState(min);
  const [draftMax, setDraftMax] = useState(max);

  useEffect(() => {
    if (!isOpen) return;
    setDraftMin(min);
    setDraftMax(max);
  }, [isOpen, min, max]);

  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <PriceSheetContent
        min={draftMin}
        max={draftMax}
        onMinChange={setDraftMin}
        onMaxChange={setDraftMax}
        onPersist={(nextMin, nextMax) => {
          onMinChange(nextMin);
          onMaxChange(nextMax);
        }}
      />
    </SheetShell>
  );
}
