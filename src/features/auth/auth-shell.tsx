import { Image } from "expo-image";
import type { JSX, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography, useThemeColor } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";

import { SUBSCRIPTION_DARK_BACKGROUND } from "@/features/settings/subscription-theme";

/** Same mark as feed header (not Expo placeholder `icon.png`). */
const LOGO = require("../../../assets/images/flipsentry-logo-text-transparent.png");
const LOGO_WIDTH = 180;
const LOGO_HEIGHT = 40;

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
}

/** Auth canvas: solid subscription dark only — no glow, no particles. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  onBack,
}: AuthShellProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const [muted] = useThemeColor(["muted"]);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: SUBSCRIPTION_DARK_BACKGROUND }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
        contentContainerClassName="px-6"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + (onBack ? 8 : 28),
          paddingBottom: Math.max(insets.bottom, 24) + 16,
        }}
      >
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            className="mb-4 h-10 w-10 items-center justify-center rounded-full bg-surface-secondary"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={muted} />
          </Pressable>
        ) : null}

        <View className="mb-8 items-center gap-3 pt-2">
          <Image
            source={LOGO}
            style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}
            contentFit="contain"
            accessibilityLabel="FlipSentry"
          />
          <View className="items-center gap-1.5 px-2">
            <Typography
              weight="bold"
              className="text-center text-[26px] leading-8 text-foreground"
            >
              {title}
            </Typography>
            {subtitle ? (
              <Typography type="body-sm" className="text-center text-muted">
                {subtitle}
              </Typography>
            ) : null}
          </View>
        </View>

        <View className="gap-5">{children}</View>

        {footer ? (
          <View className="mt-auto items-center pt-10">{footer}</View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AuthFooterLink({
  prompt,
  actionLabel,
  onPress,
}: {
  prompt: string;
  actionLabel: string;
  onPress: () => void;
}): JSX.Element {
  return (
    <View className="flex-row flex-wrap items-center justify-center gap-1">
      <Typography type="body-sm" className="text-muted">
        {prompt}
      </Typography>
      <Pressable onPress={onPress} hitSlop={8}>
        <Typography type="body-sm" weight="semibold" className="text-foreground">
          {actionLabel}
        </Typography>
      </Pressable>
    </View>
  );
}

export function AuthOrDivider(): JSX.Element {
  return (
    <View className="flex-row items-center gap-3 py-1">
      <View className="h-px flex-1 bg-border" />
      <Typography type="body-xs" className="text-muted">
        or
      </Typography>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
