 import { Ionicons } from "@expo/vector-icons";
import { Fragment, type JSX } from "react";
import { Pressable, View } from "react-native";
import { Select, Separator, Typography, useThemeColor } from "heroui-native";

import type { SearchType } from "@/mocks/data/home";

export const SEARCH_TYPE_OPTIONS: {
  value: SearchType;
  label: string;
}[] = [
  { value: "car", label: "Vehicles" },
  { value: "iphone", label: "iPhones" },
  { value: "custom", label: "Custom" },
];

export function searchTypeLabel(type: SearchType | null): string {
  if (type == null) return "Empty";
  return SEARCH_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "Empty";
}

function isSearchType(value: string): value is SearchType {
  return value === "car" || value === "iphone" || value === "custom";
}

type LooseSelectOption = { value: string; label: string } | undefined;

interface SearchBottomSheetTypeSelectProps {
  value: SearchType | null;
  onChange: (type: SearchType) => void;
}

/** HeroUI Select for Vehicles / iPhones / Custom. */
export function SearchBottomSheetTypeSelect({
  value,
  onChange,
}: SearchBottomSheetTypeSelectProps): JSX.Element {
  const [accent, muted] = useThemeColor(["accent", "muted"]);
  const selected = SEARCH_TYPE_OPTIONS.find((o) => o.value === value);
  const label = searchTypeLabel(value);
  const hasValue = value != null;

  return (
    <Select
      value={
        selected ? { value: selected.value, label: selected.label } : undefined
      }
      onValueChange={(next: LooseSelectOption) => {
        if (next === undefined || !isSearchType(next.value)) return;
        onChange(next.value);
      }}
    >
      <Select.Trigger variant="unstyled" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Search type ${label}`}
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
          {SEARCH_TYPE_OPTIONS.map((option, index) => (
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
              {index < SEARCH_TYPE_OPTIONS.length - 1 ? (
                <Separator className="mx-4 bg-muted/40" />
              ) : null}
            </Fragment>
          ))}
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}
