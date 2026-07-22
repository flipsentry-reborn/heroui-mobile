import type { JSX } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import { Tabs, useThemeColor } from "heroui-native";
import { Badge } from "heroui-native-pro";

import type { FeedCategoryDef } from "@/features/feed/build-feed-categories";
import { FeedCategoryBadge } from "@/features/feed/feed-category-badge";
import { FeedTabBadge } from "@/features/feed/feed-tab-badge";
import { useStore } from "@/store/store";

interface FeedCategoryTabsProps {
  categories: FeedCategoryDef[];
  activeCategory: string;
  onSelect: (key: string) => void;
}

/**
 * Scrollable category tabs (For You, All, Best's, …).
 * Page content stays in PagerView; these tabs only change the active category.
 */
export const FeedCategoryTabs = observer(function FeedCategoryTabs({
  categories,
  activeCategory,
  onSelect,
}: FeedCategoryTabsProps): JSX.Element {
  const { feedStore } = useStore();
  const [muted, segmentForeground] = useThemeColor([
    "muted",
    "segment-foreground",
  ]);

  return (
    <Tabs
      value={activeCategory}
      onValueChange={(value) => onSelect(value)}
      variant="primary"
      className="w-full gap-0 px-1 pt-1"
    >
      <Tabs.List className="w-full max-w-full gap-0 !bg-background">
        <Tabs.ScrollView scrollAlign="center">
          <Tabs.Indicator />
          {categories.map((category) => {
            const unread = feedStore.unreadCount(category.key);
            return (
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
                      <View className="relative">
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
                        <FeedTabBadge count={unread} />
                      </View>
                      {category.badge ? (
                        <FeedCategoryBadge label={category.badge} />
                      ) : null}
                    </Badge.Anchor>
                  );
                }}
              </Tabs.Trigger>
            );
          })}
        </Tabs.ScrollView>
      </Tabs.List>
    </Tabs>
  );
});
