import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchField, useThemeColor } from "heroui-native";

import {
  FeedCategoryTabs,
  type FeedTabKey,
} from "@/features/feed/feed-category-tabs";

const LOGO = require("../../../assets/images/flipsentry-logo-text-transparent.png");
const LOGO_WIDTH = 132;
const LOGO_HEIGHT = 30;

interface FeedHeaderProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  activeTab?: FeedTabKey;
  onTabSelect: (key: FeedTabKey) => void;
}

export function FeedHeader({
  searchText,
  onSearchChange,
  activeTab = "for-you",
  onTabSelect,
}: FeedHeaderProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const [foreground, muted] = useThemeColor(["foreground", "muted"]);
  const inputRef = useRef<TextInput>(null);
  const openingRef = useRef(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!searchOpen) return;
    const id = setTimeout(() => {
      inputRef.current?.focus();
      openingRef.current = false;
    }, 80);
    return () => clearTimeout(id);
  }, [searchOpen]);

  const openSearch = () => {
    openingRef.current = true;
    setSearchOpen(true);
  };

  /** Collapse field UI; keep typed query so results stay filtered. */
  const collapseSearch = () => {
    setSearchOpen(false);
    Keyboard.dismiss();
  };

  /** Clear query and collapse. */
  const closeSearch = () => {
    onSearchChange("");
    setSearchOpen(false);
    Keyboard.dismiss();
  };

  const handleBlur = () => {
    if (openingRef.current) return;
    setSearchOpen(false);
  };

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="z-20 overflow-hidden bg-background"
    >
      <View className="px-3 pb-0 pt-0.5">
        <View className="h-8 flex-row items-center">
          {searchOpen ? (
            <>
              <View className="flex-1">
                <SearchField
                  value={searchText}
                  onChange={onSearchChange}
                  className="w-full"
                  animation="disable-all"
                >
                  <SearchField.Group className="h-8 rounded-field border border-border bg-surface-secondary">
                    <SearchField.SearchIcon
                      iconProps={{ color: muted, size: 16 }}
                    />
                    <SearchField.Input
                      ref={inputRef}
                      autoFocus
                      placeholder="Search cars, phones"
                      placeholderTextColor={muted}
                      className="text-sm font-normal text-foreground"
                      returnKeyType="search"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onBlur={handleBlur}
                      onSubmitEditing={collapseSearch}
                    />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>
              </View>
              <Pressable
                onPress={closeSearch}
                accessibilityLabel="Clear search"
                className="ml-1.5 h-8 w-8 items-center justify-center rounded-field bg-surface-secondary"
              >
                <Ionicons name="close" size={16} color={foreground} />
              </Pressable>
            </>
          ) : (
            <>
              <View className="justify-center">
                <Image
                  source={LOGO}
                  style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}
                  contentFit="contain"
                  accessibilityLabel="FlipSentry"
                />
              </View>
              <View className="flex-1" />
              <Pressable
                onPress={openSearch}
                accessibilityRole="button"
                accessibilityLabel="Search listings"
                className="h-8 w-8 items-center justify-center rounded-field border border-border bg-surface-secondary"
              >
                <Ionicons name="search" size={16} color={muted} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      <FeedCategoryTabs activeTab={activeTab} onSelect={onTabSelect} />
    </View>
  );
}
