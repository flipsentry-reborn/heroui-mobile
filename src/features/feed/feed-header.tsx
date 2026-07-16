import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchField, useThemeColor } from "heroui-native";

import { FeedCategoryTabs } from "@/features/feed/feed-category-tabs";
import type { FeedCategoryKey } from "@/mocks/data/feed";

const LOGO = require("../../../assets/images/flipsentry-logo-text-transparent.png");
const LOGO_WIDTH = 132;
const LOGO_HEIGHT = 30;

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
  const openingRef = useRef(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isExpanded = searchOpen || searchText.length > 0;

  useEffect(() => {
    if (!isExpanded) return;
    const id = setTimeout(() => {
      inputRef.current?.focus();
      openingRef.current = false;
    }, 80);
    return () => clearTimeout(id);
  }, [isExpanded]);

  const openSearch = () => {
    openingRef.current = true;
    setSearchOpen(true);
  };

  const closeSearch = () => {
    onSearchChange("");
    setSearchOpen(false);
    Keyboard.dismiss();
  };

  const handleBlur = () => {
    if (openingRef.current) return;
    if (!searchText.trim()) {
      setSearchOpen(false);
    }
  };

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="z-20 overflow-hidden bg-background"
    >
      <View className="px-3 pb-0.5 pt-1">
        <View className="h-8 flex-row items-center">
          {isExpanded ? (
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
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>
              </View>
              <Pressable
                onPress={closeSearch}
                accessibilityLabel="Close search"
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

      <FeedCategoryTabs
        activeCategory={activeCategory}
        onSelect={onCategorySelect}
      />
    </View>
  );
}
