import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Button,
  FieldError,
  Typography,
  useBottomSheet,
  useThemeColor,
} from "heroui-native";
import { WheelPicker, WheelPickerGroup } from "heroui-native-pro";

import { SheetShell } from "@/features/home/sheet-shell";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1980;
const MAX_YEAR = CURRENT_YEAR + 1;

function buildYearItems(
  openLabel: string,
): { value: string; label: string }[] {
  const years: { value: string; label: string }[] = [
    { value: "", label: openLabel },
  ];
  for (let year = MAX_YEAR; year >= MIN_YEAR; year -= 1) {
    years.push({ value: String(year), label: String(year) });
  }
  return years;
}

const MIN_YEAR_ITEMS = buildYearItems("No min");
const MAX_YEAR_ITEMS = buildYearItems("No max");

function getYearRangeError(min: string, max: string): string | null {
  if (min === "" || max === "") return null;
  if (Number(min) > Number(max)) {
    return "Minimum year cannot be greater than maximum year";
  }
  return null;
}

function YearSheetContent({
  min,
  max,
  onPersist,
}: {
  min: string;
  max: string;
  onPersist: (min: string, max: string) => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const [surface] = useThemeColor(["surface"]);
  const [values, setValues] = useState<Record<string, unknown>>({
    min: min || "",
    max: max || "",
  });

  useEffect(() => {
    setValues({ min: min || "", max: max || "" });
  }, [min, max]);

  const draftMin = String(values.min ?? "");
  const draftMax = String(values.max ?? "");
  const error = getYearRangeError(draftMin, draftMax);
  const isInvalid = error != null;
  const dismiss = () => onOpenChange(false);

  const handleSave = () => {
    if (error != null) return;
    onPersist(draftMin, draftMax);
    dismiss();
  };

  const itemHeight = 44;
  const visibleCount = 5;
  const pickerHeight = useMemo(
    () => itemHeight * visibleCount,
    [itemHeight, visibleCount],
  );

  return (
    <BottomSheet.Content
      backgroundClassName="rounded-t-[32px] bg-surface-secondary"
      handleComponent={null}
      contentContainerClassName="bg-surface-secondary p-0"
      enableContentPanningGesture={false}
      enableOverDrag={false}
    >
      <View>
        <View className="items-center px-5 pb-1 pt-4">
          <Typography type="body" weight="normal">
            Year
          </Typography>
        </View>

        <View className="flex-row justify-between px-8 pb-2 pt-3">
          <Typography type="body-xs" className="flex-1 text-center text-muted">
            Min
          </Typography>
          <Typography type="body-xs" className="flex-1 text-center text-muted">
            Max
          </Typography>
        </View>

        <View className="mx-5 mb-2 overflow-hidden rounded-3xl bg-surface px-2">
          <View style={{ height: pickerHeight }}>
            <WheelPickerGroup
              values={values}
              onValuesChange={setValues}
              itemHeight={itemHeight}
              visibleCount={visibleCount}
              className="h-full"
            >
              <WheelPicker name="min" items={MIN_YEAR_ITEMS} />
              <WheelPicker name="max" items={MAX_YEAR_ITEMS} />
              <WheelPickerGroup.Indicator />
              <WheelPickerGroup.Mask color={surface} height="70%" />
            </WheelPickerGroup>
          </View>
        </View>

        {error ? (
          <FieldError isInvalid className="mx-5 mb-1">
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

interface SearchBottomSheetYearSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

export function SearchBottomSheetYearSheet({
  isOpen,
  onOpenChange,
  min,
  max,
  onMinChange,
  onMaxChange,
}: SearchBottomSheetYearSheetProps): JSX.Element | null {
  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <YearSheetContent
        min={min}
        max={max}
        onPersist={(nextMin, nextMax) => {
          onMinChange(nextMin);
          onMaxChange(nextMax);
        }}
      />
    </SheetShell>
  );
}
