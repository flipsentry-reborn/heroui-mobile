import type { JSX } from "react";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { Tabs, Typography } from "heroui-native";
import { Badge } from "heroui-native-pro";

import { FilterActionsMenu } from "@/features/feed/filter-actions-menu";
import {
  FilterColorStripe,
  FilterDetailPanel,
  FilterFeedSelectControl,
} from "@/features/feed/filter-detail-panel";
import { collapsedSummary } from "@/features/feed/filters-screen-utils";
import {
  FiltersEmptyState,
  FiltersToolbar,
  LoadError,
  SelectedFiltersSection,
  type FiltersScreenController,
} from "@/features/feed/filters-screen-shared";
import type { UserFilter } from "@/models/user-filter";

type TabKey = "all" | "feed" | "paused";

function filterForTab(filters: UserFilter[], tab: TabKey): UserFilter[] {
  switch (tab) {
    case "feed":
      return filters.filter((f) => f.isSelected);
    case "paused":
      return filters.filter((f) => !f.isActive);
    default:
      return filters;
  }
}

function FilterTabRow({
  filter,
  controller,
  expanded,
  onToggleExpand,
}: {
  filter: UserFilter;
  controller: FiltersScreenController;
  expanded: boolean;
  onToggleExpand: () => void;
}): JSX.Element {
  return (
    <View className="overflow-hidden rounded-2xl bg-surface">
      <View className="flex-row items-center gap-2 px-3 py-3">
        <FilterColorStripe color={filter.color} />
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Typography type="body" weight="medium" className="min-w-0 flex-1" numberOfLines={1}>
              {filter.name}
            </Typography>
            {filter.isSelected ? (
              <Badge color="success" variant="soft" size="sm">
                Feed
              </Badge>
            ) : null}
            {!filter.isActive ? (
              <Badge color="warning" variant="soft" size="sm">
                Paused
              </Badge>
            ) : null}
          </View>
          <Typography type="body-xs" className="mt-0.5 text-muted" numberOfLines={1}>
            {collapsedSummary(filter)}
          </Typography>
        </View>
        <FilterFeedSelectControl
          filter={filter}
          onToggleSelected={controller.handleToggleSelected}
        />
        <FilterActionsMenu
          filter={filter}
          disabled={false}
          onEdit={controller.openEdit}
          onDelete={controller.handleDelete}
          trigger="icon"
        />
      </View>
      {expanded ? (
        <View className="border-t border-border px-3 pb-3 pt-2">
          <FilterDetailPanel
            filter={filter}
            onEdit={controller.openEdit}
            onDelete={controller.handleDelete}
            onToggleActive={controller.handleToggleActive}
            onToggleNotifications={controller.handleToggleNotifications}
            actionsLayout="button"
          />
        </View>
      ) : (
        <Pressable onPress={onToggleExpand} className="px-3 pb-3" accessibilityRole="button">
          <Typography type="body-xs" className="text-accent">
            Show details
          </Typography>
        </Pressable>
      )}
    </View>
  );
}

export function FiltersVariantTabs({
  controller,
}: {
  controller: FiltersScreenController;
}): JSX.Element {
  const [tab, setTab] = useState<TabKey>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { filters, hasFilters, lastError, refreshing, refresh } = controller;

  const visible = useMemo(() => filterForTab(filters, tab), [filters, tab]);

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-6 pt-2"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <FiltersToolbar
        subtitle="Use tabs to focus the list, then expand a row for toggles."
        onCreate={controller.openCreate}
      />

      {hasFilters ? (
        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value as TabKey);
            setExpandedId(null);
          }}
          variant="secondary"
          className="mb-3 px-3"
        >
          <Tabs.List className="w-full">
            <Tabs.Indicator />
            <Tabs.Trigger value="all" className="flex-1 py-2">
              <Tabs.Label>All</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="feed" className="flex-1 py-2">
              <Tabs.Label>On feed</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="paused" className="flex-1 py-2">
              <Tabs.Label>Paused</Tabs.Label>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      ) : null}

      {lastError != null ? <LoadError message={lastError} onRetry={controller.retry} /> : null}

      {hasFilters ? (
        <View className="gap-2 px-3">
          {visible.length === 0 ? (
            <View className="rounded-2xl bg-surface px-4 py-8">
              <Typography type="body-sm" className="text-center text-muted">
                Nothing in this tab yet.
              </Typography>
            </View>
          ) : (
            visible.map((filter) => (
              <FilterTabRow
                key={filter.id}
                filter={filter}
                controller={controller}
                expanded={expandedId === filter.id}
                onToggleExpand={() =>
                  setExpandedId((current) => (current === filter.id ? null : filter.id))
                }
              />
            ))
          )}
        </View>
      ) : lastError == null ? (
        <FiltersEmptyState onCreate={controller.openCreate} />
      ) : null}

      <SelectedFiltersSection
        filters={controller.selectedFilters}
        onDeselect={(filter) => controller.handleToggleSelected(filter, false)}
      />
    </ScrollView>
  );
}
