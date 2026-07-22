import type { JSX } from "react";
import { cn, InputOTP, REGEXP_ONLY_DIGITS } from "heroui-native";

import { AUTH_CONTROL_BACKGROUND } from "@/features/auth/auth-theme";

interface AuthInputOtpProps {
  value: string;
  onChange: (value: string) => void;
  isInvalid?: boolean;
  onComplete?: (value: string) => void;
}

/** Kill default slot boxes (border / fill / round / active outline). */
const SLOT_CLASS =
  "h-12 w-8 rounded-none border-0 bg-transparent p-0 shadow-none outline-0 outline-transparent";

const SLOT_STYLE = {
  borderWidth: 0,
  borderRadius: 0,
  backgroundColor: "transparent" as const,
  shadowOpacity: 0,
  elevation: 0,
  outlineWidth: 0,
};

/**
 * HeroUI Native InputOTP “Custom Styles” — charcoal pill, bare 3+3 dashes.
 * @see heroui-native example CustomStylesOTPContent
 */
export function AuthInputOtp({
  value,
  onChange,
  isInvalid,
  onComplete,
}: AuthInputOtpProps): JSX.Element {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      pattern={REGEXP_ONLY_DIGITS}
      placeholder="------"
      isInvalid={isInvalid}
      className="w-full items-center justify-center gap-8 rounded-3xl py-4 shadow-none"
      style={{
        backgroundColor: AUTH_CONTROL_BACKGROUND,
        borderCurve: "continuous",
      }}
    >
      <InputOTP.Group className="gap-0">
        {({ slots }) => (
          <>
            {slots.slice(0, 3).map((slot) => (
              <InputOTP.Slot
                key={slot.index}
                index={slot.index}
                variant="secondary"
                className={cn(SLOT_CLASS, slot.isActive && "border-0 outline-0")}
                style={SLOT_STYLE}
              >
                <InputOTP.SlotPlaceholder />
                <InputOTP.SlotValue className="text-2xl" />
                <InputOTP.SlotCaret />
              </InputOTP.Slot>
            ))}
          </>
        )}
      </InputOTP.Group>
      <InputOTP.Group className="gap-0">
        {({ slots }) => (
          <>
            {slots.slice(3, 6).map((slot) => (
              <InputOTP.Slot
                key={slot.index}
                index={slot.index}
                variant="secondary"
                className={cn(SLOT_CLASS, slot.isActive && "border-0 outline-0")}
                style={SLOT_STYLE}
              >
                <InputOTP.SlotPlaceholder />
                <InputOTP.SlotValue className="text-2xl" />
                <InputOTP.SlotCaret />
              </InputOTP.Slot>
            ))}
          </>
        )}
      </InputOTP.Group>
    </InputOTP>
  );
}
