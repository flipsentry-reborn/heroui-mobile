import type { ComponentProps, JSX } from "react";
import { Button } from "heroui-native";

type BrandButtonProps = Omit<ComponentProps<typeof Button>, "variant">;

/**
 * Primary brand CTA - theme accent fill + accent-foreground label (Uber-style).
 */
export function BrandButton({
  className,
  children,
  ...rest
}: BrandButtonProps): JSX.Element {
  const props = {
    variant: "primary" as const,
    feedbackVariant: "none" as const,
    className: `rounded-2xl bg-accent ${className ?? ""}`,
    ...rest,
    children,
  };
  return <Button {...(props as ComponentProps<typeof Button>)} />;
}

BrandButton.Label = function BrandButtonLabel({
  className,
  ...rest
}: ComponentProps<typeof Button.Label>): JSX.Element {
  return (
    <Button.Label
      className={`text-accent-foreground ${className ?? ""}`}
      {...rest}
    />
  );
};
