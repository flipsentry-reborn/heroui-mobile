import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import {
  Avatar,
  Chip,
  LinkButton,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";

import { HeroBoltIcon } from "@/features/settings/hero-bolt-icon";
import {
  SettingsRow,
  SettingsSection,
} from "@/features/settings/settings-section";
import { ProfileScreenSkeleton } from "@/features/settings/settings-skeletons";
import { SubscriptionParticleField } from "@/features/settings/subscription-particles";
import {
  PLAN_ACCENTS,
  PLAN_GLOW_GRADIENT,
} from "@/features/settings/subscription-theme";
import { Fonts } from "@/lib/fonts";
import type { MockUserProfile } from "@/mocks/data/settings";
import { getSettings } from "@/mocks/services/settings";
import { useStore } from "@/store/store";

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

const ProfileScreen = observer(function ProfileScreen(): JSX.Element {
  const { userStore, subscriptionStore } = useStore();
  const [profile, setProfile] = useState<MockUserProfile | null>(null);
  const background = useThemeColor("background");
  const { toast } = useToast();

  useEffect(() => {
    void (async () => {
      const [settings] = await Promise.all([
        getSettings(),
        subscriptionStore.load().catch(() => {
          // keep last known subscription
        }),
      ]);
      if (userStore.user) {
        setProfile({
          firstName: userStore.user.firstName,
          lastName: userStore.user.lastName,
          email: userStore.user.email,
          emailConfirmed: userStore.user.emailConfirmed,
          phoneNumber: userStore.user.phoneNumber,
          numberConfirmed: userStore.user.numberConfirmed,
        });
      } else {
        setProfile(settings.profile);
      }
    })();
  }, [userStore.user, subscriptionStore]);

  const copyValue = async (value: string, label: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      await Clipboard.setStringAsync(trimmed);
      toast.show({
        variant: "success",
        label: `${label} copied`,
        duration: 2200,
      });
    } catch {
      toast.show({
        variant: "danger",
        label: "Couldn't copy",
        description: "Try again in a moment.",
        duration: 2500,
      });
    }
  };

  if (!profile || !subscriptionStore.hasLoaded) {
    return (
      <View className="flex-1 bg-background">
        <ProfileScreenSkeleton />
      </View>
    );
  }

  const activePlan = subscriptionStore.activePlan;
  const isTrial = subscriptionStore.hasActiveTrial && activePlan == null;
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
          start={PLAN_GLOW_GRADIENT.start}
          end={PLAN_GLOW_GRADIENT.end}
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
          <LinkButton
            accessibilityRole="button"
            accessibilityLabel="Copy name"
            onPress={() => void copyValue(fullName, "Name")}
            animation={{ scale: { value: 0.97 } }}
            className="h-auto p-0"
          >
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
          </LinkButton>
          <LinkButton
            accessibilityRole="button"
            accessibilityLabel="Copy email"
            onPress={() => void copyValue(profile.email, "Email")}
            animation={{ scale: { value: 0.97 } }}
            className="h-auto p-0"
          >
            <Text
              style={{
                fontFamily: Fonts.headingRegular,
                fontSize: 12,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              {profile.email}
            </Text>
          </LinkButton>
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
          onPress={
            profile.firstName
              ? () => void copyValue(profile.firstName, "First name")
              : undefined
          }
        />
        <SettingsRow
          icon="person-outline"
          title="Last Name"
          description={profile.lastName || "Not provided"}
          showChevron={false}
          onPress={
            profile.lastName
              ? () => void copyValue(profile.lastName, "Last name")
              : undefined
          }
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Contact">
        <SettingsRow
          icon="mail-outline"
          title="Email"
          description={profile.email || "Not provided"}
          showChevron={false}
          onPress={
            profile.email
              ? () => void copyValue(profile.email, "Email")
              : undefined
          }
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
          onPress={
            profile.phoneNumber
              ? () => {
                  const phone = profile.phoneNumber;
                  if (phone) void copyValue(phone, "Phone number");
                }
              : undefined
          }
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
          Tap a field to copy it. Profile details are read-only here.
        </Typography>
      </View>
    </ScrollView>
  );
});

export default ProfileScreen;
