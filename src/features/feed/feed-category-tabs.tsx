import type { JSX } from "react";
import { Tabs } from "heroui-native";
import { Badge } from "heroui-native-pro";

import { FeedCategoryBadge } from "@/features/feed/feed-category-badge";
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
                <Badge.Anchor
                  className={category.badge ? "pr-7" : undefined}
                >
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
                    <FeedCategoryBadge label={category.badge} />
                  ) : null}
                </Badge.Anchor>
              )}
            </Tabs.Trigger>
          ))}
        </Tabs.ScrollView>
      </Tabs.List>
    </Tabs>
  );
}
