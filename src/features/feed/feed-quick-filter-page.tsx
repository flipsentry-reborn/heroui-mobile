import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import {
  Button,
  Switch,
  Typography,
  useToast,
} from "heroui-native";
import { EmptyState } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { FilterBottomSheet } from "@/features/feed/filter-bottom-sheet";
import { showSearchActionProgress } from "@/features/home/search-action-progress-toast";
import type { UserFilter } from "@/models/user-filter";
import { useStore } from "@/store/store";

const StyledIonicons = withUniwind(Ionicons);

/** Manage saved Filters (opened from feed header Filters). */
export const FeedQuickFilterPage = observer(function FeedQuickFilterPage(): JSX.Element {
  const { filterStore } = useStore();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<UserFilter | null>(null);

  useEffect(() => {
    void filterStore.loadFilters();
  }, [filterStore]);

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (filter: UserFilter) => {
    setEditing(filter);
    setSheetOpen(true);
  };

  const handleDelete = useCallback(
    (filter: UserFilter) => {
      showSearchActionProgress(toast, {
        kind: "delete",
        subject: "filter",
        title: filter.name,
        onCommit: () => filterStore.deleteFilter(filter.id),
      });
    },
    [filterStore, toast],
  );

  const handleToggle = useCallback(
    (filter: UserFilter, active: boolean) => {
      showSearchActionProgress(toast, {
        kind: active ? "start" : "pause",
        subject: "filter",
        title: filter.name,
        onCommit: async () => {
          const updated = await filterStore.updateFilter(filter.id, {
            isActive: active,
          });
          return updated != null;
        },
      });
    },
    [filterStore, toast],
  );

  if (!filterStore.hasLoaded && filterStore.loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Typography type="body" className="text-muted">
          Loading filters…
        </Typography>
      </View>
    );
  }

  if (filterStore.filters.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <StyledIonicons
                  name="options-outline"
                  size={20}
                  className="text-muted"
                />
              </EmptyState.Media>
              <EmptyState.Title>Filters</EmptyState.Title>
              <EmptyState.Description>
                Save Vehicle or Custom filters (keywords, price, and more) to
                organize your feed. No location needed.
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button variant="secondary" onPress={openCreate}>
                <Button.Label>Create filter</Button.Label>
              </Button>
            </EmptyState.Content>
          </EmptyState>
        </View>
        <FilterBottomSheet
          isOpen={sheetOpen}
          onOpenChange={setSheetOpen}
          editingFilter={editing}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-4 pb-8 pt-3">
        <View className="mb-3 flex-row items-center justify-between">
          <Typography type="body" weight="semibold" className="text-[17px] text-foreground">
            Your filters
          </Typography>
          <Button variant="secondary" size="sm" onPress={openCreate}>
            <Button.Label>New</Button.Label>
          </Button>
        </View>

        <View className="gap-2">
          {filterStore.filters.map((filter) => (
            <Pressable
              key={filter.id}
              onPress={() => openEdit(filter)}
              className="flex-row items-center gap-3 rounded-xl bg-surface-secondary px-3 py-3"
              accessibilityRole="button"
              accessibilityLabel={`Edit ${filter.name}`}
            >
              <View
                className="h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: filter.color }}
              />
              <View className="min-w-0 flex-1">
                <Typography
                  type="body"
                  weight="semibold"
                  className="text-foreground"
                  numberOfLines={1}
                >
                  {filter.name}
                </Typography>
                <Typography type="body-xs" className="text-muted">
                  {filter.filterType}
                  {filter.notificationEnabled ? " · Notifications on" : " · Muted"}
                </Typography>
              </View>
              <Switch
                isSelected={filter.isActive}
                onSelectedChange={(active) => {
                  handleToggle(filter, active);
                }}
              />
              <Pressable
                onPress={() => {
                  handleDelete(filter);
                }}
                hitSlop={8}
                accessibilityLabel={`Delete ${filter.name}`}
              >
                <StyledIonicons
                  name="trash-outline"
                  size={18}
                  className="text-muted"
                />
              </Pressable>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <FilterBottomSheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        editingFilter={editing}
      />
    </View>
  );
});
