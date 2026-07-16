import type { JSX } from "react";
import { Typography } from "heroui-native";
import { FAB } from "heroui-native-pro";

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

interface SearchBottomSheetTypeFabProps {
  value: SearchType | null;
  onChange: (type: SearchType) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Distance-unit-style FAB picker for search type. */
export function SearchBottomSheetTypeFab({
  value,
  onChange,
  isOpen,
  onOpenChange,
}: SearchBottomSheetTypeFabProps): JSX.Element {
  const label = searchTypeLabel(value);

  return (
    <FAB
      placement="top"
      align="end"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <FAB.Trigger
        accessibilityLabel={`Search type ${label}`}
        className="h-8 min-w-20 px-3"
        animation={{ rotate: { value: [0, 0, 0] } }}
      >
        <Typography
          type="body-xs"
          weight="bold"
          numberOfLines={1}
          className="text-accent-foreground"
        >
          {label}
        </Typography>
      </FAB.Trigger>
      <FAB.Portal>
        <FAB.Overlay />
        <FAB.Content>
          {SEARCH_TYPE_OPTIONS.map((option) => (
            <FAB.Item key={option.value} onPress={() => onChange(option.value)}>
              {option.label}
            </FAB.Item>
          ))}
        </FAB.Content>
      </FAB.Portal>
    </FAB>
  );
}
