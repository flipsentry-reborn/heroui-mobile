import type { JSX } from "react";
import { Tabs } from "heroui-native";
import { Badge } from "heroui-native-pro";

import { FeedCategoryBadge } from "@/features/feed/feed-category-badge";

export type FeedTabKey = "for-you" | "quick-filter";

const FEED_TABS: { key: FeedTabKey; label: string; badge?: string }[] = [
  { key: "for-you", label: "For You" },
  { key: "quick-filter", label: "+ Quick Filter", badge: "New" },
];

interface FeedCategoryTabsProps {
  activeTab: FeedTabKey;
  onSelect: (key: FeedTabKey) => void;
}

/**
 * Equal-width tabs (Twitter-style) — no ScrollView; each trigger takes flex-1.
 */
export function FeedCategoryTabs({
  activeTab,
  onSelect,
}: FeedCategoryTabsProps): JSX.Element {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onSelect(value as FeedTabKey)}
      variant="secondary"
      className="w-full gap-0"
    >
      <Tabs.List
        className="w-full flex-row border-0 border-b-0"
        style={{ borderBottomWidth: 0, borderWidth: 0 }}
      >
        <Tabs.Indicator />
        {FEED_TABS.map((tab) => (
          <Tabs.Trigger
            key={tab.key}
            value={tab.key}
            className="min-h-11 flex-1 items-center justify-center px-2 py-2.5"
          >
            {({ isSelected }) => (
              <Badge.Anchor className={tab.badge ? "pr-6" : undefined}>
                <Tabs.Label
                  className={
                    isSelected
                      ? "text-center text-[15px] font-semibold tracking-tight text-foreground"
                      : "text-center text-[15px] font-medium tracking-tight text-muted"
                  }
                >
                  {tab.label}
                </Tabs.Label>
                {tab.badge ? <FeedCategoryBadge label={tab.badge} /> : null}
              </Badge.Anchor>
            )}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs>
  );
}
