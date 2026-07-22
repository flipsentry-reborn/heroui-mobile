import type { JSX } from "react";
import type { TextInputProps } from "react-native";
import {
  FieldError,
  Input,
  Label,
  TextField,
  Typography,
} from "heroui-native";

interface AuthFieldProps extends Omit<TextInputProps, "className"> {
  label: string;
  error?: string;
  className?: string;
}

export function AuthField({
  label,
  error,
  className,
  ...inputProps
}: AuthFieldProps): JSX.Element {
  return (
    <TextField isInvalid={!!error} className={className}>
      <Label>{label}</Label>
      <Input
        className="h-12"
        autoCapitalize="none"
        autoCorrect={false}
        {...inputProps}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  );
}

export function AuthHint({ children }: { children: string }): JSX.Element {
  return (
    <Typography className="text-muted text-sm text-center">{children}</Typography>
  );
}
