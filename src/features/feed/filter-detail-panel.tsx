import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { Pressable, View } from "react-native";
import { Chip, ListGroup, Switch, Typography } from "heroui-native";
import { withUniwind } from "uniwind";

import { FilterActionsMenu } from "@/features/feed/filter-actions-menu";
import { criteriaLabels } from "@/features/feed/filters-screen-utils";
import { SearchBottomSheetRow } from "@/features/home/search-bottom-sheet-row";
import type { UserFilter } from "@/models/user-filter";

const StyledIonicons = withUniwind(Ionicons);

export function FilterDetailPanel({
  filter,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleNotifications,
  actionsLayout = "button",
  showToggles = true,
}: {
  filter: UserFilter;
  onEdit: (filter: UserFilter) => void;
  onDelete: (filter: UserFilter) => void;
  onToggleActive: (filter: UserFilter, selected: boolean) => void;
  onToggleNotifications: (filter: UserFilter, selected: boolean) => void;
  actionsLayout?: "button" | "menu-only";
  showToggles?: boolean;
}): JSX.Element {
  const criteria = criteriaLabels(filter);

  return (
    <View className="gap-2">
      {criteria.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {criteria.map((label, index) => (
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

      {showToggles ? (
        <ListGroup>
          <SearchBottomSheetRow
            icon="power"
            iconClassName={filter.isActive ? "text-emerald-500" : "text-muted"}
            title="Enabled"
            description="Match this filter against new listings."
            showChevron={false}
            isLast={false}
            right={
              <Switch
                isSelected={filter.isActive}
                onSelectedChange={(selected) => onToggleActive(filter, selected)}
                accessibilityLabel="Enabled"
              />
            }
          />
          <SearchBottomSheetRow
            icon="notifications"
            iconClassName={filter.notificationEnabled ? "text-violet-500" : "text-muted"}
            title="Notifications"
            description="Allow alerts for listings matched by this filter."
            showChevron={false}
            isLast
            right={
              <Switch
                isSelected={filter.notificationEnabled}
                onSelectedChange={(selected) => onToggleNotifications(filter, selected)}
                accessibilityLabel="Notifications"
              />
            }
          />
        </ListGroup>
      ) : null}

      {actionsLayout === "button" ? (
        <FilterActionsMenu filter={filter} disabled={false} onEdit={onEdit} onDelete={onDelete} />
      ) : (
        <View className="flex-row justify-end">
          <FilterActionsMenu
            filter={filter}
            disabled={false}
            onEdit={onEdit}
            onDelete={onDelete}
            trigger="icon"
          />
        </View>
      )}
    </View>
  );
}

export function FilterColorStripe({ color }: { color: string }): JSX.Element {
  return (
    <View className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
  );
}

export function FilterFeedSelectControl({
  filter,
  onToggleSelected,
}: {
  filter: UserFilter;
  onToggleSelected: (filter: UserFilter, selected: boolean) => void;
}): JSX.Element {
  return (
    <Pressable
      onPress={() => onToggleSelected(filter, !filter.isSelected)}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityLabel={`Select ${filter.name} for feed`}
      accessibilityState={{ checked: filter.isSelected }}
      className="h-10 w-10 shrink-0 items-center justify-center"
    >
      <StyledIonicons
        name={filter.isSelected ? "checkmark-circle" : "checkmark-circle-outline"}
        size={24}
        className={filter.isSelected ? "text-success" : "text-muted opacity-55"}
      />
    </Pressable>
  );
}
