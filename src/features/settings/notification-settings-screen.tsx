import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform, ScrollView, View } from "react-native";
import {
  Alert,
  ScrollShadow,
  Spinner,
  Switch,
  Typography,
  useThemeColor,
  useToast,
} from "heroui-native";

import {
  getDeviceTimeZoneId,
  getLocalSilenceStatus,
  getQuietHoursSubtitle,
  getSilenceStatusMessage,
} from "@/domain/notification-silence";
import { QuietHourSelect } from "@/features/settings/quiet-hour-select";
import {
  SettingsRow,
  SettingsSection,
} from "@/features/settings/settings-section";
import { toUserErrorMessage } from "@/lib/user-error-message";
import type { UserNotificationSettings } from "@/models/user";
import { useStore } from "@/store/store";

export const NotificationSettingsScreen = observer(
  function NotificationSettingsScreen(): JSX.Element {
    const { toast } = useToast();
    const background = useThemeColor("background");
    const { userStore } = useStore();
    const [loading, setLoading] = useState(
      () => userStore.notificationSettings == null,
    );
    const [pendingKey, setPendingKey] = useState<string | null>(null);
    const [draft, setDraft] = useState<UserNotificationSettings | null>(
      () => userStore.notificationSettings,
    );
    const requestIdRef = useRef(0);

    const settings = draft ?? userStore.notificationSettings;

    useEffect(() => {
      if (pendingKey != null) return;
      if (userStore.notificationSettings != null) {
        setDraft(userStore.notificationSettings);
      }
    }, [userStore.notificationSettings, pendingKey]);

    const load = useCallback(async () => {
      const showSpinner = userStore.notificationSettings == null;
      if (showSpinner) setLoading(true);
      try {
        await userStore.loadNotificationSettings();
        setDraft(userStore.notificationSettings);
      } finally {
        if (showSpinner) setLoading(false);
      }
    }, [userStore]);

    useFocusEffect(
      useCallback(() => {
        void load();
      }, [load]),
    );

    const updateSettings = async (
      key: string,
      patch: Partial<UserNotificationSettings>,
    ) => {
      if (pendingKey) return;
      const requestId = ++requestIdRef.current;
      setPendingKey(key);

      const baseline =
        draft ??
        userStore.notificationSettings ??
        ({
          pushNotificationsEnabled: true,
          scheduledSilenceEnabled: false,
          scheduledSilenceStartHour: 22,
          scheduledSilenceEndHour: 7,
          scheduledSilenceTimeZoneId: getDeviceTimeZoneId(),
          priceDropSavedEnabled: true,
          priceDropViewedEnabled: true,
          isCurrentlySilenced: false,
          silenceReason: null,
        } satisfies UserNotificationSettings);

      const nextTimezone =
        patch.scheduledSilenceTimeZoneId ??
        (patch.scheduledSilenceEnabled ||
        patch.scheduledSilenceStartHour != null ||
        patch.scheduledSilenceEndHour != null
          ? getDeviceTimeZoneId()
          : baseline.scheduledSilenceTimeZoneId);

      const optimistic: UserNotificationSettings = {
        ...baseline,
        ...patch,
        ...(nextTimezone != null
          ? { scheduledSilenceTimeZoneId: nextTimezone }
          : {}),
      };
      setDraft(optimistic);

      try {
        await userStore.updateNotificationSettings({
          ...patch,
          ...(nextTimezone != null
            ? { scheduledSilenceTimeZoneId: nextTimezone }
            : {}),
        });
        if (requestId === requestIdRef.current) {
          setDraft(userStore.notificationSettings);
        }
      } catch (error) {
        if (requestId === requestIdRef.current) {
          setDraft(baseline);
          toast.show({
            variant: "danger",
            label: toUserErrorMessage(error),
            duration: 2500,
          });
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setPendingKey(null);
        }
      }
    };

    const silenceMessage = getSilenceStatusMessage(settings);
    const silenceStatus = getLocalSilenceStatus(settings);
    const alertStatus =
      silenceStatus.reason === "push_disabled"
        ? "danger"
        : silenceStatus.reason === "scheduled"
          ? "warning"
          : "default";

    const pushEnabled = settings?.pushNotificationsEnabled ?? true;
    const quietEnabled = settings?.scheduledSilenceEnabled ?? false;
    const priceDropSaved = settings?.priceDropSavedEnabled ?? true;
    const priceDropViewed = settings?.priceDropViewedEnabled ?? true;
    const startHour = settings?.scheduledSilenceStartHour ?? 22;
    const endHour = settings?.scheduledSilenceEndHour ?? 7;
    const busy = pendingKey != null;

    return (
      <View className="flex-1 bg-background">
        <ScrollShadow
          className="flex-1"
          LinearGradientComponent={LinearGradient}
          color={background}
        >
          <ScrollView
            className="flex-1"
            contentContainerClassName="pb-10 pt-3"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mx-5 mb-4">
              <Typography type="body-xs" className="text-muted">
                Control push alerts. Your feed always updates; quiet hours only
                pause notifications.
              </Typography>
            </View>

            {loading ? (
              <View className="items-center py-10">
                <Spinner />
              </View>
            ) : (
              <>
                {silenceMessage ? (
                  <View className="mx-3 mb-4">
                    <Alert status={alertStatus} className="items-center">
                      <Alert.Indicator className="pt-0" />
                      <Alert.Content>
                        <Alert.Title>{silenceMessage}</Alert.Title>
                      </Alert.Content>
                    </Alert>
                  </View>
                ) : null}

                <SettingsSection title="Alerts">
                  <SettingsRow
                    icon="notifications-outline"
                    title="Push notifications"
                    description="Master switch for all alerts"
                    showChevron={false}
                    right={
                      <Switch
                        isSelected={pushEnabled}
                        isDisabled={busy}
                        onSelectedChange={(next) =>
                          void updateSettings("push", {
                            pushNotificationsEnabled: next,
                          })
                        }
                      />
                    }
                  />
                  <SettingsRow
                    icon="moon-outline"
                    title="Quiet hours"
                    description={getQuietHoursSubtitle(settings)}
                    showChevron={false}
                    isLast={!quietEnabled}
                    right={
                      <Switch
                        isSelected={quietEnabled}
                        isDisabled={busy}
                        onSelectedChange={(next) =>
                          void updateSettings("schedule", {
                            scheduledSilenceEnabled: next,
                            scheduledSilenceTimeZoneId: getDeviceTimeZoneId(),
                          })
                        }
                      />
                    }
                  />
                  {quietEnabled ? (
                    <View className="flex-row gap-3 px-4 pb-3.5 pt-1">
                      <QuietHourSelect
                        key="quiet-from"
                        label="From"
                        hour={startHour}
                        disabled={busy && pendingKey !== "hour-start"}
                        onHourChange={(hour) =>
                          void updateSettings("hour-start", {
                            scheduledSilenceStartHour: hour,
                          })
                        }
                      />
                      <QuietHourSelect
                        key="quiet-to"
                        label="To"
                        hour={endHour}
                        disabled={busy && pendingKey !== "hour-end"}
                        onHourChange={(hour) =>
                          void updateSettings("hour-end", {
                            scheduledSilenceEndHour: hour,
                          })
                        }
                      />
                    </View>
                  ) : null}
                </SettingsSection>

                <SettingsSection title="Price Drop">
                  <SettingsRow
                    icon="pricetag-outline"
                    title="Saved"
                    description="Alert when a favorited listing drops in price"
                    showChevron={false}
                    right={
                      <Switch
                        isSelected={priceDropSaved}
                        isDisabled={busy}
                        onSelectedChange={(next) =>
                          void updateSettings("price-drop-saved", {
                            priceDropSavedEnabled: next,
                          })
                        }
                      />
                    }
                  />
                  <SettingsRow
                    icon="eye-outline"
                    title="Viewed"
                    description="Alert when a listing you opened drops in price"
                    showChevron={false}
                    isLast
                    right={
                      <Switch
                        isSelected={priceDropViewed}
                        isDisabled={busy}
                        onSelectedChange={(next) =>
                          void updateSettings("price-drop-viewed", {
                            priceDropViewedEnabled: next,
                          })
                        }
                      />
                    }
                  />
                </SettingsSection>

                <SettingsSection title="System">
                  <SettingsRow
                    icon="settings-outline"
                    title={
                      Platform.OS === "ios"
                        ? "iOS Notification Settings"
                        : "Android Notification Settings"
                    }
                    description="Open system notification settings"
                    onPress={() => void Linking.openSettings()}
                  />
                  <SettingsRow
                    icon="checkmark-circle-outline"
                    title="Enable Notifications"
                    description="Request permission for listing alerts"
                    isLast
                    onPress={() =>
                      toast.show({
                        variant: "default",
                        label: "Enable Notifications",
                        description:
                          "Mock only - OS permission not requested.",
                        duration: 2500,
                      })
                    }
                  />
                </SettingsSection>
              </>
            )}
          </ScrollView>
        </ScrollShadow>
      </View>
    );
  },
);
