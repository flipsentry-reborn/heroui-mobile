import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  FieldError,
  Input,
  useBottomSheetAwareHandlers,
} from "heroui-native";

import { SearchBottomSheetHeader } from "@/features/home/search-bottom-sheet-header";
import {
  SearchSheetGroup,
  SearchSheetRow,
} from "@/features/home/search-sheet-group";

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
      variant="secondary"
      isInvalid={isInvalid}
      className="h-10 w-28 px-2.5 text-center text-sm text-foreground"
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
  onClose,
  onSave,
}: {
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}): JSX.Element {
  const snapPoints = useMemo(() => ["40%", "70%"], []);
  const error = getPriceRangeError(min, max);
  const isInvalid = error != null;

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      enableOverDrag={false}
      enableDynamicSizing={false}
      keyboardBehavior="extend"
      backgroundClassName="rounded-t-[32px] bg-surface-secondary"
      handleComponent={null}
      contentContainerClassName="h-full bg-surface-secondary p-0"
    >
      <View>
        <SearchBottomSheetHeader
          title="Price"
          onClose={onClose}
          onConfirm={onSave}
        />
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
}: SearchBottomSheetPriceSheetProps): JSX.Element {
  const [draftMin, setDraftMin] = useState(min);
  const [draftMax, setDraftMax] = useState(max);

  useEffect(() => {
    if (!isOpen) return;
    setDraftMin(min);
    setDraftMax(max);
  }, [isOpen, min, max]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSave = () => {
    if (getPriceRangeError(draftMin, draftMax) != null) return;
    onMinChange(draftMin);
    onMaxChange(draftMax);
    onOpenChange(false);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
        else onOpenChange(true);
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <PriceSheetContent
          min={draftMin}
          max={draftMax}
          onMinChange={setDraftMin}
          onMaxChange={setDraftMax}
          onClose={handleCancel}
          onSave={handleSave}
        />
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
