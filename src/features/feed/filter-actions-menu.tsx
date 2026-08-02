import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { Pressable } from "react-native";
import { Menu, useThemeColor } from "heroui-native";
import { withUniwind } from "uniwind";

import { BrandButton } from "@/components/ui/brand-button";
import type { UserFilter } from "@/models/user-filter";

const StyledIonicons = withUniwind(Ionicons);

export function FilterActionsMenu({
  filter,
  disabled,
  onEdit,
  onDelete,
  trigger = "button",
}: {
  filter: UserFilter;
  disabled: boolean;
  onEdit: (filter: UserFilter) => void;
  onDelete: (filter: UserFilter) => void;
  trigger?: "button" | "icon";
}): JSX.Element {
  const [accentForeground] = useThemeColor(["accent-foreground"]);

  return (
    <Menu>
      <Menu.Trigger asChild>
        {trigger === "icon" ? (
          <Pressable
            disabled={disabled}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Actions for ${filter.name}`}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-secondary"
          >
            <StyledIonicons name="ellipsis-horizontal" size={20} className="text-foreground" />
          </Pressable>
        ) : (
          <BrandButton className="mt-1 min-h-12 w-full" isDisabled={disabled}>
            <Ionicons name="create" size={18} color={accentForeground} />
            <BrandButton.Label>Actions</BrandButton.Label>
          </BrandButton>
        )}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Overlay className="bg-backdrop" />
        <Menu.Content presentation="popover" width={240} placement="top">
          <Menu.Group>
            <Menu.Item id="edit" onPress={() => onEdit(filter)}>
              <StyledIonicons name="create-outline" size={18} className="text-foreground" />
              <Menu.ItemTitle>Edit</Menu.ItemTitle>
            </Menu.Item>
            <Menu.Item id="delete" variant="danger" onPress={() => onDelete(filter)}>
              <StyledIonicons name="trash-outline" size={18} className="text-danger" />
              <Menu.ItemTitle>Delete</Menu.ItemTitle>
            </Menu.Item>
          </Menu.Group>
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  );
}
