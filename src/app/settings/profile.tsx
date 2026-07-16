import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import {
  Avatar,
  Chip,
  Skeleton,
  Typography,
  useThemeColor,
} from "heroui-native";

import { HeroBoltIcon } from "@/features/settings/hero-bolt-icon";
import {
  SettingsRow,
  SettingsSection,
} from "@/features/settings/settings-section";
import { SubscriptionParticleField } from "@/features/settings/subscription-particles";
import { PLAN_ACCENTS } from "@/features/settings/subscription-theme";
import { Fonts } from "@/lib/fonts";
import type { MockUserProfile } from "@/mocks/data/settings";
import type { SubscriptionPlan } from "@/mocks/data/subscription";
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

const FREE_PALETTE = PLAN_ACCENTS.purple;

export default function ProfileScreen(): JSX.Element {
  const [profile, setProfile] = useState<MockUserProfile | null>(null);
  const [activePlan, setActivePlan] = useState<SubscriptionPlan | null>(null);
  const [isTrial, setIsTrial] = useState(false);
  const background = useThemeColor("background");

  useEffect(() => {
    void Promise.all([getSettings(), getSubscription()]).then(
      ([settings, sub]) => {
        setProfile(settings.profile);
        const plan =
          sub.hasActiveSubscription && sub.currentTier != null
            ? (sub.plans.find((p) => p.id === sub.currentTier) ?? null)
            : null;
        setActivePlan(plan);
        setIsTrial(sub.hasActiveTrial && plan == null);
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
  const palette = activePlan
    ? PLAN_ACCENTS[activePlan.accent]
    : FREE_PALETTE;
  const planLabel =
    activePlan?.displayName ?? (isTrial ? "Trial" : "Free");

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-10 pt-3"
      style={{ backgroundColor: background }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mx-3 mb-4 overflow-hidden rounded-3xl border border-white/10">
        <LinearGradient
          colors={palette.gradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <LinearGradient
          colors={[palette.glow, "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.15, y: 0.9 }}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <SubscriptionParticleField />
        <View className="items-center gap-1.5 px-5 py-6">
          <Avatar
            size="lg"
            alt={fullName}
            className="mb-1.5 bg-white/10"
          >
            <Avatar.Fallback className="bg-white/10 text-white">
              {initials}
            </Avatar.Fallback>
          </Avatar>
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 18,
              lineHeight: 24,
              letterSpacing: -0.3,
              color: "#FFFFFF",
            }}
          >
            {fullName}
          </Text>
          <Text
            style={{
              fontFamily: Fonts.headingRegular,
              fontSize: 12,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            {profile.email}
          </Text>
          <View className="mt-2 flex-row items-center gap-1.5">
            <HeroBoltIcon
              from={palette.iconFrom}
              to={palette.iconTo}
              size={16}
            />
            <Text
              style={{
                fontFamily: Fonts.headingSemi,
                fontSize: 13,
                color: "#FFFFFF",
              }}
            >
              {planLabel}
            </Text>
          </View>
        </View>
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
