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
  useThemeColor,
  useToast,
} from "heroui-native";
import { FAB } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import { DeleteAccountSheets } from "@/features/settings/delete-account-sheets";
import { HideListingsSheet } from "@/features/settings/hide-listings-sheet";
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

const StyledIonicons = withUniwind(Ionicons);

function planLabelFromState(state: SettingsState): string {
  if (state.hasActiveSubscription) return "Hunter";
  if (state.hasActiveTrial) return "Trial";
  return "Free";
}

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
        accessibilityLabel={`Distance unit ${value}`}
        className="h-8 min-w-8 px-0"
        animation={{ rotate: { value: [0, 0, 0] } }}
      >
        <Typography type="body-xs" weight="bold" className="text-accent-foreground">
          {value}
        </Typography>
      </FAB.Trigger>
      <FAB.Portal>
        <FAB.Overlay />
        <FAB.Content>
          <FAB.Item onPress={() => onChange("mi")}>mi</FAB.Item>
          <FAB.Item onPress={() => onChange("km")}>km</FAB.Item>
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hideOpen, setHideOpen] = useState(false);

  const load = useCallback(async () => {
    const next = await getSettings();
    setState(next);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const prefs = state?.preferences;
  const planLabel = state ? planLabelFromState(state) : "Free";

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
              <Surface variant="secondary" className="rounded-2xl p-5">
                <Typography
                  type="body-xs"
                  weight="semibold"
                  className="mb-2 uppercase tracking-wider text-muted"
                >
                  Subscribe to Flipsentry
                </Typography>
                <View className="flex-row items-end justify-between gap-3">
                  <Typography
                    type="h5"
                    weight="bold"
                    className="flex-1 text-foreground"
                  >
                    {"Subscribe Now To\nNot Miss Deals"}
                  </Typography>
                  <Surface
                    variant="tertiary"
                    className="rounded-full px-4 py-2"
                  >
                    <Typography type="body-sm" weight="semibold" className="text-foreground">
                      Subscribe
                    </Typography>
                  </Surface>
                </View>
              </Surface>
              <PressableFeedback.Highlight />
            </PressableFeedback>
          ) : null}

          <SettingsProfileHeader
            profile={state.profile}
            planLabel={planLabel}
            onPress={() => router.push("/settings/profile")}
          />

          <SettingsSection title="Subscription">
            <SettingsRow
              icon="diamond-outline"
              title="Your Subscriptions"
              onPress={() => router.push("/settings/subscription")}
              showChevron={false}
              isLast
              right={
                <View className="flex-row items-center gap-1.5">
                  <Chip size="sm" variant="soft" color="default">
                    <Chip.Label>{planLabel}</Chip.Label>
                  </Chip>
                  <StyledIonicons
                    name="chevron-forward"
                    size={16}
                    className="text-muted"
                  />
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
                  <StyledIonicons
                    name="sunny"
                    size={16}
                    className={prefs?.darkMode ? "text-muted" : "text-foreground"}
                  />
                  <Switch
                    isSelected={!!prefs?.darkMode}
                    onSelectedChange={(v) => void patchPrefs({ darkMode: v })}
                  />
                  <StyledIonicons
                    name="moon"
                    size={16}
                    className={prefs?.darkMode ? "text-foreground" : "text-muted"}
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
              icon="eye-off-outline"
              title="Hide listings"
              onPress={() => setHideOpen(true)}
            />
            <SettingsRow
              icon="resize-outline"
              title="Distance Unit"
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
