import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX } from "react";
import { Linking, Platform, View } from "react-native";
import { Button, Dialog, Typography } from "heroui-native";
import { withUniwind } from "uniwind";

import {
  formatHourLabel,
  type NotificationPromptVariant,
} from "@/domain/notification-silence";

const StyledIonicons = withUniwind(Ionicons);

type IonName = ComponentProps<typeof Ionicons>["name"];

interface NotificationPromptDialogProps {
  isOpen: boolean;
  variant: NotificationPromptVariant;
  quietEndHour?: number;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
  onEnablePush?: () => void;
  onRequestPermission?: () => void;
  onOpenSettings?: () => void;
}

function copyFor(
  variant: NotificationPromptVariant,
  quietEndHour: number,
): {
  icon: IonName;
  title: string;
  message: string;
  primary: string;
  secondary: string;
} {
  if (variant === "os_permission") {
    return {
      icon: "notifications-outline",
      title: "Enable notifications",
      message:
        "Turn on device notifications so you don't miss new listings that match your searches.",
      primary: "Enable notifications",
      secondary: "Not now",
    };
  }

  if (variant === "quiet_active") {
    return {
      icon: "moon",
      title: "Quiet hours active",
      message: `Push alerts are paused until ${formatHourLabel(quietEndHour)}. Your feed still updates; only alerts are silenced.`,
      primary: "Got it",
      secondary: "Notification settings",
    };
  }

  return {
    icon: "notifications-off-outline",
    title: "Push notifications are off",
    message:
      "You've turned off push notifications in FlipSentry. New listings still appear in your feed, but you won't get alerts.",
    primary: "Turn push back on",
    secondary: "Keep off",
  };
}

export function NotificationPromptDialog({
  isOpen,
  variant,
  quietEndHour = 7,
  onOpenChange,
  onDismiss,
  onEnablePush,
  onRequestPermission,
  onOpenSettings,
}: NotificationPromptDialogProps): JSX.Element {
  const copy = copyFor(variant, quietEndHour);
  const isOsPermission = variant === "os_permission";
  const isQuietActive = variant === "quiet_active";

  const handlePrimary = () => {
    if (isOsPermission) {
      onRequestPermission?.();
      return;
    }
    if (isQuietActive) {
      onDismiss();
      return;
    }
    onEnablePush?.();
  };

  const handleSecondary = () => {
    if (isQuietActive) {
      onOpenSettings?.();
      return;
    }
    onDismiss();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onDismiss();
          return;
        }
        onOpenChange(open);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="mx-5 w-auto max-w-md gap-4 bg-surface">
          <View className="items-center gap-3 pt-1">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <StyledIonicons
                name={copy.icon}
                size={22}
                className="text-accent"
              />
            </View>
            <View className="gap-1.5 px-1">
              <Dialog.Title className="text-center">{copy.title}</Dialog.Title>
              <Dialog.Description className="text-center">
                {copy.message}
              </Dialog.Description>
            </View>
          </View>

          <View className="gap-2">
            <Button
              variant="primary"
              className="min-h-11 w-full bg-accent"
              onPress={handlePrimary}
            >
              <Button.Label className="text-sm text-accent-foreground">
                {copy.primary}
              </Button.Label>
            </Button>
            <Button
              variant="secondary"
              className="min-h-11 w-full"
              onPress={handleSecondary}
            >
              <Button.Label className="text-sm">{copy.secondary}</Button.Label>
            </Button>
            {isOsPermission ? (
              <Button
                variant="ghost"
                className="min-h-10 w-full"
                onPress={() =>
                  void (Platform.OS === "ios"
                    ? Linking.openURL("app-settings:")
                    : Linking.openSettings())
                }
              >
                <Button.Label className="text-xs text-muted">
                  Open device settings
                </Button.Label>
              </Button>
            ) : null}
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
