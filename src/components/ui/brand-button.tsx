import type { ComponentProps, JSX } from "react";
import { Button, useThemeColor } from "heroui-native";

type BrandButtonProps = Omit<ComponentProps<typeof Button>, "variant">;

/**
 * Primary brand CTA - theme accent fill + accent-foreground label (Uber-style).
 */
export function BrandButton({
  className,
  children,
  feedbackVariant = "scale-highlight",
  animation,
  ...rest
}: BrandButtonProps): JSX.Element {
  const [accentForeground] = useThemeColor(["accent-foreground"]);
  const props = {
    variant: "primary" as const,
    feedbackVariant,
    animation:
      animation ??
      (feedbackVariant === "scale-highlight"
        ? {
            scale: { value: 0.98 },
            highlight: {
              backgroundColor: { value: accentForeground },
              opacity: { value: [0, 0.12] as [number, number] },
            },
          }
        : undefined),
    className: `overflow-hidden rounded-2xl bg-accent ${className ?? ""}`,
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
