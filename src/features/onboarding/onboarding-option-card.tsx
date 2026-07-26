import type { JSX, ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import {
  ONBOARDING_BORDER_IDLE,
  ONBOARDING_BORDER_SELECTED,
  ONBOARDING_SURFACE,
} from "@/features/onboarding/onboarding-theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface OnboardingOptionCardProps {
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  accessibilityLabel?: string;
  /** Pill chips (platforms). */
  pill?: boolean;
}

/** Soft charcoal card — selected = subtle light border, not hard accent fill. */
export function OnboardingOptionCard({
  selected = false,
  onPress,
  disabled,
  children,
  className,
  accessibilityLabel,
  pill = false,
}: OnboardingOptionCardProps): JSX.Element {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        if (disabled) return;
        scale.value = withSpring(0.985, { damping: 18, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 220 });
      }}
      style={[
        animatedStyle,
        {
          backgroundColor: selected
            ? "rgba(255,255,255,0.10)"
            : ONBOARDING_SURFACE,
          borderColor: selected
            ? ONBOARDING_BORDER_SELECTED
            : ONBOARDING_BORDER_IDLE,
          borderWidth: 1,
          borderRadius: pill ? 999 : 18,
        },
      ]}
      className={className ?? "px-4 py-4"}
    >
      {children}
    </AnimatedPressable>
  );
}

export function OnboardingIconWell({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <View
      className="h-11 w-11 items-center justify-center rounded-full"
      style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
    >
      {children}
    </View>
  );
}
