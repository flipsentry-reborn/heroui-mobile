import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Avatar,
  Chip,
  Skeleton,
  Typography,
  useThemeColor,
} from "heroui-native";

import {
  SettingsRow,
  SettingsSection,
} from "@/features/settings/settings-section";
import type { MockUserProfile } from "@/mocks/data/settings";
import { getSettings } from "@/mocks/services/settings";
import { getSubscription } from "@/mocks/services/subscription";

function StatusChip({
  label,
}: {
  label: "Verified" | "Unverified";
}): JSX.Element {
  return (
    <Chip
      size="sm"
      variant="soft"
      color={label === "Verified" ? "success" : "warning"}
    >
      <Chip.Label className="text-[10px]">{label}</Chip.Label>
    </Chip>
  );
}

export default function ProfileScreen(): JSX.Element {
  const [profile, setProfile] = useState<MockUserProfile | null>(null);
  const [planLabel, setPlanLabel] = useState("Free");
  const background = useThemeColor("background");

  useEffect(() => {
    void Promise.all([getSettings(), getSubscription()]).then(
      ([settings, sub]) => {
        setProfile(settings.profile);
        const plan = sub.plans.find((p) => p.id === sub.currentTier);
        setPlanLabel(plan?.displayName ?? "Free");
      },
    );
  }, []);

  if (!profile) {
    return (
      <View className="flex-1 gap-3 bg-background p-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </View>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-10 pt-3"
      style={{ backgroundColor: background }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-4 items-center gap-1.5 px-5">
        <Avatar
          size="lg"
          alt={fullName}
          className="mb-1.5 bg-surface-tertiary"
        >
          <Avatar.Fallback className="bg-surface-tertiary text-foreground">
            {initials}
          </Avatar.Fallback>
        </Avatar>
        <Typography type="body" className="text-[15px] font-normal text-foreground">
          {fullName}
        </Typography>
        <Typography type="body-xs" className="text-xs text-muted">
          {profile.email}
        </Typography>
        <Chip size="sm" variant="soft" color="default" className="mt-1">
          <Chip.Label className="text-[10px]">{planLabel}</Chip.Label>
        </Chip>
      </View>

      <SettingsSection title="Personal">
        <SettingsRow
          icon="person-outline"
          title="First Name"
          description={profile.firstName || "Not provided"}
          showChevron={false}
        />
        <SettingsRow
          icon="person-outline"
          title="Last Name"
          description={profile.lastName || "Not provided"}
          showChevron={false}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Contact">
        <SettingsRow
          icon="mail-outline"
          title="Email"
          description={profile.email || "Not provided"}
          showChevron={false}
          right={
            <StatusChip
              label={profile.emailConfirmed ? "Verified" : "Unverified"}
            />
          }
        />
        <SettingsRow
          icon="call-outline"
          title="Phone Number"
          description={profile.phoneNumber ?? "Not provided"}
          showChevron={false}
          right={
            profile.phoneNumber ? (
              <StatusChip
                label={profile.numberConfirmed ? "Verified" : "Unverified"}
              />
            ) : undefined
          }
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Membership">
        <SettingsRow
          icon="shield-checkmark-outline"
          title="Account Status"
          description="Active"
          showChevron={false}
        />
        <SettingsRow
          icon="calendar-outline"
          title="Member Since"
          description="Jan 12, 2025"
          showChevron={false}
          isLast
        />
      </SettingsSection>

      <View className="mx-5 mb-2">
        <Typography type="body-xs" className="text-muted">
          Profile details are read-only in this mock. Edit flows ship with the
          real account API.
        </Typography>
      </View>
    </ScrollView>
  );
}
