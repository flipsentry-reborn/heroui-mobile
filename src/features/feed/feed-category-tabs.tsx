import type { JSX } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useThemeColor } from "heroui-native";
import { Badge } from "heroui-native-pro";

import type { FeedCategoryDef } from "@/features/feed/build-feed-categories";
import { FeedCategoryBadge } from "@/features/feed/feed-category-badge";

interface FeedCategoryTabsProps {
  categories: FeedCategoryDef[];
  activeCategory: string;
  onSelect: (key: string) => void;
}

/**
 * Scrollable category tabs (For You, All, Best's, …).
 * Page content stays in PagerView; these tabs only change the active category.
 */
export function FeedCategoryTabs({
  categories,
  activeCategory,
  onSelect,
}: FeedCategoryTabsProps): JSX.Element {
  const [muted, foreground] = useThemeColor(["muted", "foreground"]);

  return (
    <Tabs
      value={activeCategory}
      onValueChange={(value) => onSelect(value)}
      variant="secondary"
      className="w-full gap-0 px-1 pt-1"
    >
      <Tabs.List className="w-full max-w-full gap-2">
        <Tabs.ScrollView scrollAlign="center" contentContainerClassName="gap-2">
          <Tabs.Indicator />
          {categories.map((category) => (
            <Tabs.Trigger
              key={category.key}
              value={category.key}
              className="min-h-10 px-3 py-2"
            >
              {({ isSelected }) => {
                const labelColor = isSelected ? foreground : muted;
                const labelClass = isSelected
                  ? "text-[16.5px] font-semibold tracking-tight text-foreground"
                  : "text-[16.5px] font-medium tracking-tight text-muted";

                return (
                  <Badge.Anchor
                    className={category.badge ? "pr-6" : undefined}
                  >
                    {category.key === "price-drop" ? (
                      <View className="flex-row items-center gap-0.5">
                        <Tabs.Label className={labelClass}>
                          {category.label}
                        </Tabs.Label>
                        <Ionicons
                          name="arrow-down"
                          size={15}
                          color={labelColor}
                        />
                      </View>
                    ) : (
                      <View className="flex-row items-center gap-1.5">
                        {category.color ? (
                          <View
                            className="h-2.5 w-2.5 rounded-full border border-border"
                            style={{ backgroundColor: category.color }}
                          />
                        ) : null}
                        <Tabs.Label className={labelClass}>
                          {category.label}
                        </Tabs.Label>
                      </View>
                    )}
                    {category.badge ? (
                      <FeedCategoryBadge label={category.badge} />
                    ) : null}
                  </Badge.Anchor>
                );
              }}
            </Tabs.Trigger>
          ))}
        </Tabs.ScrollView>
      </Tabs.List>
    </Tabs>
  );
}
