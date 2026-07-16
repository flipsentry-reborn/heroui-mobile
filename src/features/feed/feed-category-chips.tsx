import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX } from "react";
import { ScrollView } from "react-native";
import { Chip, useThemeColor } from "heroui-native";

import { FEED_CATEGORIES, type FeedCategoryKey } from "@/mocks/data/feed";

type IonName = ComponentProps<typeof Ionicons>["name"];

const CATEGORY_ICONS: Record<FeedCategoryKey, IonName> = {
  all: "grid-outline",
  "best-picks": "star",
  car: "car-outline",
  iphone: "phone-portrait-outline",
  custom: "ellipse-outline",
  saved: "bookmark-outline",
};

const SHORT_LABEL: Record<FeedCategoryKey, string> = {
  all: "All",
  "best-picks": "Best",
  car: "Cars",
  iphone: "Phones",
  custom: "Other",
  saved: "Saved",
};

interface FeedCategoryChipsProps {
  activeCategory: FeedCategoryKey;
  onSelect: (key: FeedCategoryKey) => void;
}

export function FeedCategoryChips({
  activeCategory,
  onSelect,
}: FeedCategoryChipsProps): JSX.Element {
  const [accentForeground, muted] = useThemeColor(["accent-foreground", "muted"]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-3.5 py-1.5"
    >
      {FEED_CATEGORIES.map((category) => {
        const active = activeCategory === category.key;
        return (
          <Chip
            key={category.key}
            size="sm"
            variant={active ? "primary" : "tertiary"}
            color={active ? "accent" : "default"}
            onPress={() => onSelect(category.key)}
            className={active ? undefined : "border border-border bg-default/80"}
          >
            <Ionicons
              name={CATEGORY_ICONS[category.key]}
              size={13}
              color={active ? accentForeground : muted}
            />
            <Chip.Label
              className={
                active
                  ? "text-[12px] font-semibold text-accent-foreground"
                  : "text-[12px] font-medium text-muted"
              }
            >
              {SHORT_LABEL[category.key]}
            </Chip.Label>
          </Chip>
        );
      })}
    </ScrollView>
  );
}
