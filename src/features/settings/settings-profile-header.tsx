import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { View } from "react-native";
import {
  Avatar,
  Chip,
  ListGroup,
  Typography,
} from "heroui-native";
import { withUniwind } from "uniwind";

import type { MockUserProfile } from "@/mocks/data/settings";

const StyledIonicons = withUniwind(Ionicons);

interface SettingsProfileHeaderProps {
  profile: MockUserProfile;
  planLabel: string;
  onPress: () => void;
}

export function SettingsProfileHeader({
  profile,
  planLabel,
  onPress,
}: SettingsProfileHeaderProps): JSX.Element {
  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <View className="mb-4 gap-1.5">
      <Typography type="body-xs" className="mx-5 text-muted">
        Profile
      </Typography>
      <ListGroup variant="secondary" className="mx-3">
        <ListGroup.Item onPress={onPress} className="py-2">
          <ListGroup.ItemPrefix>
            <Avatar size="md" alt={fullName} className="bg-surface-tertiary">
              <Avatar.Fallback className="bg-surface-tertiary text-foreground">
                {initials}
              </Avatar.Fallback>
            </Avatar>
          </ListGroup.ItemPrefix>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle className="text-[15px] font-normal text-foreground">
              {fullName}
            </ListGroup.ItemTitle>
            <ListGroup.ItemDescription className="text-xs text-muted">
              {profile.email}
            </ListGroup.ItemDescription>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix>
            <View className="flex-row items-center gap-2">
              <Chip size="sm" variant="soft" color="default">
                <Chip.Label className="text-[10px]">{planLabel}</Chip.Label>
              </Chip>
              <StyledIonicons
                name="chevron-forward"
                size={18}
                className="text-muted"
              />
            </View>
          </ListGroup.ItemSuffix>
        </ListGroup.Item>
      </ListGroup>
    </View>
  );
}
