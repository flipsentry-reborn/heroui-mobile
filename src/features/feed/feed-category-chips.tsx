import type { JSX } from "react";
import { ScrollView } from "react-native";
import { Chip, PressableFeedback } from "heroui-native";

import { FEED_CATEGORIES, type FeedCategoryKey } from "@/mocks/data/feed";

interface FeedCategoryChipsProps {
  activeCategory: FeedCategoryKey;
  onSelect: (key: FeedCategoryKey) => void;
}

export function FeedCategoryChips({
  activeCategory,
  onSelect,
}: FeedCategoryChipsProps): JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}
    >
      {FEED_CATEGORIES.map((category) => {
        const active = activeCategory === category.key;
        return (
          <PressableFeedback
            key={category.key}
            onPress={() => onSelect(category.key)}
            animation={{ scale: { value: 0.96 } }}
          >
            <Chip
              size="md"
              variant={active ? "primary" : "soft"}
              color={active ? "accent" : "default"}
              className={active ? undefined : "bg-default"}
            >
              <Chip.Label className={active ? "text-accent-foreground" : "text-foreground"}>
                {category.label}
              </Chip.Label>
            </Chip>
          </PressableFeedback>
        );
      })}
    </ScrollView>
  );
}
