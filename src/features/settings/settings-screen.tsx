import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Surface, Switch, Typography, useToast } from "heroui-native";

import {
  SettingsRow,
  SettingsSection,
} from "@/features/settings/settings-section";
import type {
  RefundPreference,
  SettingsState,
  UserPreferences,
} from "@/mocks/data/settings";
import {
  getSettings,
  mockLogout,
  refundPreferenceLabel,
  updatePreferences,
  updateRefundConsent,
  updateRefundPreference,
} from "@/mocks/services/settings";

const isRefundSaverSupported = Platform.OS === "ios";

export function SettingsScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<SettingsState | null>(null);
  const [updatingRefundPreference, setUpdatingRefundPreference] = useState(false);
  const [updatingRefundConsent, setUpdatingRefundConsent] = useState(false);

  const load = useCallback(async () => {
    const next = await getSettings();
    setState(next);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const prefs = state?.preferences;
  const refund = state?.refundSaver;

  const patchPrefs = async (patch: Partial<UserPreferences>) => {
    try {
      const next = await updatePreferences(patch);
      setState((s) => (s ? { ...s, preferences: next } : s));
    } catch {
      Alert.alert("Error", "Failed to update preference");
    }
  };

  const handleEditRefundPreference = () => {
    if (!isRefundSaverSupported) {
      Alert.alert(
        "iOS only",
        "Refund Saver preference is only available for App Store purchases on iOS.",
      );
      return;
    }
    Alert.alert("Default refund request preference", "Choose your app-level preference.", [
      { text: "Always decline", onPress: () => void setRefundPref("decline") },
      { text: "Always refund", onPress: () => void setRefundPref("grant") },
      { text: "No preference", onPress: () => void setRefundPref("no_preference") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const setRefundPref = async (preference: RefundPreference) => {
    try {
      setUpdatingRefundPreference(true);
      await updateRefundPreference(preference);
      setState((s) =>
        s ? { ...s, refundSaver: { ...s.refundSaver, preference } } : s,
      );
      toast.show({ variant: "success", label: "Refund preference updated", duration: 2200 });
    } catch {
      toast.show({
        variant: "danger",
        label: "Failed to update refund preference",
        duration: 2500,
      });
    } finally {
      setUpdatingRefundPreference(false);
    }
  };

  const handleEditRefundConsent = () => {
    if (!isRefundSaverSupported) {
      Alert.alert(
        "iOS only",
        "Refund data consent is only used for App Store refunds on iOS.",
      );
      return;
    }
    Alert.alert("Refund data sharing consent", "Select this user consent status.", [
      { text: "Allow sharing", onPress: () => void setConsent(true) },
      { text: "Revoke sharing", onPress: () => void setConsent(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const setConsent = async (consent: boolean) => {
    try {
      setUpdatingRefundConsent(true);
      await updateRefundConsent(consent);
      setState((s) =>
        s
          ? {
              ...s,
              refundSaver: {
                ...s.refundSaver,
                collectingRefundDataConsent: consent,
              },
            }
          : s,
      );
      toast.show({
        variant: "success",
        label: "Refund data consent updated",
        duration: 2200,
      });
    } catch {
      toast.show({
        variant: "danger",
        label: "Failed to update refund data consent",
        duration: 2500,
      });
    } finally {
      setUpdatingRefundConsent(false);
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

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="px-5 pb-3 pt-2">
        <Typography type="h3" weight="bold" className="text-foreground">
          Settings
        </Typography>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {showSubscribeCta ? (
          <Pressable
            onPress={() => router.push("/settings/subscription")}
            className="mx-3 mb-4 mt-1 overflow-hidden rounded-2xl"
            style={styles.ctaShadow}
          >
            <LinearGradient
              colors={["#1ED760", "#1DB954", "#169c46"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <View style={styles.ctaSheen} />
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
                  variant="secondary"
                  className="rounded-full border border-white/25 bg-white/15 px-5 py-2.5"
                >
                  <Typography type="body-sm" weight="semibold" className="text-white">
                    Subscribe
                  </Typography>
                </Surface>
              </View>
            </LinearGradient>
          </Pressable>
        ) : null}

        <SettingsSection title="Account">
          <SettingsRow
            icon="person-outline"
            title="Your Profile"
            onPress={() => router.push("/settings/profile")}
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Subscription">
          <SettingsRow
            icon="diamond-outline"
            title="Your Subscriptions"
            accent
            onPress={() => router.push("/settings/subscription")}
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Refund Saver">
          {isRefundSaverSupported ? (
            <>
              <SettingsRow
                icon="card-outline"
                title="Refund Preference"
                onPress={handleEditRefundPreference}
                showChevron={false}
                right={
                  <View className="flex-row items-center gap-1">
                    <Typography type="body-xs" className="text-muted">
                      {updatingRefundPreference
                        ? "Updating..."
                        : refundPreferenceLabel(refund?.preference ?? "no_preference")}
                    </Typography>
                    <Ionicons name="chevron-forward" size={16} color="#8A8A8A" />
                  </View>
                }
              />
              <SettingsRow
                icon="shield-checkmark-outline"
                title="Refund Data Consent"
                onPress={handleEditRefundConsent}
                showChevron={false}
                isLast
                right={
                  <View className="flex-row items-center gap-1">
                    <Typography type="body-xs" className="text-muted">
                      {updatingRefundConsent
                        ? "Updating..."
                        : refund?.collectingRefundDataConsent
                          ? "Allowed"
                          : "Revoked"}
                    </Typography>
                    <Ionicons name="chevron-forward" size={16} color="#8A8A8A" />
                  </View>
                }
              />
              <View className="px-4 pb-3.5 pt-1">
                <Typography type="body-xs" className="text-muted">
                  Refund Saver works only for Apple App Store refunds. Data sharing
                  consent is enabled by default to support refund processing and can
                  be revoked here at any time.
                </Typography>
              </View>
            </>
          ) : (
            <View className="px-4 py-3">
              <Typography type="body-xs" className="text-muted">
                Refund Saver settings are available on iOS only.
              </Typography>
            </View>
          )}
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
                    <Pressable
                      key={unit}
                      onPress={() => void patchPrefs({ distanceUnit: unit })}
                      className="rounded-md px-3.5 py-1.5"
                      style={{
                        backgroundColor: active ? "#1DB954" : "transparent",
                      }}
                    >
                      <Typography
                        type="body-xs"
                        weight="semibold"
                        style={{ color: active ? "#04140A" : "#B3B3B3" }}
                      >
                        {unit}
                      </Typography>
                    </Pressable>
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
            className="min-h-12 flex-1 rounded-2xl border border-white/10"
            style={styles.actionBtn}
            onPress={() => router.push("/settings/delete-account")}
          >
            <Ionicons name="trash-outline" size={16} color="#E8E8E8" />
            <Button.Label className="text-foreground">Delete</Button.Label>
          </Button>
          <Button
            variant="primary"
            className="min-h-12 flex-1 rounded-2xl"
            style={[styles.actionBtn, { backgroundColor: "#1DB954" }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={16} color="#04140A" />
            <Button.Label style={{ color: "#04140A" }}>Logout</Button.Label>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ctaShadow: {
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  ctaGradient: {
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  ctaSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  actionBtn: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
