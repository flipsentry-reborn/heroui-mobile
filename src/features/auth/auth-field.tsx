import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useState } from "react";
import { Pressable, Text, type TextInputProps } from "react-native";
import {
  FieldError,
  Input,
  InputGroup,
  TextField,
  useThemeColor,
} from "heroui-native";

import { AUTH_CONTROL_BACKGROUND } from "@/features/auth/auth-theme";
import { Fonts } from "@/lib/fonts";

interface AuthFieldProps extends Omit<TextInputProps, "className"> {
  label: string;
  error?: string;
  className?: string;
}

const AUTH_INPUT_CLASS =
  "h-12 rounded-2xl border-0 text-foreground shadow-none";

const AUTH_INPUT_STYLE = {
  backgroundColor: AUTH_CONTROL_BACKGROUND,
  borderWidth: 0,
} as const;

/**
 * Auth field — charcoal fill matching Custom OTP pill (`#18181b`).
 * Password fields (`secureTextEntry`) get a trailing eye toggle.
 */
export function AuthField({
  label,
  error,
  className,
  secureTextEntry,
  ...inputProps
}: AuthFieldProps): JSX.Element {
  const [foreground, muted] = useThemeColor(["foreground", "muted"]);
  const [visible, setVisible] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <TextField isInvalid={!!error} className={className}>
      <Text
        style={{
          fontFamily: Fonts.headingSemi,
          fontSize: 14,
          lineHeight: 20,
          color: foreground,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      {isPassword ? (
        <InputGroup>
          <InputGroup.Input
            className={AUTH_INPUT_CLASS}
            style={AUTH_INPUT_STYLE}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={muted}
            secureTextEntry={!visible}
            {...inputProps}
          />
          <InputGroup.Suffix>
            <Pressable
              onPress={() => setVisible((v) => !v)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={visible ? "Hide password" : "Show password"}
              className="items-center justify-center px-1"
            >
              <Ionicons
                name={visible ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={muted}
              />
            </Pressable>
          </InputGroup.Suffix>
        </InputGroup>
      ) : (
        <Input
          className={AUTH_INPUT_CLASS}
          style={AUTH_INPUT_STYLE}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={muted}
          {...inputProps}
        />
      )}
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  );
}

export function AuthHint({
  children,
}: {
  children: string;
  className?: string;
}): JSX.Element {
  const [muted] = useThemeColor(["muted"]);

  return (
    <Text
      style={{
        fontFamily: Fonts.headingRegular,
        fontSize: 12,
        lineHeight: 16,
        color: muted,
        textAlign: "center",
      }}
    >
      {children}
    </Text>
  );
}
