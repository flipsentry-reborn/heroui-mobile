import type { JSX } from "react";
import { ScrollView } from "react-native";
import { Chip } from "heroui-native";
import { Badge } from "heroui-native-pro";

import { FEED_CATEGORIES, type FeedCategoryKey } from "@/mocks/data/feed";

interface FeedCategoryChipsProps {
  activeCategory: FeedCategoryKey;
  onSelect: (key: FeedCategoryKey) => void;
}

function CategoryChip({
  label,
  active,
  badge,
  onPress,
}: {
  label: string;
  active: boolean;
  badge?: string;
  onPress: () => void;
}): JSX.Element {
  const chip = (
    <Chip
      size="sm"
      variant={active ? "primary" : "secondary"}
      color={active ? "accent" : "default"}
      onPress={onPress}
      className="h-8 px-3"
    >
      <Chip.Label className="text-sm font-normal">{label}</Chip.Label>
    </Chip>
  );

  if (!badge) return chip;

  // HeroUI Pro Badge example pattern (Badge.Anchor + Badge label)
  return (
    <Badge.Anchor>
      {chip}
      <Badge color="success" size="sm" variant="primary" className="bg-success">
        {badge}
      </Badge>
    </Badge.Anchor>
  );
}

export function FeedCategoryChips({
  activeCategory,
  onSelect,
}: FeedCategoryChipsProps): JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-3 py-2"
    >
      {FEED_CATEGORIES.map((category) => (
        <CategoryChip
          key={category.key}
          label={category.label}
          badge={category.badge}
          active={activeCategory === category.key}
          onPress={() => onSelect(category.key)}
        />
      ))}
    </ScrollView>
  );
}
