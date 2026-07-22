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
  /** Vertically center logo + body (welcome / entry). Forms stay top-aligned. */
  contentAlign?: "top" | "center";
}

/** Auth canvas: solid subscription dark only — no glow, no particles. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  onBack,
  contentAlign = "top",
}: AuthShellProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const [muted] = useThemeColor(["muted"]);
  const isCentered = contentAlign === "center";

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
          justifyContent: isCentered ? "center" : "flex-start",
          paddingTop: insets.top + (onBack ? 8 : isCentered ? 16 : 28),
          paddingBottom: Math.max(insets.bottom, 24) + (isCentered ? 32 : 16),
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

        <View
          className={`items-center gap-3 ${isCentered ? "mb-12 gap-5 pt-0" : "mb-8 pt-2"}`}
        >
          <Image
            source={LOGO}
            style={{
              width: isCentered ? 200 : LOGO_WIDTH,
              height: isCentered ? 44 : LOGO_HEIGHT,
            }}
            contentFit="contain"
            accessibilityLabel="FlipSentry"
          />
          <View className={`items-center px-2 ${isCentered ? "gap-2.5" : "gap-1.5"}`}>
            <Typography
              weight="bold"
              className={`text-center text-foreground ${
                isCentered
                  ? "text-[28px] leading-9"
                  : "text-[26px] leading-8"
              }`}
            >
              {title}
            </Typography>
            {subtitle ? (
              <Typography
                type="body-sm"
                className={`text-center text-muted ${isCentered ? "max-w-[280px] leading-5" : ""}`}
              >
                {subtitle}
              </Typography>
            ) : null}
          </View>
        </View>

        <View className={isCentered ? "gap-4" : "gap-5"}>{children}</View>

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
