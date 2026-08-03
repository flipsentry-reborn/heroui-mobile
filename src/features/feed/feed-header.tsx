import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchField, Typography, useThemeColor } from "heroui-native";
import { Badge } from "heroui-native-pro";

import type { FeedCategoryDef } from "@/features/feed/build-feed-categories";
import { FeedCategoryTabs } from "@/features/feed/feed-category-tabs";
import { useStore } from "@/store/store";

const LOGO = require("../../../assets/images/flipsentry-logo-text-transparent.png");
const LOGO_WIDTH = 132;
const LOGO_HEIGHT = 30;

interface FeedHeaderProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  categories: FeedCategoryDef[];
  activeCategory: string;
  onCategorySelect: (key: string) => void;
  onFiltersPress: () => void;
}

export const FeedHeader = observer(function FeedHeader({
  searchText,
  onSearchChange,
  categories,
  activeCategory,
  onCategorySelect,
  onFiltersPress,
}: FeedHeaderProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const { filterStore } = useStore();
  const [foreground, muted, accentForeground] = useThemeColor([
    "foreground",
    "muted",
    "accent-foreground",
  ]);
  const inputRef = useRef<TextInput>(null);
  const openingRef = useRef(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const activeFilterCount = filterStore.activeFilters.length;
  const filtersActive = activeFilterCount > 0;

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
      className="z-20 bg-background"
    >
      <View className="px-3 pb-0 pt-0.5">
        <View className="h-9 flex-row items-center gap-2.5">
          {searchOpen ? (
            <>
              <View className="flex-1">
                <SearchField
                  value={searchText}
                  onChange={onSearchChange}
                  className="w-full"
                  animation="disable-all"
                >
                  <SearchField.Group className="h-9 rounded-field border border-border bg-surface-secondary">
                    <SearchField.SearchIcon
                      iconProps={{ color: muted, size: 18 }}
                    />
                    <SearchField.Input
                      ref={inputRef}
                      autoFocus
                      placeholder="Search cars, phones"
                      placeholderTextColor={muted}
                      className="text-[15px] font-normal text-foreground"
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
                className="h-9 w-9 items-center justify-center rounded-field bg-surface-secondary"
              >
                <Ionicons name="close" size={18} color={foreground} />
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
              <Badge.Anchor>
                <Pressable
                  onPress={onFiltersPress}
                  accessibilityRole="button"
                  accessibilityLabel={
                    filtersActive
                      ? `Filters, ${activeFilterCount} active`
                      : "Filters"
                  }
                  className={
                    filtersActive
                      ? "h-9 flex-row items-center gap-1.5 rounded-field bg-accent px-3"
                      : "h-9 flex-row items-center gap-1.5 rounded-field border border-border bg-surface-secondary px-3"
                  }
                >
                  <Ionicons
                    name="options-outline"
                    size={16}
                    color={filtersActive ? accentForeground : muted}
                  />
                  <Typography
                    type="body-sm"
                    weight="medium"
                    className={
                      filtersActive
                        ? "text-[13.5px] text-accent-foreground"
                        : "text-[13.5px] text-muted"
                    }
                  >
                    Filters
                  </Typography>
                </Pressable>
                {filtersActive ? (
                  <Badge
                    color="danger"
                    variant="primary"
                    size="sm"
                    placement="top-right"
                  >
                    {activeFilterCount > 99 ? "99+" : activeFilterCount}
                  </Badge>
                ) : null}
              </Badge.Anchor>
              <Pressable
                onPress={openSearch}
                accessibilityRole="button"
                accessibilityLabel="Search listings"
                className="h-9 w-9 items-center justify-center rounded-field border border-border bg-surface-secondary"
              >
                <Ionicons name="search" size={18} color={muted} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      <FeedCategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onSelect={onCategorySelect}
      />
    </View>
  );
});
