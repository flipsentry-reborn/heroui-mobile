import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet, ListGroup, Separator, Switch, Typography, useThemeColor } from "heroui-native";
import { Badge } from "heroui-native-pro";

import { FilterDetailPanel } from "@/features/feed/filter-detail-panel";
import { collapsedSummary } from "@/features/feed/filters-screen-utils";
import {
  FiltersEmptyState,
  FiltersToolbar,
  LoadError,
  SelectedFiltersSection,
  type FiltersScreenController,
} from "@/features/feed/filters-screen-shared";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import type { UserFilter } from "@/models/user-filter";

function FilterSettingsSheet({
  filter,
  controller,
  onClose,
}: {
  filter: UserFilter;
  controller: FiltersScreenController;
  onClose: () => void;
}): JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <SheetShell visible onClose={onClose}>
      <BottomSheet.Content
        enableDynamicSizing
        className={SHEET_CONTENT_CLASS_NAME}
        backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
        contentContainerClassName={SHEET_CONTENT_CONTAINER_CLASS_NAME}
      >
        <View className="gap-4 px-4 pt-1" style={{ paddingBottom: insets.bottom + 20 }}>
          <View className="flex-row items-center gap-2.5 px-1">
            <View
              className="h-8 w-2 rounded-full"
              style={{ backgroundColor: filter.color }}
            />
            <BottomSheet.Title className="min-w-0 flex-1 text-left text-xl font-bold text-foreground">
              {filter.name}
            </BottomSheet.Title>
            <BottomSheet.Close />
          </View>
          <FilterDetailPanel
            filter={filter}
            onEdit={(f) => {
              onClose();
              controller.openEdit(f);
            }}
            onDelete={(f) => {
              onClose();
              controller.handleDelete(f);
            }}
            onToggleActive={controller.handleToggleActive}
            onToggleNotifications={controller.handleToggleNotifications}
          />
        </View>
      </BottomSheet.Content>
    </SheetShell>
  );
}

export function FiltersVariantSettings({
  controller,
}: {
  controller: FiltersScreenController;
}): JSX.Element {
  const [detailFilter, setDetailFilter] = useState<UserFilter | null>(null);
  const foreground = useThemeColor("foreground");
  const { filters, hasFilters, lastError, refreshing, refresh } = controller;

  return (
    <>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-6 pt-2"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <FiltersToolbar
          subtitle="Tap a row to manage matching, alerts, and criteria."
          onCreate={controller.openCreate}
        />

        {lastError != null ? <LoadError message={lastError} onRetry={controller.retry} /> : null}

        {hasFilters ? (
          <ListGroup className="mx-3 overflow-hidden rounded-3xl bg-surface">
            {filters.map((filter, index) => (
              <View key={filter.id}>
                {index > 0 ? <Separator className="my-0" /> : null}
                <View className="flex-row items-center gap-2 px-3 py-3.5">
                  <Pressable
                    onPress={() => setDetailFilter(filter)}
                    className="min-w-0 flex-1 flex-row items-center gap-3"
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${filter.name}`}
                  >
                    <View
                      className="h-8 w-2 rounded-full"
                      style={{ backgroundColor: filter.color }}
                    />
                    <View className="min-w-0 flex-1">
                      <View className="flex-row items-center gap-2">
                        <Typography type="body" className="min-w-0 flex-1" numberOfLines={1}>
                          {filter.name}
                        </Typography>
                        {filter.isSelected ? (
                          <Badge color="success" variant="soft" size="sm">
                            Feed
                          </Badge>
                        ) : null}
                      </View>
                      <Typography type="body-xs" className="mt-0.5 text-muted" numberOfLines={1}>
                        {collapsedSummary(filter)}
                      </Typography>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={foreground} />
                  </Pressable>
                  <Switch
                    isSelected={filter.isSelected}
                    onSelectedChange={(selected) =>
                      controller.handleToggleSelected(filter, selected)
                    }
                    accessibilityLabel="On feed"
                  />
                </View>
              </View>
            ))}
          </ListGroup>
        ) : lastError == null ? (
          <FiltersEmptyState onCreate={controller.openCreate} />
        ) : null}

        <SelectedFiltersSection
          filters={controller.selectedFilters}
          onDeselect={(filter) => controller.handleToggleSelected(filter, false)}
        />
      </ScrollView>

      {detailFilter != null ? (
        <FilterSettingsSheet
          filter={detailFilter}
          controller={controller}
          onClose={() => setDetailFilter(null)}
        />
      ) : null}
    </>
  );
}
