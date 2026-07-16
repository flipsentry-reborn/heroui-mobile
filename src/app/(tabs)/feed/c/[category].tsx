import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, type JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";

import { FeedCategoryPage } from "@/features/feed/feed-category-page";
import {
  FeedCategoryHeader,
  resolveCategoryMeta,
} from "@/features/feed/feed-category-title";

export default function FeedCategoryScreen(): JSX.Element {
  const router = useRouter();
  const { category: raw } = useLocalSearchParams<{
    category: string | string[];
  }>();
  const category = Array.isArray(raw) ? raw[0] : raw;
  const meta = useMemo(
    () => (category ? resolveCategoryMeta(category) : { title: "Feed" }),
    [category],
  );

  const handlePressItem = useCallback(
    (id: string) => {
      router.push({ pathname: "/listing/[id]", params: { id } });
    },
    [router],
  );

  if (!category) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Typography type="body" className="text-muted">
          Unknown category
        </Typography>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FeedCategoryHeader
        title={meta.title}
        badge={meta.badge}
        onBack={() => router.back()}
      />
      <FeedCategoryPage
        category={category}
        query=""
        onPressItem={handlePressItem}
      />
    </View>
  );
}
