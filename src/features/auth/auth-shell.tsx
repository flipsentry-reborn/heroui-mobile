import type { JSX, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography } from "heroui-native";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthShell({
  title,
  subtitle,
  children,
}: AuthShellProps): JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="grow px-5 pb-8"
        style={{ paddingTop: insets.top + 24 }}
      >
        <View className="mb-8 gap-2">
          <Typography className="text-foreground text-3xl font-bold">
            FlipSentry
          </Typography>
          <Typography className="text-foreground text-xl font-semibold">
            {title}
          </Typography>
          {subtitle ? (
            <Typography className="text-muted text-sm">{subtitle}</Typography>
          ) : null}
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
