import type { ComponentProps, JSX } from "react";
import { Button } from "heroui-native";

type ButtonProps = ComponentProps<typeof Button>;

type BrandButtonProps = Omit<ButtonProps, "variant">;

/**
 * Primary brand CTA - theme accent fill + accent-foreground label (Uber-style).
 */
export function BrandButton({
 className,
 children,
 ...rest
}: BrandButtonProps): JSX.Element {
 return (
 <Button
 variant="primary"
 className={`rounded-2xl bg-accent ${className ?? ""}`}
 {...rest}
 >
 {children}
 </Button>
 );
}

BrandButton.Label = function BrandButtonLabel({
 className,
 ...rest
}: ComponentProps<typeof Button.Label>): JSX.Element {
 return (
 <Button.Label className={`text-accent-foreground ${className ?? ""}`} {...rest} />
 );
};
