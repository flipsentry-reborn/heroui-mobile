import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { Tabs, useThemeColor } from "heroui-native";
import { Badge } from "heroui-native-pro";

import { FEED_CATEGORIES, type FeedCategoryKey } from "@/mocks/data/feed";

interface FeedCategoryTabsProps {
  activeCategory: FeedCategoryKey;
  onSelect: (key: FeedCategoryKey) => void;
}

/**
 * Feed filters via HeroUI Tabs (`variant="secondary"` = bottom underline).
 * Page content stays in PagerView; these tabs only change the active category.
 */
export function FeedCategoryTabs({
  activeCategory,
  onSelect,
}: FeedCategoryTabsProps): JSX.Element {
  const warningForeground = useThemeColor("warning-foreground");

  return (
    <Tabs
      value={activeCategory}
      onValueChange={(value) => onSelect(value as FeedCategoryKey)}
      variant="secondary"
      className="w-full gap-0 px-1 pt-1"
    >
      <Tabs.List className="w-full max-w-full gap-1 border-b border-border">
        <Tabs.ScrollView scrollAlign="center">
          <Tabs.Indicator />
          {FEED_CATEGORIES.map((category) => (
            <Tabs.Trigger
              key={category.key}
              value={category.key}
              className="px-4 py-2.5"
            >
              {({ isSelected }) => (
                <>
                  <Tabs.Label
                    className={
                      isSelected
                        ? "text-sm font-medium text-foreground"
                        : "text-sm font-normal text-muted"
                    }
                  >
                    {category.label}
                  </Tabs.Label>
                  {category.badge ? (
                    <Badge
                      color="warning"
                      size="sm"
                      variant="primary"
                      className="flex-row items-center gap-0.5 bg-warning"
                    >
                      {category.badge === "AI" ? (
                        <Ionicons
                          name="sparkles"
                          size={10}
                          color={warningForeground}
                        />
                      ) : null}
                      {category.badge}
                    </Badge>
                  ) : null}
                </>
              )}
            </Tabs.Trigger>
          ))}
        </Tabs.ScrollView>
      </Tabs.List>
    </Tabs>
  );
}
