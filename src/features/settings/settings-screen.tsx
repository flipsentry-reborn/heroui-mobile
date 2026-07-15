import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  Chip,
  PressableFeedback,
  ScrollShadow,
  Skeleton,
  Surface,
  Switch,
  Typography,
  useToast,
} from "heroui-native";

import { SettingsProfileHeader } from "@/features/settings/settings-profile-header";
import {
  SettingsRow,
  SettingsSection,
} from "@/features/settings/settings-section";
import type {
  SettingsState,
  UserPreferences,
} from "@/mocks/data/settings";
import {
  getSettings,
  mockLogout,
  updatePreferences,
} from "@/mocks/services/settings";

function planLabelFromState(state: SettingsState): { label: string; accent: boolean } {
  if (state.hasActiveSubscription) return { label: "Hunter", accent: true };
  if (state.hasActiveTrial) return { label: "Trial", accent: true };
  return { label: "Free", accent: false };
}

export function SettingsScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<SettingsState | null>(null);

  const load = useCallback(async () => {
    const next = await getSettings();
    setState(next);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const prefs = state?.preferences;
  const plan = state ? planLabelFromState(state) : null;

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
              variant: "accent",
              label: "Logged out",
              description: "Mock only — no auth in this build.",
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
  const showSubscribeCta =
    state != null && !state.hasActiveSubscription && !state.hasActiveTrial;

  if (!state) {
    return (
      <View className="flex-1 bg-background px-3 pt-16" style={{ paddingTop: insets.top + 48 }}>
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
        color="#121212"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-[110px]"
        >
          {showSubscribeCta ? (
            <PressableFeedback
              onPress={() => router.push("/settings/subscription")}
              className="mx-3 mb-4 mt-1 overflow-hidden rounded-2xl"
              animation={{ scale: { value: 0.985 } }}
            >
              <LinearGradient
                colors={["#1ED760", "#1DB954", "#169c46"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="overflow-hidden rounded-2xl border border-white/20 p-5"
              >
                <View className="absolute left-0 right-0 top-0 h-px bg-white/35" />
                <Typography
                  type="body-xs"
                  weight="semibold"
                  className="mb-2 uppercase tracking-wider text-white/75"
                >
                  Subscribe to Flipsentry
                </Typography>
                <View className="flex-row items-end justify-between">
                  <Typography type="h5" weight="bold" className="mr-3 flex-1 text-white">
                    {"Subscribe Now To\nNot Miss Deals"}
                  </Typography>
                  <Surface
                    variant="transparent"
                    className="rounded-full border border-white/25 bg-white/15 px-5 py-2.5"
                  >
                    <Typography type="body-sm" weight="semibold" className="text-white">
                      Subscribe
                    </Typography>
                  </Surface>
                </View>
              </LinearGradient>
              <PressableFeedback.Highlight />
            </PressableFeedback>
          ) : null}

          <SettingsProfileHeader
            profile={state.profile}
            planLabel={plan?.label ?? "Free"}
            planAccent={plan?.accent}
            onPress={() => router.push("/settings/profile")}
          />

          <SettingsSection title="Subscription">
            <SettingsRow
              icon="diamond-outline"
              title="Your Subscriptions"
              accent
              onPress={() => router.push("/settings/subscription")}
              showChevron={false}
              isLast
              right={
                <View className="flex-row items-center gap-1.5">
                  <Chip size="sm" variant="soft" color={plan?.accent ? "accent" : "default"}>
                    <Chip.Label>{plan?.label ?? "Free"}</Chip.Label>
                  </Chip>
                  <Ionicons name="chevron-forward" size={16} color="#8A8A8A" />
                </View>
              }
            />
          </SettingsSection>

          <SettingsSection title="App Preferences">
            <SettingsRow
              icon={prefs?.darkMode ? "moon" : "sunny"}
              title="Dark Mode"
              showChevron={false}
              onPress={() => void patchPrefs({ darkMode: !prefs?.darkMode })}
              right={
                <View className="flex-row items-center gap-2" pointerEvents="box-none">
                  <Ionicons
                    name="sunny"
                    size={16}
                    color={!prefs?.darkMode ? "#1DB954" : "#8A8A8A"}
                  />
                  <Switch
                    isSelected={!!prefs?.darkMode}
                    onSelectedChange={(v) => void patchPrefs({ darkMode: v })}
                  />
                  <Ionicons
                    name="moon"
                    size={16}
                    color={prefs?.darkMode ? "#1DB954" : "#8A8A8A"}
                  />
                </View>
              }
            />
            <SettingsRow
              icon="notifications-outline"
              title="Notifications"
              onPress={() => router.push("/settings/notification")}
            />
            <SettingsRow
              icon="ban-outline"
              title="Blocked Sellers"
              onPress={() => router.push("/settings/blocked-sellers")}
            />
            <SettingsRow
              icon="shield-outline"
              title="Hide Spam Listings"
              showChevron={false}
              onPress={() => void patchPrefs({ showScams: !prefs?.showScams })}
              right={
                <Switch
                  isSelected={!prefs?.showScams}
                  onSelectedChange={(v) => void patchPrefs({ showScams: !v })}
                />
              }
            />
            <SettingsRow
              icon="storefront-outline"
              title="Hide Dealer Listings"
              showChevron={false}
              onPress={() =>
                void patchPrefs({
                  showDealers: !prefs?.showDealers,
                  showDealerships: !prefs?.showDealerships,
                })
              }
              right={
                <Switch
                  isSelected={!prefs?.showDealerships}
                  onSelectedChange={(v) =>
                    void patchPrefs({ showDealers: !v, showDealerships: !v })
                  }
                />
              }
            />
            <SettingsRow
              icon="warning-outline"
              title="Hide Major Damage"
              showChevron={false}
              onPress={() =>
                void patchPrefs({ showMajorDamaged: !prefs?.showMajorDamaged })
              }
              right={
                <Switch
                  isSelected={!(prefs?.showMajorDamaged ?? true)}
                  onSelectedChange={(v) => void patchPrefs({ showMajorDamaged: !v })}
                />
              }
            />
            <SettingsRow
              icon="warning-outline"
              title="Hide Rebuilt"
              showChevron={false}
              onPress={() =>
                void patchPrefs({ showRebuiltTitle: !prefs?.showRebuiltTitle })
              }
              right={
                <Switch
                  isSelected={!(prefs?.showRebuiltTitle ?? true)}
                  onSelectedChange={(v) => void patchPrefs({ showRebuiltTitle: !v })}
                />
              }
            />
            <SettingsRow
              icon="warning-outline"
              title="Hide Salvage"
              showChevron={false}
              onPress={() =>
                void patchPrefs({ showSalvageTitle: !prefs?.showSalvageTitle })
              }
              right={
                <Switch
                  isSelected={!(prefs?.showSalvageTitle ?? true)}
                  onSelectedChange={(v) => void patchPrefs({ showSalvageTitle: !v })}
                />
              }
            />
            <SettingsRow
              icon="resize-outline"
              title="Distance Unit"
              showChevron={false}
              isLast
              onPress={() =>
                void patchPrefs({
                  distanceUnit: distanceUnit === "mi" ? "km" : "mi",
                })
              }
              right={
                <Surface
                  variant="tertiary"
                  className="flex-row overflow-hidden rounded-lg border border-white/10 p-0.5"
                >
                  {(["mi", "km"] as const).map((unit) => {
                    const active = distanceUnit === unit;
                    return (
                      <PressableFeedback
                        key={unit}
                        onPress={() => void patchPrefs({ distanceUnit: unit })}
                        className={`rounded-md px-3.5 py-1.5 ${
                          active ? "bg-[#1DB954]" : "bg-transparent"
                        }`}
                        animation={{ scale: { value: 0.95 } }}
                      >
                        <Typography
                          type="body-xs"
                          weight="semibold"
                          className={active ? "text-[#04140A]" : "text-muted"}
                        >
                          {unit}
                        </Typography>
                      </PressableFeedback>
                    );
                  })}
                </Surface>
              }
            />
          </SettingsSection>

          <SettingsSection title="Help & Support">
            <SettingsRow icon="star-outline" title="Rate App" onPress={handleRateApp} />
            <SettingsRow
              icon="globe-outline"
              title="Web Version"
              onPress={() => void Linking.openURL("https://flipsentry.com/app")}
            />
            <SettingsRow
              icon="chatbubble-ellipses-outline"
              title="Messenger"
              onPress={() => void Linking.openURL("https://m.me/flipsentry")}
            />
            <SettingsRow
              icon="mail-outline"
              title="Email"
              onPress={() => void Linking.openURL("mailto:support@flipsentry.com")}
              isLast
            />
          </SettingsSection>

          <SettingsSection title="Legal">
            <SettingsRow
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => void Linking.openURL("https://flipsentry.com/terms")}
            />
            <SettingsRow
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              onPress={() => void Linking.openURL("https://flipsentry.com/privacy")}
              isLast
            />
          </SettingsSection>

          <View className="mb-10 flex-row gap-3 px-3">
            <Button
              variant="secondary"
              className="min-h-12 flex-1 overflow-hidden rounded-2xl border border-white/12 bg-white/5"
              onPress={() => router.push("/settings/delete-account")}
            >
              <Ionicons name="trash-outline" size={16} color="#E8E8E8" />
              <Button.Label className="text-foreground">Delete</Button.Label>
            </Button>
            <Button
              variant="primary"
              className="min-h-12 flex-1 rounded-2xl border border-white/20 bg-[#1DB954]"
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={16} color="#04140A" />
              <Button.Label className="text-[#04140A]">Logout</Button.Label>
            </Button>
          </View>
        </ScrollView>
      </ScrollShadow>
    </View>
  );
}
