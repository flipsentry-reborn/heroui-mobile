import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import type { JSX } from "react";
import { useCallback, useState } from "react";
import { Alert, Linking, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  ScrollShadow,
  Skeleton,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import { FAB } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { DeleteAccountSheets } from "@/features/settings/delete-account-sheets";
import { HideListingsSheet } from "@/features/settings/hide-listings-sheet";
import { SettingsProfileHeader } from "@/features/settings/settings-profile-header";
import { SettingsSubscriptionCard } from "@/features/settings/settings-subscription-card";
import {
  SettingsRow,
  SettingsSection,
} from "@/features/settings/settings-section";
import type {
  SettingsState,
  UserPreferences,
} from "@/mocks/data/settings";
import type { SubscriptionPlan } from "@/mocks/data/subscription";
import {
  getSettings,
  mockLogout,
  updatePreferences,
} from "@/mocks/services/settings";
import { getSubscription } from "@/mocks/services/subscription";

const StyledIonicons = withUniwind(Ionicons);

const DISTANCE_UNIT_LABELS = {
  mi: "Mileage",
  km: "Kilometers",
} as const;

function DistanceUnitFab({
  value,
  onChange,
}: {
  value: "mi" | "km";
  onChange: (unit: "mi" | "km") => void;
}): JSX.Element {
  return (
    <FAB placement="top" align="end">
      <FAB.Trigger
        accessibilityLabel={`Distance unit ${DISTANCE_UNIT_LABELS[value]}`}
        className="h-8 w-24 px-3"
        animation={{ rotate: { value: [0, 0, 0] } }}
      >
        <Typography
          type="body-xs"
          weight="bold"
          numberOfLines={1}
          className="text-accent-foreground"
        >
          {DISTANCE_UNIT_LABELS[value]}
        </Typography>
      </FAB.Trigger>
      <FAB.Portal>
        <FAB.Overlay />
        <FAB.Content>
          <FAB.Item onPress={() => onChange("mi")}>Mileage</FAB.Item>
          <FAB.Item onPress={() => onChange("km")}>Kilometers</FAB.Item>
        </FAB.Content>
      </FAB.Portal>
    </FAB>
  );
}

export function SettingsScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast } = useToast();
  const background = useThemeColor("background");
  const [state, setState] = useState<SettingsState | null>(null);
  const [activePlan, setActivePlan] = useState<SubscriptionPlan | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hideOpen, setHideOpen] = useState(false);

  const load = useCallback(async () => {
    const [next, sub] = await Promise.all([getSettings(), getSubscription()]);
    setState(next);
    const plan =
      sub.hasActiveSubscription && sub.currentTier != null
        ? (sub.plans.find((p) => p.id === sub.currentTier) ?? null)
        : null;
    setActivePlan(plan);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const prefs = state?.preferences;
  const planLabel = activePlan?.displayName ?? (state?.hasActiveTrial ? "Trial" : "Free");

  const patchPrefs = async (patch: Partial<UserPreferences>) => {
    try {
      const next = await updatePreferences(patch);
      setState((s) => (s ? { ...s, preferences: next } : s));
    } catch {
      Alert.alert("Error", "Failed to update preference");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          void mockLogout().then(() => {
            toast.show({
              variant: "default",
              label: "Logged out",
              description: "Mock only - no auth in this build.",
              duration: 2500,
            });
          });
        },
      },
    ]);
  };

  const handleRateApp = () => {
    if (Platform.OS === "ios") {
      void Linking.openURL("https://apps.apple.com/app/id6748539654");
    } else {
      void Linking.openURL(
        "https://play.google.com/store/apps/details?id=com.flipsentry",
      );
    }
  };

  const distanceUnit = prefs?.distanceUnit ?? "mi";

  if (!state) {
    return (
      <View
        className="flex-1 bg-background px-3"
        style={{ paddingTop: insets.top + 48 }}
      >
        <Skeleton className="mb-4 h-[88px] rounded-2xl" />
        <Skeleton className="mb-3 h-14 rounded-2xl" />
        <Skeleton className="mb-3 h-14 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-5 pb-3 pt-2">
        <Typography type="h3" weight="bold" className="text-foreground">
          Settings
        </Typography>
      </View>

      <ScrollShadow
        className="flex-1"
        LinearGradientComponent={LinearGradient}
        color={background}
        size={12}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-[110px] pt-2"
        >
          <SettingsProfileHeader
            profile={state.profile}
            planLabel={planLabel}
            planAccent={activePlan?.accent}
            onPress={() => router.push("/settings/profile")}
          />

          <SettingsSubscriptionCard
            plan={activePlan}
            onPress={() => router.push("/settings/subscription")}
          />

          <SettingsSection title="App Preferences">
            <SettingsRow
              icon="notifications-outline"
              title="Notifications"
              description="Alerts for new matching listings"
              onPress={() => router.push("/settings/notification")}
            />
            <SettingsRow
              icon="ban-outline"
              title="Blocked Sellers"
              description="Manage sellers you’ve blocked"
              onPress={() => router.push("/settings/blocked-sellers")}
            />
            <SettingsRow
              icon="eye-off-outline"
              title="Hide listings"
              description="Spam, dealers, damage, and titles"
              onPress={() => setHideOpen(true)}
            />
            <SettingsRow
              icon="resize-outline"
              title="Distance Unit"
              description="Miles or kilometers for vehicle mileage"
              showChevron={false}
              isLast
              right={
                <DistanceUnitFab
                  value={distanceUnit}
                  onChange={(unit) => void patchPrefs({ distanceUnit: unit })}
                />
              }
            />
          </SettingsSection>

          <SettingsSection title="Help & Support">
            <SettingsRow
              icon="star-outline"
              title="Rate App"
              description="Share feedback on the App Store"
              onPress={handleRateApp}
            />
            <SettingsRow
              icon="globe-outline"
              title="Web Version"
              description="Open FlipSentry in your browser"
              onPress={() => void Linking.openURL("https://flipsentry.com/app")}
            />
            <SettingsRow
              icon="chatbubble-ellipses-outline"
              title="Messenger"
              description="Chat with support on Messenger"
              onPress={() => void Linking.openURL("https://m.me/flipsentry")}
            />
            <SettingsRow
              icon="mail-outline"
              title="Email"
              description="Contact support@flipsentry.com"
              onPress={() => void Linking.openURL("mailto:support@flipsentry.com")}
              isLast
            />
          </SettingsSection>

          <SettingsSection title="Legal">
            <SettingsRow
              icon="document-text-outline"
              title="Terms of Service"
              description="Rules for using FlipSentry"
              onPress={() => void Linking.openURL("https://flipsentry.com/terms")}
            />
            <SettingsRow
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              description="How we handle your data"
              onPress={() => void Linking.openURL("https://flipsentry.com/privacy")}
              isLast
            />
          </SettingsSection>

          <SettingsSection title="Danger zone">
            <View className="w-full gap-2 p-3">
              <Button
                variant="danger-soft"
                className="min-h-11 w-full"
                onPress={() => setDeleteOpen(true)}
              >
                <StyledIonicons name="trash-outline" size={15} className="text-danger" />
                <Button.Label className="text-sm">Delete Account</Button.Label>
              </Button>
              <Button
                variant="primary"
                className="min-h-11 w-full bg-accent"
                onPress={handleLogout}
              >
                <StyledIonicons
                  name="log-out-outline"
                  size={15}
                  className="text-accent-foreground"
                />
                <Button.Label className="text-sm text-accent-foreground">Logout</Button.Label>
              </Button>
            </View>
          </SettingsSection>
        </ScrollView>
      </ScrollShadow>

      <DeleteAccountSheets isOpen={deleteOpen} onOpenChange={setDeleteOpen} />

      {prefs ? (
        <HideListingsSheet
          isOpen={hideOpen}
          onOpenChange={setHideOpen}
          prefs={prefs}
          onPatch={(patch) => void patchPrefs(patch)}
        />
      ) : null}
    </View>
  );
}

