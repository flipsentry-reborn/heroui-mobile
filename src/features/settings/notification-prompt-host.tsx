import { useRouter, useSegments, type Href } from "expo-router";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useToast } from "heroui-native";

import {
  getDeviceTimeZoneId,
  getLocalSilenceStatus,
  type NotificationPromptVariant,
} from "@/domain/notification-silence";
import { NotificationPromptDialog } from "@/features/settings/notification-prompt-dialog";
import { toUserErrorMessage } from "@/lib/user-error-message";
import { useStore } from "@/store/store";

/**
 * Evaluates push / quiet-hours rules when the main app is active
 * (same flow as mobile-app NotificationPromptHost; OS permission stays stubbed).
 */
export const NotificationPromptHost = observer(
  function NotificationPromptHost(): JSX.Element | null {
    const { userStore, commonStore } = useStore();
    const router = useRouter();
    const segments = useSegments();
    const { toast } = useToast();
    const [visible, setVisible] = useState(false);
    const [variant, setVariant] =
      useState<NotificationPromptVariant>("os_permission");
    const [quietEndHour, setQuietEndHour] = useState(7);
    const permissionCheckedRef = useRef(false);
    const quietDismissedRef = useRef(false);

    const isOnMainApp =
      segments[0] === "(tabs)" &&
      userStore.isLoggedIn &&
      !!commonStore.token &&
      commonStore.appLoaded;
    const isOnNotificationSettings = segments[0] === "settings";

    const evaluatePrompt = useCallback(
      async (_options?: { foreground?: boolean }) => {
        if (!isOnMainApp || isOnNotificationSettings) {
          setVisible(false);
          return;
        }

        try {
          await userStore.loadNotificationSettings();

          // Expo Go: treat OS permission as already handled after first prompt.
          if (!permissionCheckedRef.current) {
            permissionCheckedRef.current = true;

            if (
              userStore.notificationSettings?.pushNotificationsEnabled === false
            ) {
              setQuietEndHour(7);
              setVariant("push_disabled");
              setVisible(true);
              return;
            }
          } else if (
            userStore.notificationSettings?.pushNotificationsEnabled === false
          ) {
            // Only auto-prompt push_disabled once per session (mobile-app parity).
            return;
          }

          const status = getLocalSilenceStatus(userStore.notificationSettings);
          if (status.reason === "scheduled" && !quietDismissedRef.current) {
            setQuietEndHour(
              userStore.notificationSettings?.scheduledSilenceEndHour ?? 7,
            );
            setVariant("quiet_active");
            setVisible(true);
          }
        } catch {
          // Best-effort; settings screen can still load manually.
        }
      },
      [isOnMainApp, isOnNotificationSettings, userStore],
    );

    useEffect(() => {
      if (!isOnMainApp) {
        permissionCheckedRef.current = false;
        quietDismissedRef.current = false;
        setVisible(false);
        return;
      }

      void evaluatePrompt();
    }, [isOnMainApp, commonStore.token, commonStore.appLoaded, evaluatePrompt]);

    useEffect(() => {
      if (!isOnMainApp) return;

      const handleAppStateChange = (nextState: AppStateStatus) => {
        if (nextState !== "active") return;
        void evaluatePrompt({ foreground: true });
      };

      const subscription = AppState.addEventListener(
        "change",
        handleAppStateChange,
      );
      return () => subscription.remove();
    }, [evaluatePrompt, isOnMainApp]);

    const handleDismiss = () => {
      if (variant === "quiet_active") {
        quietDismissedRef.current = true;
      }
      setVisible(false);
    };

    const handleRequestPermission = () => {
      setVisible(false);
      toast.show({
        variant: "default",
        label: "Enable Notifications",
        description: "Mock only - OS permission not requested.",
        duration: 2500,
      });
    };

    const handleEnablePush = async () => {
      setVisible(false);
      try {
        await userStore.updateNotificationSettings({
          pushNotificationsEnabled: true,
          scheduledSilenceTimeZoneId: getDeviceTimeZoneId(),
        });
        quietDismissedRef.current = false;
        await evaluatePrompt();
      } catch (error) {
        toast.show({
          variant: "danger",
          label: toUserErrorMessage(error),
          duration: 2500,
        });
      }
    };

    const handleOpenSettings = () => {
      quietDismissedRef.current = true;
      setVisible(false);
      router.push("/settings/notification" as Href);
    };

    if (!isOnMainApp) return null;

    return (
      <NotificationPromptDialog
        isOpen={visible}
        variant={variant}
        quietEndHour={quietEndHour}
        onOpenChange={setVisible}
        onDismiss={handleDismiss}
        onRequestPermission={handleRequestPermission}
        onEnablePush={() => void handleEnablePush()}
        onOpenSettings={handleOpenSettings}
      />
    );
  },
);
