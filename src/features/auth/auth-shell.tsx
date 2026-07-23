import { Image } from "expo-image";
import type { JSX, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";

import { AUTH_CONTROL_BACKGROUND } from "@/features/auth/auth-theme";
import { SUBSCRIPTION_DARK_BACKGROUND } from "@/features/settings/subscription-theme";
import { Fonts } from "@/lib/fonts";

/** Same mark as feed header (not Expo placeholder `icon.png`). */
const LOGO = require("../../../assets/images/flipsentry-logo-text-transparent.png");
const LOGO_WIDTH = 180;
const LOGO_HEIGHT = 40;

/** Space for KeyboardToolbar above the keyboard (HeroUI / Expo form pattern). */
const KEYBOARD_TOOLBAR_OFFSET = 62;

/** Match auth canvas `#060606` — default toolbar uses elevated gray. */
const AUTH_KEYBOARD_TOOLBAR_THEME = {
  light: {
    primary: "#FAFAFA",
    disabled: "#707070",
    background: SUBSCRIPTION_DARK_BACKGROUND,
    ripple: "#F8F8F888",
  },
  dark: {
    primary: "#FAFAFA",
    disabled: "#707070",
    background: SUBSCRIPTION_DARK_BACKGROUND,
    ripple: "#F8F8F888",
  },
} as const;

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  /** Vertically center logo + body (welcome / entry). Forms stay top-aligned. */
  contentAlign?: "top" | "center";
}

/**
 * Auth canvas: solid subscription dark.
 * Uses `KeyboardAwareScrollView` + `KeyboardToolbar` from
 * `react-native-keyboard-controller` so TextFields scroll above the keyboard.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  onBack,
  contentAlign = "top",
}: AuthShellProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const [foreground, muted] = useThemeColor(["foreground", "muted"]);
  const isCentered = contentAlign === "center";

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: SUBSCRIPTION_DARK_BACKGROUND }}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          className="absolute z-10 h-10 w-10 items-center justify-center rounded-full"
          style={{
            top: insets.top + 8,
            left: 16,
            backgroundColor: AUTH_CONTROL_BACKGROUND,
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={muted} />
        </Pressable>
      ) : null}

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={KEYBOARD_TOOLBAR_OFFSET}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: isCentered ? "center" : "flex-start",
          paddingHorizontal: 24,
          paddingTop: insets.top + (isCentered ? 16 : 28),
          paddingBottom: Math.max(insets.bottom, 24) + (isCentered ? 32 : 16),
        }}
      >
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
          {/* Same Britti pattern as subscription “Find deals faster.” */}
          <View
            className={`items-center px-2 ${isCentered ? "gap-3" : "gap-2.5"}`}
          >
            <Text
              style={{
                fontFamily: Fonts.heading,
                fontSize: isCentered ? 26 : 24,
                lineHeight: isCentered ? 32 : 30,
                letterSpacing: -0.4,
                color: foreground,
                textAlign: "center",
              }}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={{
                  fontFamily: Fonts.headingRegular,
                  fontSize: 14,
                  lineHeight: 20,
                  color: muted,
                  textAlign: "center",
                  paddingHorizontal: isCentered ? 8 : 4,
                  maxWidth: isCentered ? 300 : undefined,
                }}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View className={isCentered ? "gap-4" : "gap-5"}>{children}</View>

        {footer ? (
          <View className="mt-auto items-center pt-10">{footer}</View>
        ) : null}
      </KeyboardAwareScrollView>

      <KeyboardToolbar theme={AUTH_KEYBOARD_TOOLBAR_THEME} />
    </View>
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
  const [foreground, muted] = useThemeColor(["foreground", "muted"]);

  return (
    <View className="flex-row flex-wrap items-center justify-center gap-1">
      <Text
        style={{
          fontFamily: Fonts.headingRegular,
          fontSize: 14,
          lineHeight: 20,
          color: muted,
        }}
      >
        {prompt}
      </Text>
      <Pressable onPress={onPress} hitSlop={8}>
        <Text
          style={{
            fontFamily: Fonts.headingSemi,
            fontSize: 14,
            lineHeight: 20,
            color: foreground,
          }}
        >
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

export function AuthOrDivider(): JSX.Element {
  const [muted] = useThemeColor(["muted"]);

  return (
    <View className="flex-row items-center gap-3 py-1">
      <View className="h-px flex-1 bg-border" />
      <Text
        style={{
          fontFamily: Fonts.headingRegular,
          fontSize: 12,
          lineHeight: 16,
          color: muted,
        }}
      >
        or
      </Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
