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
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";

export function sanitizePriceInput(text: string): string {
  return text.replace(/[^0-9]/g, "");
}

/** Display helper — HeroUI Input has no built-in grouping; format digits with commas. */
export function formatGroupedDigits(digits: string): string {
  if (digits === "") return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Open-ended range display: ≤15k / 15k+ / 5k-15k.
 * Pass already-formatted values (e.g. "15k", "2018").
 * Copy rules: DESIGN.md → Search filter copy.
 */
export function formatOpenRangeLabel(
  min: string,
  max: string,
  options?: { emptyLabel?: string; unit?: string; joiner?: string },
): string {
  const emptyLabel = options?.emptyLabel ?? "No limit";
  const unit = options?.unit ?? "";
  const joiner = options?.joiner ?? "-";
  const hasMin = min !== "";
  const hasMax = max !== "";
  if (!hasMin && !hasMax) return emptyLabel;
  if (!hasMin) return `≤${max}${unit}`;
  if (!hasMax) return `${min}+${unit}`;
  return `${min}${joiner}${max}${unit}`;
}

/** Criteria row label — NBSP hyphens when both ends are set. */
export function formatPriceRangeLabel(min: string, max: string): string {
  return formatOpenRangeLabel(min, max, { joiner: "\u00A0-\u00A0" });
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
  maxLength,
  placeholder,
  groupThousands = false,
}: {
  value: string;
  onChange: (value: string) => void;
  isInvalid: boolean;
  maxLength?: number;
  placeholder: string;
  groupThousands?: boolean;
}): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();
  const displayValue = groupThousands ? formatGroupedDigits(value) : value;
  // maxLength applies to digits; when grouping, allow room for commas in the field.
  const inputMaxLength =
    maxLength == null
      ? undefined
      : groupThousands
        ? maxLength + Math.floor(Math.max(0, maxLength - 1) / 3)
        : maxLength;

  return (
    <Input
      value={displayValue}
      onChangeText={(text) => {
        const next = sanitizePriceInput(text);
        onChange(
          maxLength != null ? next.slice(0, maxLength) : next,
        );
      }}
      placeholder={placeholder}
      keyboardType="number-pad"
      variant="primary"
      isInvalid={isInvalid}
      textAlign="center"
      maxLength={inputMaxLength}
      className="h-8 min-h-8 w-40 px-2 py-0 text-sm text-foreground"
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

function PriceSheetContent({
  title,
  min,
  max,
  onMinChange,
  onMaxChange,
  onPersist,
  maxLength,
  groupThousands = false,
}: {
  title: string;
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onPersist: (min: string, max: string) => void;
  maxLength?: number;
  groupThousands?: boolean;
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
      enableDynamicSizing={false}
      enableOverDrag={false}
      keyboardBehavior="extend"
      android_keyboardInputMode="adjustResize"
      className={SHEET_CONTENT_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
      handleComponent={null}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_CLASS_NAME}
    >
      <View>
        <View className="items-center px-5 pt-4 pb-1">
          <Typography type="body" weight="normal">
            {title}
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
                maxLength={maxLength}
                placeholder="Min"
                groupThousands={groupThousands}
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
                maxLength={maxLength}
                placeholder="Max"
                groupThousands={groupThousands}
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
            variant="tertiary"
            className="min-h-12 flex-1 rounded-lg bg-surface"
            onPress={dismiss}
          >
            <Button.Label>Cancel</Button.Label>
          </Button>
          <Button
            variant="primary"
            className="min-h-12 flex-1 rounded-lg"
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
  /** Sheet title — reuse for Year / Mileage ranges. */
  title?: string;
  maxLength?: number;
  /** Show thousand separators in the inputs (e.g. mileage 99,000). */
  groupThousands?: boolean;
}

export function SearchBottomSheetPriceSheet({
  isOpen,
  onOpenChange,
  min,
  max,
  onMinChange,
  onMaxChange,
  title = "Price",
  maxLength,
  groupThousands = false,
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
        title={title}
        min={draftMin}
        max={draftMax}
        onMinChange={setDraftMin}
        onMaxChange={setDraftMax}
        maxLength={maxLength}
        groupThousands={groupThousands}
        onPersist={(nextMin, nextMax) => {
          onMinChange(nextMin);
          onMaxChange(nextMax);
        }}
      />
    </SheetShell>
  );
}
