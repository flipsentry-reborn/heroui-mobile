import type { JSX } from "react";
import { Linking, Platform, ScrollView, View } from "react-native";
import { Button, Typography, useToast } from "heroui-native";

import {
  SettingsRow,
  SettingsSection,
} from "@/features/settings/settings-section";

export default function NotificationSettingsScreen(): JSX.Element {
  const { toast } = useToast();

  const enableNotifications = () => {
    toast.show({
      variant: "default",
      label: "Enable Notifications",
      description: "Mock only — OS permission not requested.",
      duration: 2500,
    });
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-10 pt-3"
      showsVerticalScrollIndicator={false}
    >
      <SettingsSection title="Status">
        <SettingsRow
          icon="notifications-outline"
          title="Notification Permission"
          showChevron={false}
          right={
            <Typography type="body-xs" weight="semibold" className="text-muted">
              Enabled
            </Typography>
          }
        />
        <SettingsRow
          icon="checkmark-circle-outline"
          title="Enable Notifications"
          onPress={enableNotifications}
          isLast
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
          onPress={() => void Linking.openSettings()}
        />
        <SettingsRow
          icon="refresh-outline"
          title="Refresh Permission Status"
          onPress={() =>
            toast.show({
              variant: "default",
              label: "Permission refreshed",
              duration: 2000,
            })
          }
          isLast
        />
      </SettingsSection>

      <View className="mx-5 mb-4 gap-3">
        <Typography type="body-xs" className="text-muted">
          Notifications keep you updated about new listings matching your searches.
        </Typography>
        <Button
          variant="primary"
          className="min-h-11 w-full bg-accent"
          onPress={enableNotifications}
        >
          <Button.Label className="text-sm text-accent-foreground">
            Enable Notifications
          </Button.Label>
        </Button>
      </View>
    </ScrollView>
  );
}
