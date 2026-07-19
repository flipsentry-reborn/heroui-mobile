import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps, JSX } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableFeedback, Typography, useThemeColor } from "heroui-native";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<string, { outline: IoniconName; filled: IoniconName }> = {
  home: { outline: "home-outline", filled: "home" },
  feed: { outline: "sparkles-outline", filled: "sparkles" },
  settings: { outline: "settings-outline", filled: "settings" },
  community: { outline: "people-outline", filled: "people" },
};

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith("oklch(")) {
    const inner = color.slice(5, -1).trim();
    if (inner.includes("/")) {
      return `oklch(${inner.replace(/\/\s*[\d.]+%?/, `/ ${alpha}`)})`;
    }
    return `oklch(${inner} / ${alpha})`;
  }
  if (color.startsWith("rgba(")) return color;
  const hex = color.replace("#", "");
  if (hex.length !== 6) return color;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Floating bottom tab bar with fade into the screen background. */
export function AppTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const [foreground, muted, background] = useThemeColor([
    "foreground",
    "muted",
    "background",
  ]);

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 z-50 bg-transparent">
      <LinearGradient
        colors={[
          withAlpha(background, 0.62),
          withAlpha(background, 0.92),
          background,
        ]}
        locations={[0, 0.35, 1]}
        className="absolute inset-0"
        pointerEvents="none"
      />
      <View
        className="min-h-[52px] flex-row items-center pt-2"
        style={{ paddingBottom: bottomPad }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          // Skip redirect-only routes (e.g. `index`) — custom bars don't honor `href: null`.
          if (!(route.name in TAB_ICONS)) {
            return null;
          }

          const focused = state.index === index;
          const color = focused ? foreground : muted;
          const label =
            typeof options.title === "string" ? options.title : route.name;
          const icons = TAB_ICONS[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <PressableFeedback
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              className="flex-1 items-center justify-center py-1.5"
              animation={{ scale: { value: 0.94 } }}
            >
              <Ionicons
                name={focused ? icons.filled : icons.outline}
                size={24}
                color={color}
              />
              <Typography
                type="body-xs"
                weight={focused ? "semibold" : "medium"}
                className="mt-0.5"
                style={{ color }}
              >
                {label}
              </Typography>
            </PressableFeedback>
          );
        })}
      </View>
    </View>
  );
}
