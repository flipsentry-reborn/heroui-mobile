import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography, useThemeColor } from "heroui-native";
import { Badge } from "heroui-native-pro";

import { FeedCategoryBadge } from "@/features/feed/feed-category-badge";
import {
  FEED_CATEGORIES,
  FOR_YOU_ALL_CHILDREN,
  FOR_YOU_SHELVES,
} from "@/mocks/data/feed";
import { store } from "@/store/store";

export function resolveCategoryMeta(key: string): {
  title: string;
  badge?: string;
} {
  const fromStore =
    store.searchStore.feedCategories.find((c) => c.key === key) ??
    store.searchStore.forYouShelves.find((s) => s.key === key) ??
    store.searchStore.yourSearchChildren.find((c) => c.key === key);
  if (fromStore) return { title: fromStore.label, badge: fromStore.badge };

  const fromTabs = FEED_CATEGORIES.find((c) => c.key === key);
  if (fromTabs) return { title: fromTabs.label, badge: fromTabs.badge };

  const fromShelf = FOR_YOU_SHELVES.find((s) => s.key === key);
  if (fromShelf) return { title: fromShelf.label, badge: fromShelf.badge };

  const fromChild = FOR_YOU_ALL_CHILDREN.find((c) => c.key === key);
  if (fromChild) return { title: fromChild.label };

  return {
    title: key
      .replace(/^(type|custom|group):/, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase()),
  };
}

/** Custom category page header — title + HeroUI Badge.Anchor (same as tabs/shelves). */
export function FeedCategoryHeader({
  title,
  badge,
  onBack,
}: {
  title: string;
  badge?: string;
  onBack: () => void;
}): JSX.Element {
  const insets = useSafeAreaInsets();
  const foreground = useThemeColor("foreground");

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="bg-background"
    >
      <View className="h-11 flex-row items-center px-1.5">
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="h-11 w-11 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={26} color={foreground} />
        </Pressable>

        <View className="min-w-0 flex-1 items-center justify-center pr-11">
          <Badge.Anchor className={badge ? "pr-7" : undefined}>
            <Typography
              type="body"
              weight="semibold"
              numberOfLines={1}
              className="text-[17px] text-foreground"
            >
              {title}
            </Typography>
            {badge ? <FeedCategoryBadge label={badge} /> : null}
          </Badge.Anchor>
        </View>
      </View>
    </View>
  );
}
