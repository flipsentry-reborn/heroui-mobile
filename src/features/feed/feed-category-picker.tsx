import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useRef } from "react";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  ScrollShadow,
  Typography,
  useThemeColor,
} from "heroui-native";
import { useUniwind } from "uniwind";

import type { FeedCategoryDef } from "@/features/feed/build-feed-categories";
import { FeedCategoryBadge } from "@/features/feed/feed-category-badge";
import { useStore } from "@/store/store";

/** Matches `AppTabBar` row + bottom inset so the feed FAB clears the dock. */
const TAB_BAR_ROW_HEIGHT = 48;
const SCROLL_FADE_SIZE = 100;
const EDGE_FADE_EXTRA = 48;
const FAB_END_INSET = 16;
const FAB_SIZE_CLASS = "size-9 min-h-9 min-w-9 rounded-full p-0";

function feedPickerFabBottom(insets: { bottom: number }): number {
  const bottomPad = Math.max(insets.bottom, 8);
  return bottomPad + TAB_BAR_ROW_HEIGHT + 12;
}

function pageBackdrop(isDark: boolean): string {
  return isDark ? "#000000" : "#ffffff";
}

function fadeTransparent(backdrop: string): string {
  return backdrop === "#000000" ? "rgba(0,0,0,0)" : "rgba(255,255,255,0)";
}

function FeedCategoryPickerEdgeFades({
  backdrop,
  topHeight,
  bottomHeight,
}: {
  backdrop: string;
  topHeight: number;
  bottomHeight: number;
}): JSX.Element {
  const transparent = fadeTransparent(backdrop);

  return (
    <>
      <LinearGradient
        colors={[backdrop, transparent]}
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: topHeight,
          zIndex: 20,
        }}
      />
      <LinearGradient
        colors={[transparent, backdrop]}
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: bottomHeight,
          zIndex: 20,
        }}
      />
    </>
  );
}

function FeedCategorySelectItem({
  category,
  isSelected,
  onPress,
}: {
  category: FeedCategoryDef;
  isSelected: boolean;
  onPress: () => void;
}): JSX.Element {
  const { theme } = useUniwind();
  const isDark = theme === "dark";
  const [foreground, muted, accent] = useThemeColor([
    "foreground",
    "muted",
    "accent",
  ]);

  const selectedRowClass = isDark
    ? "absolute inset-0 bg-surface shadow-md"
    : "absolute inset-0 bg-surface-secondary shadow-sm";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={category.label}
      onPress={onPress}
      className="self-start flex-row items-center gap-3 overflow-hidden rounded-2xl py-2.5 pe-4 ps-4"
    >
      {isSelected ? <View className={selectedRowClass} /> : null}
      {category.key === "price-drop" ? (
        <View className="flex-row flex-wrap items-center">
          <View className="flex-row items-center gap-0.5">
            <Typography
              type="body"
              weight="medium"
              numberOfLines={1}
              className="text-lg text-foreground"
            >
              {category.label}
            </Typography>
            <Ionicons
              name="arrow-down"
              size={16}
              color={isSelected ? foreground : muted}
            />
          </View>
          {category.badge ? (
            <View className="ms-4">
              <FeedCategoryBadge label={category.badge} inline />
            </View>
          ) : null}
        </View>
      ) : (
        <View className="flex-row flex-wrap items-center">
          {category.color ? (
            <View
              className="h-2.5 w-2.5 rounded-full border border-border"
              style={{ backgroundColor: category.color }}
            />
          ) : null}
          <Typography
            type="body"
            weight="medium"
            numberOfLines={1}
            className={
              category.color
                ? "ms-1.5 text-lg text-foreground"
                : "text-lg text-foreground"
            }
          >
            {category.label}
          </Typography>
          {category.badge ? (
            <View className="ms-4">
              <FeedCategoryBadge label={category.badge} inline />
            </View>
          ) : null}
        </View>
      )}
      {isSelected ? (
        <Ionicons name="checkmark" size={18} color={accent} />
      ) : null}
    </Pressable>
  );
}

