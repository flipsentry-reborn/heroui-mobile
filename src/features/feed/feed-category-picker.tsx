import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
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
const PORTAL_UNMOUNT_MS = 350;
const SCROLL_FADE_SIZE = 100;

type SelectOption = { value: string; label: string };

function pageBackdrop(isDark: boolean): string {
  return isDark ? "#000000" : "#ffffff";
}

function FeedCategorySelectItem({
  category,
}: {
  category: FeedCategoryDef;
}): JSX.Element {
  const { value: selectedValue } = useSelect();
  const [foreground, muted] = useThemeColor(["foreground", "muted"]);

  const isSelected =
    !Array.isArray(selectedValue) &&
    selectedValue?.value === category.key;

  return (
    <Select.Item
      value={category.key}
      label={category.label}
      className="w-full gap-3 overflow-hidden rounded-2xl py-3.5 pe-4 ps-4"
    >
      {isSelected ? (
        <View className="absolute inset-0 bg-surface shadow-md" />
      ) : null}
      <View className="min-w-0 flex-1 flex-row items-center gap-2">
        {category.key === "price-drop" ? (
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
        ) : (
          <>
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
              className="text-lg text-foreground"
            >
              {category.label}
            </Typography>
          </>
        )}
        {category.badge ? (
          <FeedCategoryBadge label={category.badge} />
        ) : null}
      </View>
      <Select.ItemIndicator />
    </Select.Item>
  );
}

function FeedCategoryPickerCloseFab(): JSX.Element {
  const insets = useSafeAreaInsets();
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const { onOpenChange } = useSelect();

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 z-50 items-end pe-4"
      style={{ paddingBottom: insets.bottom + 24 }}
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
  const { theme } = useUniwind();
  const isDark = theme === "dark";
  const backdrop = pageBackdrop(isDark);
  const bottomPad = Math.max(insets.bottom, 8);
  const fabBottom = bottomPad + TAB_BAR_ROW_HEIGHT + 12;
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const [isOpen, setIsOpen] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(
    () => () => {
      if (closeTimerRef.current != null) {
        clearTimeout(closeTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isOpen || !portalMounted) return;
    const id = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 48);
    return () => clearTimeout(id);
  }, [isOpen, portalMounted, categories.length]);

  const selectedOption = useMemo((): SelectOption | undefined => {
    const match = categories.find((c) => c.key === activeCategory);
    return match ? { value: match.key, label: match.label } : undefined;
  }, [activeCategory, categories]);

  const disabled = categories.length <= 1;

  const handleOpenChange = (open: boolean) => {
    if (open) {
      if (closeTimerRef.current != null) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setPortalMounted(true);
      requestAnimationFrame(() => setIsOpen(true));
      return;
    }
    setIsOpen(false);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setPortalMounted(false);
    }, PORTAL_UNMOUNT_MS);
  };

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 z-40 items-end pe-4"
      style={{ paddingBottom: fabBottom }}
    >
      <Select
        presentation="dialog"
        value={selectedOption}
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
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
        {portalMounted ? (
          <Select.Portal>
            <Select.Overlay style={{ backgroundColor: backdrop }} />
            <Select.Content
              presentation="dialog"
              isSwipeable={false}
              classNames={{
                wrapper: "flex-1 p-0",
                content: "flex-1 size-full border-0 p-0",
              }}
              style={{ backgroundColor: backdrop }}
            >
              <View
                className="relative flex-1"
                style={{ backgroundColor: backdrop }}
              >
                <ScrollShadow
                  className="flex-1"
                  LinearGradientComponent={LinearGradient}
                  color={backdrop}
                  size={SCROLL_FADE_SIZE}
                >
                  <ScrollView
                    ref={scrollRef}
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerClassName="flex-grow justify-end gap-2 px-4"
                    contentContainerStyle={{
                      paddingTop: insets.top + 16,
                      paddingBottom: insets.bottom + 96,
                    }}
                  >
                    {categories.map((category) => (
                      <FeedCategorySelectItem
                        key={category.key}
                        category={category}
                      />
                    ))}
                  </ScrollView>
                </ScrollShadow>
                <FeedCategoryPickerCloseFab />
              </View>
            </Select.Content>
          </Select.Portal>
        ) : null}
      </Select>
    </View>
  );
}
