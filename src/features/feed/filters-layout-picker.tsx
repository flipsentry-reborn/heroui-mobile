import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { Segment } from "heroui-native-pro";

import {
  FILTERS_LAYOUT_VARIANTS,
  type FiltersLayoutVariantId,
} from "@/features/feed/filters-screen-shared";

export function FiltersLayoutPicker({
  value,
  onChange,
}: {
  value: FiltersLayoutVariantId;
  onChange: (id: FiltersLayoutVariantId) => void;
}): JSX.Element {
  const active = FILTERS_LAYOUT_VARIANTS.find((v) => v.id === value);

  return (
    <View className="border-b border-border bg-surface-secondary/80 px-3 py-3">
      <Typography type="body-xs" weight="semibold" className="mb-2 text-muted">
        Layout preview
      </Typography>
      <Segment value={value} onValueChange={(next) => onChange(next as FiltersLayoutVariantId)}>
        <Segment.Group>
          <Segment.ScrollView>
            <Segment.Indicator />
            {FILTERS_LAYOUT_VARIANTS.map((variant) => (
              <Segment.Item key={variant.id} value={variant.id}>
                <Segment.Label>{variant.label}</Segment.Label>
              </Segment.Item>
            ))}
          </Segment.ScrollView>
        </Segment.Group>
      </Segment>
      {active != null ? (
        <Typography type="body-xs" className="mt-2 text-muted">
          {active.hint}
        </Typography>
      ) : null}
    </View>
  );
}
