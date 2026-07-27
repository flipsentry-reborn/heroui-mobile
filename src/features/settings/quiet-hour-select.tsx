import type { Time } from "@internationalized/date";
import type { JSX } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { Label } from "heroui-native";
import { TimePicker } from "heroui-native-pro";

import {
  formatHourLabel,
  hourToTimeOption,
  parseHourFromTimeValue,
} from "@/domain/notification-silence";

interface QuietHourSelectProps {
  label: string;
  hour: number;
  disabled?: boolean;
  onHourChange: (hour: number) => void;
}

/**
 * HeroUI Native Pro TimePicker (bottom-sheet presentation).
 * Portal mounts only while open so a closed sheet cannot paint on screen.
 */
export function QuietHourSelect({
  label,
  hour,
  disabled = false,
  onHourChange,
}: QuietHourSelectProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  const [draftHour, setDraftHour] = useState(hour);
  const draftHourRef = useRef(hour);
  const committedHourRef = useRef(hour);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) return;
    setDraftHour(hour);
    draftHourRef.current = hour;
    committedHourRef.current = hour;
  }, [hour, isOpen]);

  useEffect(
    () => () => {
      if (closeTimerRef.current != null) clearTimeout(closeTimerRef.current);
    },
    [],
  );

  const option = useMemo(() => hourToTimeOption(draftHour), [draftHour]);

  return (
    <View className="flex-1">
      <TimePicker
        value={option}
        isOpen={isOpen}
        isDisabled={disabled}
        hourFormat={12}
        formatTime={(time: Time) => formatHourLabel(time.hour)}
        onOpenChange={(open) => {
          if (open) {
            if (closeTimerRef.current != null) {
              clearTimeout(closeTimerRef.current);
              closeTimerRef.current = null;
            }
            draftHourRef.current = committedHourRef.current;
            setDraftHour(committedHourRef.current);
            setPortalMounted(true);
            requestAnimationFrame(() => setIsOpen(true));
            return;
          }

          setIsOpen(false);
          const nextHour = draftHourRef.current;
          if (nextHour !== committedHourRef.current) {
            committedHourRef.current = nextHour;
            onHourChange(nextHour);
          }
          closeTimerRef.current = setTimeout(() => {
            closeTimerRef.current = null;
            setPortalMounted(false);
          }, 350);
        }}
        onValueChange={(next) => {
          const parsed = parseHourFromTimeValue(next?.value);
          if (parsed == null) return;
          draftHourRef.current = parsed;
          setDraftHour(parsed);
        }}
      >
        <Label className="mb-1.5 text-xs text-muted">{label}</Label>
        <TimePicker.Select presentation="bottom-sheet">
          <TimePicker.Trigger className="min-h-11 rounded-xl border border-border bg-default px-3">
            <TimePicker.Value
              placeholder="Select hour"
              className="text-sm text-foreground"
            />
            <TimePicker.TriggerIndicator />
          </TimePicker.Trigger>
          {portalMounted ? (
            <TimePicker.Portal>
              <TimePicker.Overlay />
              <TimePicker.Content
                presentation="bottom-sheet"
                backgroundClassName="bg-surface"
              >
                <TimePicker.Wheel />
              </TimePicker.Content>
            </TimePicker.Portal>
          ) : null}
        </TimePicker.Select>
      </TimePicker>
    </View>
  );
}
