import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  ScrollShadow,
  Select,
  Typography,
  useSelect,
  useThemeColor,
} from "heroui-native";
import { useUniwind } from "uniwind";

import type { FeedCategoryDef } from "@/features/feed/build-feed-categories";
import { FeedCategoryBadge } from "@/features/feed/feed-category-badge";

/** Matches `AppTabBar` row + bottom inset so the FAB clears the dock. */
const TAB_BAR_ROW_HEIGHT = 48;
const SCROLL_FADE_SIZE = 100;
const EDGE_FADE_EXTRA = 48;
const FAB_END_INSET = 16;

function feedPickerFabBottom(insets: { bottom: number }): number {
  const bottomPad = Math.max(insets.bottom, 8);
  return bottomPad + TAB_BAR_ROW_HEIGHT + 12;
}

type SelectOption = { value: string; label: string };

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
}: {
  category: FeedCategoryDef;
}): JSX.Element {
  const { value: selectedValue } = useSelect();
  const { theme } = useUniwind();
  const isDark = theme === "dark";
  const [foreground, muted] = useThemeColor(["foreground", "muted"]);

  const isSelected =
    !Array.isArray(selectedValue) &&
    selectedValue?.value === category.key;

  const selectedRowClass = isDark
    ? "absolute inset-0 bg-surface shadow-md"
    : "absolute inset-0 bg-surface-secondary shadow-sm";

  const labelBlock =
    category.key === "price-drop" ? (
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
          <View className="ms-2.5">
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
          className={category.color ? "ms-1.5 text-lg text-foreground" : "text-lg text-foreground"}
        >
          {category.label}
        </Typography>
        {category.badge ? (
          <View className="ms-2.5">
            <FeedCategoryBadge label={category.badge} inline />
          </View>
        ) : null}
      </View>
    );

  return (
    <Select.Item
      value={category.key}
      label={category.label}
      className="self-start gap-3 overflow-hidden rounded-2xl py-3 pe-4 ps-4"
    >
      {isSelected ? <View className={selectedRowClass} /> : null}
      {labelBlock}
      <Select.ItemIndicator />
    </Select.Item>
  );
}

function FeedCategoryPickerCloseFab({
  bottomOffset,
}: {
  bottomOffset: number;
}): JSX.Element {
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const { onOpenChange } = useSelect();

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 z-50 items-end"
      style={{ paddingBottom: bottomOffset, paddingEnd: FAB_END_INSET }}
    >
      <Button
        isIconOnly
        size="sm"
        accessibilityLabel="Close categories"
        className="size-9 min-h-9 min-w-9 rounded-full p-0"
        onPress={() => onOpenChange(false)}
      >
        <Ionicons name="close" size={18} color={accentForeground} />
      </Button>
    </View>
  );
}

interface FeedCategoryPickerProps {
  categories: FeedCategoryDef[];
  activeCategory: string;
  onSelect: (key: string) => void;
}

/**
 * Full-screen category list (HeroUI Select dialog), like the native example
 * component demos variant picker — not BottomSheet.
 */
export function FeedCategoryPicker({
  categories,
  activeCategory,
  onSelect,
}: FeedCategoryPickerProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const { theme } = useUniwind();
  const isDark = theme === "dark";
  const backdrop = pageBackdrop(isDark);
  const fabBottom = feedPickerFabBottom(insets);
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 64);
    return () => clearTimeout(id);
  }, [isOpen, categories.length]);

  const selectedOption = useMemo((): SelectOption | undefined => {
    const match = categories.find((c) => c.key === activeCategory);
    return match ? { value: match.key, label: match.label } : undefined;
  }, [activeCategory, categories]);

  const disabled = categories.length <= 1;
  const listBottomPad = insets.bottom + 96;
  const listTopPad = insets.top + 16;
  const topFadeHeight = insets.top + SCROLL_FADE_SIZE + EDGE_FADE_EXTRA;
  const bottomFadeHeight = insets.bottom + SCROLL_FADE_SIZE + EDGE_FADE_EXTRA;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 z-40 items-end"
      style={{ paddingBottom: fabBottom, paddingEnd: FAB_END_INSET }}
    >
      <Select
        presentation="dialog"
        value={selectedOption}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        isDisabled={disabled}
        onValueChange={(next) => {
          if (next == null || Array.isArray(next)) return;
          if (next.value === activeCategory) return;
          onSelect(next.value);
        }}
      >
        <Select.Trigger variant="unstyled" asChild isDisabled={disabled}>
          <Button
            isIconOnly
            size="sm"
            hitSlop={10}
            accessibilityLabel="All feed categories"
            className="size-9 min-h-9 min-w-9 rounded-full p-0"
          >
            <Ionicons name="list" size={16} color={accentForeground} />
          </Button>
        </Select.Trigger>
        <Select.Portal>
          <Select.Overlay style={{ backgroundColor: backdrop }} />
          <Select.Content
            presentation="dialog"
            isSwipeable={false}
            classNames={{
              wrapper: "p-0 justify-start",
              content: "size-full border-0 bg-transparent p-0",
            }}
          >
            <View
              className="relative"
              style={{
                width: screenWidth,
                height: screenHeight,
                backgroundColor: backdrop,
              }}
            >
              <ScrollShadow
                style={{ height: screenHeight, width: screenWidth }}
                LinearGradientComponent={LinearGradient}
                color={backdrop}
                size={SCROLL_FADE_SIZE}
              >
                <ScrollView
                  ref={scrollRef}
                  style={{ height: screenHeight, width: screenWidth }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: "flex-end",
                    paddingTop: listTopPad,
                    paddingBottom: listBottomPad,
                  }}
                >
                  <View className="items-start gap-2 px-4">
                    {categories.map((category) => (
                      <FeedCategorySelectItem
                        key={category.key}
                        category={category}
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
              <FeedCategoryPickerCloseFab bottomOffset={fabBottom} />
            </View>
          </Select.Content>
        </Select.Portal>
      </Select>
    </View>
  );
}
