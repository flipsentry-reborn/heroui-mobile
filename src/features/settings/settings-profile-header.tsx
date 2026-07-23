import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { View } from "react-native";
import { Avatar, Chip, ListGroup, Typography } from "heroui-native";
import { withUniwind } from "uniwind";

import { HeroBoltIcon } from "@/features/settings/hero-bolt-icon";
import {
  NOT_SUBSCRIBED_ICON_STROKE,
  NOT_SUBSCRIBED_PALETTE,
  PLAN_ACCENTS,
} from "@/features/settings/subscription-theme";
import type { MockUserProfile } from "@/mocks/data/settings";
import type { PlanAccent } from "@/mocks/data/subscription";

const StyledIonicons = withUniwind(Ionicons);

interface SettingsProfileHeaderProps {
  profile: MockUserProfile;
  planLabel: string;
  planAccent?: PlanAccent | null;
  onPress: () => void;
}

export function SettingsProfileHeader({
  profile,
  planLabel,
  planAccent = null,
  onPress,
}: SettingsProfileHeaderProps): JSX.Element {
  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const isSubscribed = planAccent != null;
  const palette = isSubscribed
    ? PLAN_ACCENTS[planAccent]
    : NOT_SUBSCRIBED_PALETTE;

  return (
    <View className="mb-4 gap-1.5">
      <Typography type="body-xs" className="mx-5 text-muted">
        Profile
      </Typography>
      <ListGroup className="mx-3">
        <ListGroup.Item className="py-2" onPress={onPress}>
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
              <Chip
                size="sm"
                variant="soft"
                color="default"
                className={
                  isSubscribed
                    ? "flex-row items-center gap-1 px-2"
                    : "flex-row items-center gap-1 border border-black/10 bg-white px-2"
                }
              >
                <HeroBoltIcon
                  from={palette.iconFrom}
                  to={palette.iconTo}
                  boltFill={palette.boltFill}
                  stroke={
                    isSubscribed ? undefined : NOT_SUBSCRIBED_ICON_STROKE
                  }
                  size={12}
                />
                <Chip.Label
                  className={
                    isSubscribed
                      ? "text-[10px]"
                      : "text-[10px] text-black"
                  }
                >
                  {planLabel}
                </Chip.Label>
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
