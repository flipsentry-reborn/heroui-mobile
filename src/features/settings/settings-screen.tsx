import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useCallback, useState } from "react";
import { Alert, Linking, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  ScrollShadow,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";
import { FAB } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { DeleteAccountSheets } from "@/features/settings/delete-account-sheets";
import { HideListingsSheet } from "@/features/settings/hide-listings-sheet";
import { LayoutSelect } from "@/features/settings/layout-select";
import { SettingsProfileHeader } from "@/features/settings/settings-profile-header";
import { SettingsScreenSkeleton } from "@/features/settings/settings-skeletons";
import { SettingsSubscriptionCard } from "@/features/settings/settings-subscription-card";
import {
  SettingsRow,
  SettingsSection,
} from "@/features/settings/settings-section";
import { ThemeSelect } from "@/features/settings/theme-select";
import {
  applyAppearance,
  loadCachedAppearance,
  saveCachedAppearance,
  type AppearanceMode,
} from "@/lib/appearance";
import { toUserErrorMessage } from "@/lib/user-error-message";
import type {
  SettingsState,
  UserPreferences,
} from "@/mocks/data/settings";
import { useStore } from "@/store/store";

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

export const SettingsScreen = observer(function SettingsScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast } = useToast();
  const background = useThemeColor("background");
  const { userStore, subscriptionStore, feedStore, onboardingStore } =
    useStore();
  const [state, setState] = useState<SettingsState | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hideOpen, setHideOpen] = useState(false);
  const [resettingOnboarding, setResettingOnboarding] = useState(false);

  const load = useCallback(async () => {
    const appearance = (await loadCachedAppearance()) ?? "dark";
    applyAppearance(appearance);

    await Promise.all([
      subscriptionStore.load().catch(() => {
        // keep last known subscription
      }),
      userStore.loadPreferences().catch(() => {
        // keep last known prefs
      }),
    ]);

    const apiPrefs = userStore.preferences;
    const next: SettingsState = {
      preferences: {
        showScams: apiPrefs?.showScams ?? false,
        showDealers: apiPrefs?.showDealers ?? false,
        showDealerships: apiPrefs?.showDealerships ?? false,
        showMajorDamaged: apiPrefs?.showMajorIssue ?? false,
        showRebuiltTitle: apiPrefs?.showRebuiltTitle ?? false,
        showSalvageTitle: apiPrefs?.showSalvageTitle ?? false,
        distanceUnit: apiPrefs?.distanceUnit ?? "mi",
        appearance,
      },
      refundSaver: {
        preference: "no_preference",
        collectingRefundDataConsent: true,
      },
      hasActiveSubscription: subscriptionStore.hasActiveSubscription,
      hasActiveTrial: subscriptionStore.hasActiveTrial,
      profile: {
        firstName: userStore.user?.firstName ?? "Hunter",
        lastName: userStore.user?.lastName ?? "",
        email: userStore.user?.email ?? "",
        emailConfirmed: userStore.user?.emailConfirmed ?? false,
        phoneNumber: userStore.user?.phoneNumber ?? null,
        numberConfirmed: userStore.user?.numberConfirmed ?? false,
      },
    };
    setState(next);
  }, [subscriptionStore, userStore]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const prefs = state?.preferences;
  const activePlan = subscriptionStore.activePlan;
  const planLabel =
    activePlan?.displayName ??
    (subscriptionStore.hasActiveTrial || state?.hasActiveTrial
      ? "Trial"
      : "Not subscribed");
  const appearance: AppearanceMode = prefs?.appearance ?? "system";
  const profile = userStore.user
    ? {
        firstName: userStore.user.firstName ?? "",
        lastName: userStore.user.lastName ?? "",
        email: userStore.user.email ?? "",
        emailConfirmed: userStore.user.emailConfirmed,
        phoneNumber: userStore.user.phoneNumber,
        numberConfirmed: userStore.user.numberConfirmed,
      }
    : state?.profile;
  const showSkeleton = state == null || !subscriptionStore.hasLoaded;

  const patchPrefs = async (patch: Partial<UserPreferences>) => {
    try {
      if (patch.appearance !== undefined) {
        applyAppearance(patch.appearance);
        await saveCachedAppearance(patch.appearance);
      }

      setState((s) =>
        s ? { ...s, preferences: { ...s.preferences, ...patch } } : s,
      );

      const current = state?.preferences;
      const merged: UserPreferences = {
        showScams: patch.showScams ?? current?.showScams ?? false,
        showDealers: patch.showDealers ?? current?.showDealers ?? false,
        showDealerships:
          patch.showDealerships ?? current?.showDealerships ?? false,
        showMajorDamaged:
          patch.showMajorDamaged ?? current?.showMajorDamaged ?? false,
        showRebuiltTitle:
          patch.showRebuiltTitle ?? current?.showRebuiltTitle ?? false,
        showSalvageTitle:
          patch.showSalvageTitle ?? current?.showSalvageTitle ?? false,
        distanceUnit: patch.distanceUnit ?? current?.distanceUnit ?? "mi",
        appearance: patch.appearance ?? current?.appearance ?? "dark",
      };

      const apiBase = userStore.preferences ?? {
        showScams: merged.showScams,
        showDealers: merged.showDealers,
        showAdvertised: true,
        showDealerships: merged.showDealerships,
        showMajorIssue: merged.showMajorDamaged,
        showRebuiltTitle: merged.showRebuiltTitle,
        showSalvageTitle: merged.showSalvageTitle,
        distanceUnit: merged.distanceUnit,
      };
      await userStore.updatePreferences({
        ...apiBase,
        showScams: merged.showScams,
        showDealers: merged.showDealers,
        showDealerships: merged.showDealerships,
        showMajorIssue: merged.showMajorDamaged,
        showRebuiltTitle: merged.showRebuiltTitle,
        showSalvageTitle: merged.showSalvageTitle,
        distanceUnit: merged.distanceUnit,
      });
    } catch (error) {
      Alert.alert("Error", toUserErrorMessage(error));
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          void userStore.logout().then(() => {
            toast.show({
              variant: "default",
              label: "Logged out",
              duration: 2200,
            });
          });
        },
      },
    ]);
  };

  const handleReplayOnboarding = () => {
    Alert.alert(
      "Replay onboarding",
      "Deletes all your searches and opens the first-time wizard. Dev only.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset & start",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setResettingOnboarding(true);
              try {
                await onboardingStore.resetAndStartWizard();
                router.replace("/(onboarding)/what" as Href);
              } catch (error) {
                toast.show({
                  variant: "danger",
                  label:
                    error instanceof Error
                      ? error.message
                      : "Could not reset onboarding",
                  duration: 3200,
                });
              } finally {
                setResettingOnboarding(false);
              }
            })();
          },
        },
      ],
    );
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
  const layoutMode = feedStore.layoutMode;

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
          {showSkeleton ? (
            <SettingsScreenSkeleton />
          ) : (
            <>
          <SettingsProfileHeader
            profile={profile ?? state!.profile}
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
              icon="contrast-outline"
              title="Appearance"
              description="Light, dark or system"
              showChevron={false}
              right={
                <ThemeSelect
                  value={appearance}
                  onChange={(mode) => void patchPrefs({ appearance: mode })}
                />
              }
            />
            <SettingsRow
              icon="notifications-outline"
              title="Notifications"
              description="Push alerts and quiet hours"
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
              icon="grid-outline"
              title="Feed layout"
              description={
                layoutMode === "list" ? "1 column" : "2 columns"
              }
              showChevron={false}
              right={
                <LayoutSelect
                  value={layoutMode}
                  onChange={(mode) => feedStore.setLayoutMode(mode)}
                />
              }
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
              icon="help-circle-outline"
              title="Help Center"
              description="Guides for searches, alerts, and account"
              onPress={() => router.push("/(tabs)/help" as Href)}
            />
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

          <View className="mb-4 gap-2">
            <Typography type="body-xs" className="mx-5 text-muted">
              Danger zone
            </Typography>
            <View className="mx-3 gap-2">
              <Button
                variant="secondary"
                feedbackVariant="none"
                className="min-h-11 w-full rounded-2xl"
                isDisabled={resettingOnboarding}
                onPress={handleReplayOnboarding}
              >
                <StyledIonicons
                  name="refresh-outline"
                  size={15}
                  className="text-foreground"
                />
                <Button.Label className="text-sm">
                  {resettingOnboarding
                    ? "Resetting…"
                    : "Replay onboarding (dev)"}
                </Button.Label>
              </Button>
              <Button
                variant="danger-soft"
                feedbackVariant="none"
                className="min-h-11 w-full rounded-2xl"
                onPress={() => setDeleteOpen(true)}
              >
                <StyledIonicons name="trash-outline" size={15} className="text-danger" />
                <Button.Label className="text-sm">Delete Account</Button.Label>
              </Button>
              <Button
                variant="primary"
                feedbackVariant="none"
                className="min-h-11 w-full rounded-2xl bg-accent"
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
          </View>
            </>
          )}
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
});

