import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX } from "react";
import { View } from "react-native";
import { Button, Select, useThemeColor } from "heroui-native";
import { withUniwind } from "uniwind";

import {
  APPEARANCE_OPTIONS,
  isAppearanceMode,
  type AppearanceMode,
} from "@/lib/appearance";

const StyledIonicons = withUniwind(Ionicons);

type IonName = ComponentProps<typeof Ionicons>["name"];

const OPTION_ICONS: Record<AppearanceMode, IonName> = {
  light: "sunny-outline",
  dark: "moon-outline",
  system: "phone-portrait-outline",
};

type LooseSelectOption = { value: string; label: string } | undefined;

interface ThemeSelectProps {
  value: AppearanceMode;
  onChange: (mode: AppearanceMode) => void;
}

/** Fitness-app style Select for Light / Dark / System. */
export function ThemeSelect({ value, onChange }: ThemeSelectProps): JSX.Element {
  const indicatorColor = useThemeColor("accent");
  const selected = APPEARANCE_OPTIONS.find((o) => o.value === value) ?? APPEARANCE_OPTIONS[2];

  return (
    <Select
      value={{ value: selected.value, label: selected.title }}
      onValueChange={(next: LooseSelectOption) => {
        if (next === undefined || !isAppearanceMode(next.value)) return;
        onChange(next.value);
      }}
    >
      <Select.Trigger variant="unstyled" asChild>
        <Button
          isIconOnly
          variant="secondary"
          size="sm"
          accessibilityLabel="Switch appearance"
        >
          <StyledIonicons
            name={OPTION_ICONS[selected.value]}
            size={18}
            className="text-foreground"
          />
        </Button>
      </Select.Trigger>
      <Select.Portal>
        <Select.Overlay className="bg-backdrop" />
        <Select.Content presentation="popover" placement="bottom" align="end" width={200}>
          {APPEARANCE_OPTIONS.map((option) => (
            <Select.Item
              key={option.value}
              value={option.value}
              label={option.title}
            >
              <View className="flex-1 flex-row items-center gap-2">
                <StyledIonicons
                  name={OPTION_ICONS[option.value]}
                  size={16}
                  className="text-muted"
                />
                <Select.ItemLabel />
              </View>
              <Select.ItemIndicator iconProps={{ color: indicatorColor }} />
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}