/** FAB on the feed screen — opens the full-screen categories route. */
export function FeedCategoryPickerFab(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const fabBottom = feedPickerFabBottom(insets);

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 z-40 items-end"
      style={{ paddingBottom: fabBottom, paddingEnd: FAB_END_INSET }}
    >
      <Button
        isIconOnly
        size="sm"
        hitSlop={10}
        accessibilityLabel="All feed categories"
        className={FAB_SIZE_CLASS}
        onPress={() => router.push("/feed-categories")}
      >
        <Ionicons name="list" size={16} color={accentForeground} />
      </Button>
    </View>
  );
}

/**
 * Full-screen category list as a root Stack screen — sits above the tab bar.
 */
export const FeedCategoryPickerScreen = observer(
  function FeedCategoryPickerScreen(): JSX.Element {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = useWindowDimensions();
    const { theme } = useUniwind();
    const isDark = theme === "dark";
    const backdrop = pageBackdrop(isDark);
    const [accentForeground] = useThemeColor(["accent-foreground"]);
    const { searchStore, feedStore } = useStore();
    const categories = searchStore.feedCategories;
    const activeCategory = feedStore.activeCategory;
    const scrollRef = useRef<ScrollView>(null);

    /** List grows from the bottom; capped at 70% height, with 10% clear below. */
    const listMaxHeight = screenHeight * 0.7;
    const bottomClearance = screenHeight * 0.1;
    const topFadeHeight = SCROLL_FADE_SIZE + EDGE_FADE_EXTRA;
    const bottomFadeHeight = SCROLL_FADE_SIZE;
    /** Match feed FAB screen position (includes tab-bar clearance). */
    const closeFabBottom = feedPickerFabBottom(insets);

    const closePicker = () => {
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace("/feed");
    };

    const handleSelect = (key: string) => {
      feedStore.setActiveCategory(key);
      closePicker();
    };

    return (
      <View className="flex-1" style={{ backgroundColor: backdrop }}>
        {/* Leftover top space — tap to dismiss. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close categories"
          onPress={closePicker}
          className="min-h-0 flex-1"
        />

        {/* Max 70% tall, lifted 10% from the bottom; scrolls when content overflows. */}
        <View
          className="relative w-full overflow-hidden"
          style={{
            maxHeight: listMaxHeight,
            marginBottom: bottomClearance,
          }}
        >
          <ScrollShadow
            LinearGradientComponent={LinearGradient}
            color={backdrop}
            size={SCROLL_FADE_SIZE}
          >
            <ScrollView
              ref={scrollRef}
              style={{ maxHeight: listMaxHeight }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingTop: 12,
                paddingBottom: 12,
              }}
            >
              <View className="items-start gap-2 px-4">
                {categories.map((category) => (
                  <FeedCategorySelectItem
                    key={category.key}
                    category={category}
                    isSelected={category.key === activeCategory}
                    onPress={() => handleSelect(category.key)}
                  />
                ))}
              </View>
            </ScrollView>
          </ScrollShadow>

          <FeedCategoryPickerEdgeFades
            backdrop={backdrop}
            topHeight={topFadeHeight}
            bottomHeight={bottomFadeHeight}
          />
        </View>

        <View
          pointerEvents="box-none"
          className="absolute inset-x-0 bottom-0 z-50 items-end"
          style={{
            paddingBottom: closeFabBottom,
            paddingEnd: FAB_END_INSET,
          }}
        >
          <Button
            isIconOnly
            size="sm"
            accessibilityLabel="Close categories"
            className={FAB_SIZE_CLASS}
            onPress={closePicker}
          >
            <Ionicons name="close" size={18} color={accentForeground} />
          </Button>
        </View>
      </View>
    );
  },
);
