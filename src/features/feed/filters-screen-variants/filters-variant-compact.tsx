import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { Switch, Typography, useThemeColor } from "heroui-native";
import { Badge, Segment } from "heroui-native-pro";

import { BrandButton } from "@/components/ui/brand-button";
import { FilterActionsMenu } from "@/features/feed/filter-actions-menu";
import { FilterColorStripe } from "@/features/feed/filter-detail-panel";
import { collapsedSummary } from "@/features/feed/filters-screen-utils";
import {
  FiltersEmptyState,
  LoadError,
  SelectedFiltersSection,
  type FiltersScreenController,
} from "@/features/feed/filters-screen-shared";
import type { UserFilter } from "@/models/user-filter";

type SegmentKey = "all" | "selected" | "paused";

function filtersForSegment(filters: UserFilter[], key: SegmentKey): UserFilter[] {
  switch (key) {
    case "selected":
      return filters.filter((f) => f.isSelected);
    case "paused":
      return filters.filter((f) => !f.isActive);
    default:
      return filters;
  }
}

export function FiltersVariantCompact({
  controller,
}: {
  controller: FiltersScreenController;
}): JSX.Element {
  const [segment, setSegment] = useState<SegmentKey>("all");
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const { filters, hasFilters, lastError, refreshing, refresh } = controller;

  const visible = useMemo(() => filtersForSegment(filters, segment), [filters, segment]);

  return (
    <View className="flex-1">
      <SelectedFiltersSection
        filters={controller.selectedFilters}
        onDeselect={(filter) => controller.handleToggleSelected(filter, false)}
        placement="sticky-top"
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-24 pt-3"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View className="mb-3 px-3">
          <Typography type="body" weight="semibold" className="text-foreground">
            Saved filters
          </Typography>
          <Typography type="body-xs" className="mt-0.5 text-muted">
            Segment the list · switch on feed · ⋯ for edit/delete
          </Typography>
        </View>

        {hasFilters ? (
          <View className="mb-4 px-3">
            <Segment
              value={segment}
              onValueChange={(value) => setSegment(value as SegmentKey)}
            >
              <Segment.Group>
                <Segment.Indicator />
                <Segment.Item value="all">
                  <Segment.Label>All</Segment.Label>
                </Segment.Item>
                <Segment.Item value="selected">
                  <Segment.Label>Feed</Segment.Label>
                </Segment.Item>
                <Segment.Item value="paused">
                  <Segment.Label>Paused</Segment.Label>
                </Segment.Item>
              </Segment.Group>
            </Segment>
          </View>
        ) : null}

        {lastError != null ? <LoadError message={lastError} onRetry={controller.retry} /> : null}

        {hasFilters ? (
          <View className="gap-0 px-3">
            {visible.length === 0 ? (
              <Typography type="body-sm" className="py-8 text-center text-muted">
                No filters in this group.
              </Typography>
            ) : (
              visible.map((filter) => (
                <View
                  key={filter.id}
                  className="flex-row items-center gap-2 border-b border-border py-3"
                >
                  <Pressable
                    onPress={() => controller.openEdit(filter)}
                    className="min-w-0 flex-1 flex-row items-center gap-2"
                    accessibilityRole="button"
                  >
                    <FilterColorStripe color={filter.color} />
                    <View className="min-w-0 flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Typography
                          type="body-sm"
                          weight="medium"
                          numberOfLines={1}
                          className="flex-1"
                        >
                          {filter.name}
                        </Typography>
                        {!filter.isActive ? (
                          <Badge color="warning" variant="soft" size="sm">
                            Off
                          </Badge>
                        ) : null}
                      </View>
                      <Typography type="body-xs" className="text-muted" numberOfLines={1}>
                        {collapsedSummary(filter)}
                      </Typography>
                    </View>
                  </Pressable>
                  <Switch
                    isSelected={filter.isSelected}
                    onSelectedChange={(selected) =>
                      controller.handleToggleSelected(filter, selected)
                    }
                    accessibilityLabel="On feed"
                  />
                  <FilterActionsMenu
                    filter={filter}
                    disabled={false}
                    onEdit={controller.openEdit}
                    onDelete={controller.handleDelete}
                    trigger="icon"
                  />
                </View>
              ))
            )}
          </View>
        ) : lastError == null ? (
          <FiltersEmptyState onCreate={controller.openCreate} />
        ) : null}
      </ScrollView>

      <BrandButton
        className="absolute bottom-28 right-4 h-14 w-14 !rounded-full"
        onPress={controller.openCreate}
        accessibilityLabel="Create filter"
      >
        <Ionicons name="add" size={26} color={accentForeground} />
      </BrandButton>
    </View>
  );
}
