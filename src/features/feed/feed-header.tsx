import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchField } from "heroui-native";

import { FeedCategoryChips } from "@/features/feed/feed-category-chips";
import type { FeedCategoryKey } from "@/mocks/data/feed";

const LOGO = require("../../../assets/images/flipsentry-logo-text-transparent.png");
const LOGO_WIDTH = 142;
const COLLAPSED_PILL = 108;
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
    width: interpolate(progress.value, [0, 1], [0, 40]),
    marginLeft: interpolate(progress.value, [0, 1], [0, 8]),
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
    <View style={{ paddingTop: insets.top }} className="z-20 overflow-hidden">
      <BlurView
        intensity={Platform.OS === "ios" ? 42 : 58}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.scrim} />

      <View className="px-4 pb-1 pt-2">
        <View
          className="h-11 flex-row items-center"
          onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View
            style={[logoStyle, styles.logoWrap]}
            pointerEvents={isExpanded ? "none" : "auto"}
          >
            <Image
              source={LOGO}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="FlipSentry"
            />
          </Animated.View>

          <View className="flex-1 flex-row items-center justify-end">
            <Animated.View style={[searchStyle, styles.searchShell]}>
              <Animated.View
                style={[StyleSheet.absoluteFill, collapsedHintStyle]}
                pointerEvents={isExpanded ? "none" : "auto"}
              >
                <Pressable
                  onPress={openSearch}
                  accessibilityRole="button"
                  accessibilityLabel="Search listings"
                  style={styles.collapsedPill}
                >
                  <Ionicons name="search" size={16} color="#B3B3B3" />
                  <Text style={styles.hintText}>Search</Text>
                </Pressable>
              </Animated.View>

              <Animated.View
                style={[fieldStyle, styles.fieldFill]}
                pointerEvents={isExpanded ? "auto" : "none"}
              >
                <SearchField
                  value={searchText}
                  onChange={onSearchChange}
                  className="w-full"
                  animation="disable-all"
                >
                  <SearchField.Group
                    className="h-10 rounded-full"
                    style={styles.searchGroup}
                  >
                    <SearchField.SearchIcon
                      iconProps={{ color: "#B3B3B3", size: 18 }}
                    />
                    <SearchField.Input
                      ref={inputRef}
                      placeholder="Search cars, phones…"
                      placeholderTextColor="#8A8A8A"
                      className="text-[15px]"
                      style={styles.input}
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
              style={[closeStyle, styles.closeWrap]}
              pointerEvents={isExpanded ? "auto" : "none"}
            >
              <Pressable
                onPress={closeSearch}
                accessibilityLabel="Close search"
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </View>

      <FeedCategoryChips activeCategory={activeCategory} onSelect={onCategorySelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(18,18,18,0.42)",
  },
  logoWrap: {
    overflow: "hidden",
    justifyContent: "center",
  },
  logo: {
    width: LOGO_WIDTH,
    height: 32,
  },
  searchShell: {
    height: 40,
    overflow: "hidden",
  },
  collapsedPill: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hintText: {
    color: "#8A8A8A",
    fontSize: 13,
  },
  fieldFill: {
    flex: 1,
    height: 40,
  },
  searchGroup: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  input: {
    color: "#FFFFFF",
  },
  closeWrap: {
    overflow: "hidden",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});
