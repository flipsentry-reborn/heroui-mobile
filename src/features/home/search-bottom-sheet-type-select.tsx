import { Ionicons } from "@expo/vector-icons";
import { Fragment, type JSX } from "react";
import { Pressable, View } from "react-native";
import { Select, Separator, Typography, useThemeColor } from "heroui-native";

import type { SearchType } from "@/mocks/data/home";
import type { UserFilterType } from "@/models/user-filter";

export const SEARCH_TYPE_OPTIONS: {
  value: SearchType;
  label: string;
}[] = [
  { value: "car", label: "Vehicles" },
  { value: "iphone", label: "iPhones" },
  { value: "custom", label: "Custom" },
];

/** Filter sheet: Vehicles / Custom (no iPhone). */
export const FILTER_TYPE_OPTIONS: {
  value: UserFilterType;
  label: string;
}[] = [
  { value: "Vehicle", label: "Vehicles" },
  { value: "Custom", label: "Custom" },
];

export function searchTypeLabel(type: SearchType | null): string {
  if (type == null) return "Empty";
  return SEARCH_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "Empty";
}

type LooseSelectOption = { value: string; label: string } | undefined;

export interface TypeSelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface SearchBottomSheetTypeSelectProps<T extends string = SearchType> {
  value: T | null;
  onChange: (type: T) => void;
  options?: TypeSelectOption<T>[];
  accessibilityLabelPrefix?: string;
}

/** HeroUI Select for search/filter type (Vehicles / iPhones / Custom, etc.). */
export function SearchBottomSheetTypeSelect<T extends string = SearchType>({
  value,
  onChange,
  options,
  accessibilityLabelPrefix = "Search type",
}: SearchBottomSheetTypeSelectProps<T>): JSX.Element {
  const [accent, muted] = useThemeColor(["accent", "muted"]);
  const resolvedOptions = (options ??
    SEARCH_TYPE_OPTIONS) as TypeSelectOption<T>[];
  const selected = resolvedOptions.find((o) => o.value === value);
  const label = selected?.label ?? "Empty";
  const hasValue = value != null;
  const allowed = new Set(resolvedOptions.map((o) => o.value));

  return (
    <Select
      value={
        selected ? { value: selected.value, label: selected.label } : undefined
      }
      onValueChange={(next: LooseSelectOption) => {
        if (next === undefined || !allowed.has(next.value as T)) return;
        onChange(next.value as T);
      }}
    >
      <Select.Trigger variant="unstyled" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${accessibilityLabelPrefix} ${label}`}
          className="flex-row items-center gap-1"
        >
          <Typography
            type="body-sm"
            className={hasValue ? "text-foreground" : "text-muted"}
          >
            {label}
          </Typography>
          <Ionicons name="chevron-forward" size={16} color={muted} />
        </Pressable>
      </Select.Trigger>
      <Select.Portal>
        <Select.Overlay className="bg-backdrop" />
        <Select.Content
          presentation="popover"
          placement="bottom"
          align="end"
          width={220}
          className="rounded-2xl"
        >
          {resolvedOptions.map((option, index) => (
            <Fragment key={option.value}>
              <Select.Item
                value={option.value}
                label={option.label}
                className="py-3"
              >
                {({ isSelected }) => (
                  <>
                    <Select.ItemLabel />
                    <View className="items-center justify-center">
                      <Ionicons
                        name={
                          isSelected ? "radio-button-on" : "radio-button-off"
                        }
                        size={18}
                        color={isSelected ? accent : muted}
                      />
                    </View>
                  </>
                )}
              </Select.Item>
              {index < resolvedOptions.length - 1 ? (
                <Separator className="mx-4 bg-muted/40" />
              ) : null}
            </Fragment>
          ))}
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}
