import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps, JSX } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableFeedback, Typography } from "heroui-native";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const ACTIVE = "#FFFFFF";
const INACTIVE = "#B3B3B3";

const TAB_ICONS: Record<string, { outline: IoniconName; filled: IoniconName }> = {
  index: { outline: "home-outline", filled: "home" },
  feed: { outline: "sparkles-outline", filled: "sparkles" },
  settings: { outline: "settings-outline", filled: "settings" },
  help: { outline: "chatbubble-ellipses-outline", filled: "chatbubble-ellipses" },
};

export function SpotifyTabBar({ state, descriptors, navigation }: BottomTabBarProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 z-50 bg-transparent">
      <LinearGradient
        colors={[
          "rgba(18,18,18,0.62)",
          "rgba(18,18,18,0.92)",
          "rgba(18,18,18,1)",
        ]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View
        className="min-h-[52px] flex-row items-center pt-2"
        style={{ paddingBottom: bottomPad }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? ACTIVE : INACTIVE;
          const label =
            typeof options.title === "string" ? options.title : route.name;
          const icons = TAB_ICONS[route.name] ?? {
            outline: "ellipse-outline" as IoniconName,
            filled: "ellipse" as IoniconName,
          };

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
