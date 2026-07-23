import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { observer } from "mobx-react-lite";
import type { ComponentProps, JSX } from "react";
import { useEffect } from "react";
import { Animated, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableFeedback, Typography, useThemeColor } from "heroui-native";
import { withUniwind } from "uniwind";

import { useBottomChrome } from "@/contexts/bottom-chrome-context";
import { useBottomChromeAutoHide } from "@/lib/useBottomChromeAutoHide";
import { useStore } from "@/store/store";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const StyledAnimatedView = withUniwind(Animated.View);

const TAB_ROW_MIN_HEIGHT = 52;
const HIDE_EXTRA_OFFSET = 18;

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
export const AppTabBar = observer(function AppTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const { feedStore } = useStore();
  const {
    registerTabBarHandlers,
    registerTabBarReset,
  } = useBottomChrome();
  const dockHideOffset = TAB_ROW_MIN_HEIGHT + bottomPad + HIDE_EXTRA_OFFSET;
  const {
    handleScroll,
    handleSnap,
    hideOpacity,
    hideTranslateY,
    resetVisibility,
  } = useBottomChromeAutoHide(dockHideOffset);

  const [foreground, muted, background] = useThemeColor([
    "foreground",
    "muted",
    "background",
  ]);
  const showNewItems = feedStore.showNewItemsIndicator;
  const feedRoute = state.routes.find((r) => r.name === "feed");
  const feedFocused =
    feedRoute != null && state.index === state.routes.indexOf(feedRoute);
  const activeRouteName = state.routes[state.index]?.name;
  const isFeedTab = activeRouteName === "feed";

  useEffect(() => {
    return registerTabBarHandlers(handleScroll, handleSnap);
  }, [handleScroll, handleSnap, registerTabBarHandlers]);

  useEffect(() => {
    return registerTabBarReset(resetVisibility);
  }, [registerTabBarReset, resetVisibility]);

  useEffect(() => {
    if (!isFeedTab) {
      resetVisibility();
    }
  }, [isFeedTab, resetVisibility]);

  return (
    <StyledAnimatedView
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 z-50 bg-transparent"
      style={{
        transform: [{ translateY: hideTranslateY }],
        opacity: hideOpacity,
      }}
    >
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
      {/* Full-width sticky strip — deferred live items on the active feed category. */}
      {showNewItems && feedFocused ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New listings available, scroll to top"
          onPress={() => {
            resetVisibility();
            feedStore.requestScrollToTop();
          }}
          hitSlop={{ top: 8, bottom: 8 }}
          className="absolute inset-x-0 top-0 z-10 h-3 justify-start"
        >
          <View className="h-1 w-full bg-[#34C759]" />
        </Pressable>
      ) : null}
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
            // Re-tap Feed while already on it → scroll active category to top.
            if (focused && route.name === "feed") {
              resetVisibility();
              feedStore.requestScrollToTop();
              return;
            }

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
              accessibilityLabel={
                route.name === "feed" && showNewItems
                  ? `${label}, new listings available`
                  : (options.tabBarAccessibilityLabel ?? label)
              }
              onPress={onPress}
              className="flex-1 items-center justify-center py-1.5"
              animation={{ scale: { value: 0.94 } }}
            >
              <View className="relative">
                <Ionicons
                  name={focused ? icons.filled : icons.outline}
                  size={24}
                  color={color}
                />
                {route.name === "feed" && showNewItems ? (
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                    className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-background bg-[#34C759]"
                  />
                ) : null}
              </View>
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
    </StyledAnimatedView>
  );
});
