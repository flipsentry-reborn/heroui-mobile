import { Ionicons } from "@expo/vector-icons";
import type { JSX, ReactNode } from "react";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from "react-native-keyboard-controller";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "heroui-native";

import { Fonts } from "@/lib/fonts";
import { AUTH_CONTROL_BACKGROUND } from "@/features/auth/auth-theme";
import {
  ONBOARDING_BORDER_IDLE,
  ONBOARDING_CANVAS,
  ONBOARDING_SURFACE,
} from "@/features/onboarding/onboarding-theme";

const KEYBOARD_TOOLBAR_OFFSET = 62;

const AUTH_KEYBOARD_TOOLBAR_THEME = {
  light: {
    primary: "#FAFAFA",
    disabled: "#707070",
    background: ONBOARDING_CANVAS,
    ripple: "#F8F8F888",
  },
  dark: {
    primary: "#FAFAFA",
    disabled: "#707070",
    background: ONBOARDING_CANVAS,
    ripple: "#F8F8F888",
  },
} as const;

interface OnboardingShellProps {
  step: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  onSkip?: () => void;
}

function SoftProgressDot({
  active,
  accent,
}: {
  active: boolean;
  accent: string;
}): JSX.Element {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [active, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + progress.value * 0.72,
    transform: [{ scaleX: 0.7 + progress.value * 0.3 }],
  }));

  return (
    <View
      className="h-1.5 flex-1 overflow-hidden rounded-full"
      style={{
        maxWidth: 56,
        backgroundColor: ONBOARDING_BORDER_IDLE,
      }}
    >
      <Animated.View
        className="h-full w-full rounded-full"
        style={[
          fillStyle,
          { backgroundColor: active ? accent : AUTH_CONTROL_BACKGROUND },
        ]}
      />
    </View>
  );
}

export function OnboardingShell({
  step,
  totalSteps = 4,
  title,
  subtitle,
  children,
  footer,
  onBack,
  onSkip,
}: OnboardingShellProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const [foreground, muted, accent] = useThemeColor([
    "foreground",
    "muted",
    "accent",
  ]);

  return (
    <View className="flex-1" style={{ backgroundColor: ONBOARDING_CANVAS }}>
      <View
        className="absolute z-10 w-full flex-row items-center justify-between px-4"
        style={{ top: insets.top + 8 }}
      >
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: ONBOARDING_SURFACE,
              borderWidth: 1,
              borderColor: ONBOARDING_BORDER_IDLE,
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={muted} />
          </Pressable>
        ) : (
          <View className="h-10 w-10" />
        )}
        {onSkip ? (
          <Pressable
            onPress={onSkip}
            hitSlop={10}
            className="rounded-full px-3 py-2"
            accessibilityRole="button"
            accessibilityLabel="Skip for now"
          >
            <Text
              style={{
                fontFamily: Fonts.headingRegular,
                fontSize: 14,
                lineHeight: 18,
                color: muted,
              }}
            >
              Skip for now
            </Text>
          </Pressable>
        ) : (
          <View className="h-10 w-10" />
        )}
      </View>

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
          paddingHorizontal: 24,
          paddingTop: insets.top + 56,
          paddingBottom: Math.max(insets.bottom, 24) + 20,
        }}
      >
        <Animated.View
          key={`progress-${step}`}
          entering={FadeInDown.duration(380).easing(Easing.out(Easing.cubic))}
          className="mb-7 flex-row items-center justify-center gap-2"
        >
          {Array.from({ length: totalSteps }, (_, index) => (
            <SoftProgressDot
              key={index}
              active={index + 1 <= step}
              accent={accent}
            />
          ))}
        </Animated.View>

        <Animated.View
          key={`title-${step}-${title}`}
          entering={FadeInDown.delay(40)
            .duration(420)
            .easing(Easing.out(Easing.cubic))}
          className="mb-8 items-center gap-2.5 px-2"
        >
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 26,
              lineHeight: 32,
              letterSpacing: -0.5,
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
                lineHeight: 21,
                color: muted,
                textAlign: "center",
                opacity: 0.92,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </Animated.View>

        <Animated.View
          key={`body-${step}`}
          entering={FadeInUp.delay(80)
            .duration(460)
            .easing(Easing.out(Easing.cubic))}
          className="gap-4"
        >
          {children}
        </Animated.View>

        {footer ? (
          <Animated.View
            key={`footer-${step}`}
            entering={FadeInUp.delay(140)
              .duration(460)
              .easing(Easing.out(Easing.cubic))}
            className="mt-8 gap-3"
          >
            {footer}
          </Animated.View>
        ) : null}
      </KeyboardAwareScrollView>

      <KeyboardToolbar theme={AUTH_KEYBOARD_TOOLBAR_THEME} doneText="Done" />
    </View>
  );
}
