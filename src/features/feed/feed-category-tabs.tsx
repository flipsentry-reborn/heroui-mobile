import type { JSX } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useThemeColor } from "heroui-native";
import { Badge } from "heroui-native-pro";

import { FeedCategoryBadge } from "@/features/feed/feed-category-badge";
import { FEED_CATEGORIES, type FeedCategoryKey } from "@/mocks/data/feed";

interface FeedCategoryTabsProps {
  activeCategory: FeedCategoryKey;
  onSelect: (key: FeedCategoryKey) => void;
}

/**
 * Scrollable category tabs (For You, All, Best's, …).
 * Page content stays in PagerView; these tabs only change the active category.
 */
export function FeedCategoryTabs({
  activeCategory,
  onSelect,
}: FeedCategoryTabsProps): JSX.Element {
  const [muted, segmentForeground] = useThemeColor([
    "muted",
    "segment-foreground",
  ]);

  return (
    <Tabs
      value={activeCategory}
      onValueChange={(value) => onSelect(value as FeedCategoryKey)}
      variant="primary"
      className="w-full gap-0 px-1 pt-1"
    >
      <Tabs.List className="w-full max-w-full gap-0 !bg-background">
        <Tabs.ScrollView scrollAlign="center">
          <Tabs.Indicator />
          {FEED_CATEGORIES.map((category) => (
            <Tabs.Trigger
              key={category.key}
              value={category.key}
              className="min-h-9 px-2.5 py-1.5"
            >
              {({ isSelected }) => {
                const labelColor = isSelected ? segmentForeground : muted;
                const labelClass = isSelected
                  ? "text-[15px] font-semibold tracking-tight text-segment-foreground"
                  : "text-[15px] font-medium tracking-tight text-muted";

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
                          size={14}
                          color={labelColor}
                        />
                      </View>
                    ) : (
                      <Tabs.Label className={labelClass}>
                        {category.label}
                      </Tabs.Label>
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
