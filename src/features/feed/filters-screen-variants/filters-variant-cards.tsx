import type { JSX } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { Card, Chip, Switch, Typography } from "heroui-native";
import { Badge } from "heroui-native-pro";

import { FilterActionsMenu } from "@/features/feed/filter-actions-menu";
import {
  FilterColorStripe,
  FilterFeedSelectControl,
} from "@/features/feed/filter-detail-panel";
import { collapsedSummary, criteriaLabels } from "@/features/feed/filters-screen-utils";
import {
  FiltersEmptyState,
  FiltersToolbar,
  LoadError,
  SelectedFiltersSection,
  type FiltersScreenController,
} from "@/features/feed/filters-screen-shared";
import type { UserFilter } from "@/models/user-filter";

function FilterCard({
  filter,
  controller,
}: {
  filter: UserFilter;
  controller: FiltersScreenController;
}): JSX.Element {
  return (
    <Card className="overflow-hidden rounded-3xl bg-surface">
      <View className="flex-row items-start gap-2 px-3 pt-3">
        <FilterColorStripe color={filter.color} />
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Typography type="body" weight="semibold" className="min-w-0 flex-1" numberOfLines={1}>
              {filter.name}
            </Typography>
            {!filter.isActive ? (
              <Badge color="warning" variant="soft" size="sm">
                Paused
              </Badge>
            ) : null}
            <FilterActionsMenu
              filter={filter}
              disabled={false}
              onEdit={controller.openEdit}
              onDelete={controller.handleDelete}
              trigger="icon"
            />
          </View>
          <Typography type="body-xs" className="text-muted" numberOfLines={2}>
            {collapsedSummary(filter)}
          </Typography>
        </View>
        <FilterFeedSelectControl
          filter={filter}
          onToggleSelected={controller.handleToggleSelected}
        />
      </View>

      <Card.Body className="gap-3 px-3 pb-4 pt-2">
        <View className="flex-row gap-3">
          <View className="min-w-0 flex-1 gap-1 rounded-2xl bg-surface-secondary px-3 py-2.5">
            <Typography type="body-xs" className="text-muted">
              Matching
            </Typography>
            <Switch
              isSelected={filter.isActive}
              onSelectedChange={(selected) => controller.handleToggleActive(filter, selected)}
              accessibilityLabel="Enabled"
            />
          </View>
          <View className="min-w-0 flex-1 gap-1 rounded-2xl bg-surface-secondary px-3 py-2.5">
            <Typography type="body-xs" className="text-muted">
              Alerts
            </Typography>
            <Switch
              isSelected={filter.notificationEnabled}
              onSelectedChange={(selected) =>
                controller.handleToggleNotifications(filter, selected)
              }
              accessibilityLabel="Notifications"
            />
          </View>
        </View>

        {criteriaLabels(filter).length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {criteriaLabels(filter).map((label, index) => (
              <Chip key={`${label}-${index}`} size="sm" variant="secondary">
                <Chip.Label className="text-[10px] text-muted">{label}</Chip.Label>
              </Chip>
            ))}
          </View>
        ) : (
          <Typography type="body-xs" className="text-muted">
            No optional criteria set.
          </Typography>
        )}
      </Card.Body>
    </Card>
  );
}

export function FiltersVariantCards({
  controller,
}: {
  controller: FiltersScreenController;
}): JSX.Element {
  const { filters, hasFilters, lastError, refreshing, refresh } = controller;

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerClassName="gap-3 pb-6 pt-2"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <FiltersToolbar
        subtitle="All controls on each card — no expanding required."
        onCreate={controller.openCreate}
      />

      {lastError != null ? <LoadError message={lastError} onRetry={controller.retry} /> : null}

      {hasFilters ? (
        <View className="gap-3 px-3">
          {filters.map((filter) => (
            <FilterCard key={filter.id} filter={filter} controller={controller} />
          ))}
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
