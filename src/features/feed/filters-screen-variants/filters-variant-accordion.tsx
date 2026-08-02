import type { JSX } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { Accordion, Typography } from "heroui-native";
import { Badge } from "heroui-native-pro";

import { FilterDetailPanel, FilterFeedSelectControl } from "@/features/feed/filter-detail-panel";
import { collapsedSummary } from "@/features/feed/filters-screen-utils";
import {
  FiltersEmptyState,
  FiltersToolbar,
  LoadError,
  SelectedFiltersSection,
  type FiltersScreenController,
} from "@/features/feed/filters-screen-shared";
import type { UserFilter } from "@/models/user-filter";

function FilterAccordionItem({
  filter,
  controller,
}: {
  filter: UserFilter;
  controller: FiltersScreenController;
}): JSX.Element {
  return (
    <Accordion.Item value={filter.id}>
      <Accordion.Trigger className="gap-2 px-3 py-3">
        <View
          className="h-9 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: filter.color }}
        />
        <View className="min-w-0 flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <Typography type="body" className="min-w-0 flex-1" numberOfLines={1}>
              {filter.name}
            </Typography>
            {!filter.isActive ? (
              <Badge color="warning" variant="soft" size="sm">
                Paused
              </Badge>
            ) : null}
          </View>
          <Typography type="body-xs" className="text-muted" numberOfLines={1}>
            {collapsedSummary(filter)}
          </Typography>
        </View>
        <Accordion.Indicator />
        <FilterFeedSelectControl
          filter={filter}
          onToggleSelected={controller.handleToggleSelected}
        />
      </Accordion.Trigger>

      <Accordion.Content className="gap-2 px-3 pb-3 pt-0">
        <FilterDetailPanel
          filter={filter}
          onEdit={controller.openEdit}
          onDelete={controller.handleDelete}
          onToggleActive={controller.handleToggleActive}
          onToggleNotifications={controller.handleToggleNotifications}
        />
      </Accordion.Content>
    </Accordion.Item>
  );
}

export function FiltersVariantAccordion({
  controller,
}: {
  controller: FiltersScreenController;
}): JSX.Element {
  const { filters, hasFilters, lastError, refreshing, refresh } = controller;

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-6 pt-2"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <FiltersToolbar
        subtitle="Expand a filter for toggles. Checkmark adds it to the feed."
        onCreate={controller.openCreate}
      />

      {lastError != null ? <LoadError message={lastError} onRetry={controller.retry} /> : null}

      {hasFilters ? (
        <Accordion
          value={controller.expandedFilter}
          onValueChange={(next: string | string[] | undefined) => {
            const value = Array.isArray(next) ? next[0] : next;
            controller.setExpandedFilter(
              typeof value === "string" && value.length > 0 ? value : undefined,
            );
          }}
          selectionMode="single"
          isCollapsible
          variant="surface"
          className="mx-3 w-auto gap-2"
        >
          {filters.map((filter) => (
            <FilterAccordionItem key={filter.id} filter={filter} controller={controller} />
          ))}
        </Accordion>
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
