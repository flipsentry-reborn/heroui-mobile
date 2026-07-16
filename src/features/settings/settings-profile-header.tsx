import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { View } from "react-native";
import {
  Avatar,
  Chip,
  PressableFeedback,
  Surface,
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
    <PressableFeedback
      onPress={onPress}
      className="mx-3 mb-4 overflow-hidden rounded-2xl"
      animation={{ scale: { value: 0.985 } }}
    >
      <Surface variant="secondary" className="overflow-hidden rounded-2xl p-0">
        <View className="flex-row items-center gap-3 p-4">
          <Avatar size="lg" alt={fullName} className="bg-surface-tertiary">
            <Avatar.Fallback className="bg-surface-tertiary text-foreground">
              {initials}
            </Avatar.Fallback>
          </Avatar>
          <View className="min-w-0 flex-1 gap-1">
            <Typography
              type="body-sm"
              weight="semibold"
              className="text-[17px] text-foreground"
              numberOfLines={1}
            >
              {fullName}
            </Typography>
            <Typography type="body-xs" className="text-muted" numberOfLines={1}>
              {profile.email}
            </Typography>
            <Chip size="sm" variant="soft" color="default" className="mt-0.5 self-start">
              <Chip.Label>{planLabel}</Chip.Label>
            </Chip>
          </View>
          <StyledIonicons name="chevron-forward" size={18} className="text-muted" />
        </View>
      </Surface>
      <PressableFeedback.Highlight />
    </PressableFeedback>
  );
}
