import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, TextInput, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchField, Typography, useThemeColor } from "heroui-native";

import { FeedCategoryChips } from "@/features/feed/feed-category-chips";
import type { FeedCategoryKey } from "@/mocks/data/feed";

const LOGO = require("../../../assets/images/flipsentry-logo-text-transparent.png");
const LOGO_WIDTH = 114;
const COLLAPSED_PILL = 92;
const TIMING = { duration: 320, easing: Easing.bezier(0.22, 1, 0.36, 1) };

interface FeedHeaderProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  activeCategory: FeedCategoryKey;
  onCategorySelect: (key: FeedCategoryKey) => void;
}

export function FeedHeader({
  searchText,
  onSearchChange,
  activeCategory,
  onCategorySelect,
}: FeedHeaderProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const [foreground, muted] = useThemeColor(["foreground", "muted"]);
  const inputRef = useRef<TextInput>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [rowWidth, setRowWidth] = useState(0);
  const progress = useSharedValue(0);

  const isExpanded = searchOpen || searchText.length > 0;

  useEffect(() => {
    progress.value = withTiming(isExpanded ? 1 : 0, TIMING);
  }, [isExpanded, progress]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.55], [1, 0]),
    width: interpolate(progress.value, [0, 1], [LOGO_WIDTH, 0]),
    marginRight: interpolate(progress.value, [0, 1], [10, 0]),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [0, -16]) }],
  }));

  const searchStyle = useAnimatedStyle(() => {
    const collapsed = COLLAPSED_PILL;
    const expanded = Math.max(rowWidth - 48, collapsed);
    return {
      width: interpolate(progress.value, [0, 1], [collapsed, expanded]),
    };
  });

  const collapsedHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35], [1, 0]),
  }));

  const fieldStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.25, 0.75], [0, 1]),
  }));

  const closeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.45, 1], [0, 1]),
    width: interpolate(progress.value, [0, 1], [0, 32]),
    marginLeft: interpolate(progress.value, [0, 1], [0, 6]),
  }));

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 180);
  };

  const closeSearch = () => {
    onSearchChange("");
    setSearchOpen(false);
    Keyboard.dismiss();
  };

  const handleBlur = () => {
    if (!searchText.trim()) {
      setSearchOpen(false);
    }
  };

  return (
    <View style={{ paddingTop: insets.top }} className="z-20 overflow-hidden bg-background">
      <View className="px-3.5 pb-0.5 pt-1.5">
        <View
          className="h-9 flex-row items-center"
          onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View
            style={logoStyle}
            className="justify-center overflow-hidden"
            pointerEvents={isExpanded ? "none" : "auto"}
          >
            <Image
              source={LOGO}
              style={{ width: LOGO_WIDTH, height: 26 }}
              contentFit="contain"
              accessibilityLabel="FlipSentry"
            />
          </Animated.View>

          <View className="flex-1 flex-row items-center justify-end">
            <Animated.View style={searchStyle} className="h-8 overflow-hidden">
              <Animated.View
                style={collapsedHintStyle}
                className="absolute inset-0"
                pointerEvents={isExpanded ? "none" : "auto"}
              >
                <Pressable
                  onPress={openSearch}
                  accessibilityRole="button"
                  accessibilityLabel="Search listings"
                  className="h-8 flex-1 flex-row items-center gap-1.5 rounded-full border border-border bg-surface-secondary px-3"
                >
                  <Ionicons name="search" size={14} color={muted} />
                  <Typography type="body-xs" className="text-[12px] text-muted">
                    Search
                  </Typography>
                </Pressable>
              </Animated.View>

              <Animated.View
                style={fieldStyle}
                className="h-8 flex-1"
                pointerEvents={isExpanded ? "auto" : "none"}
              >
                <SearchField
                  value={searchText}
                  onChange={onSearchChange}
                  className="w-full"
                  animation="disable-all"
                >
                  <SearchField.Group className="h-8 rounded-full border border-border bg-surface-secondary">
                    <SearchField.SearchIcon
                      iconProps={{ color: muted, size: 15 }}
                    />
                    <SearchField.Input
                      ref={inputRef}
                      placeholder="Search cars, phones…"
                      placeholderTextColor={muted}
                      className="text-[13px] text-foreground"
                      returnKeyType="search"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onBlur={handleBlur}
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>
              </Animated.View>
            </Animated.View>

            <Animated.View
              style={closeStyle}
              className="overflow-hidden"
              pointerEvents={isExpanded ? "auto" : "none"}
            >
              <Pressable
                onPress={closeSearch}
                accessibilityLabel="Close search"
                className="h-8 w-8 items-center justify-center rounded-full bg-surface-secondary"
              >
                <Ionicons name="close" size={16} color={foreground} />
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </View>

      <FeedCategoryChips activeCategory={activeCategory} onSelect={onCategorySelect} />
    </View>
  );
}
