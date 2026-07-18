import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { Pressable, View } from "react-native";
import {
  Accordion,
  Dialog,
  FieldError,
  Typography,
} from "heroui-native";
import { withUniwind } from "uniwind";

import type { IntervalOption } from "@/domain/search-rules";
import { getLocationErrorHelp } from "@/features/home/location-error-help";

const StyledIonicons = withUniwind(Ionicons);

export interface LocationFooterError {
  id: string;
  /** Shown in the footer (may include a location name prefix). */
  message: string;
  /** Raw validation reason used for help copy. */
  reason: string;
}

interface LocationErrorInfoDialogProps {
  errors: LocationFooterError[];
  intervalOptions: IntervalOption[];
  infoReason: string | null;
  onInfoReasonChange: (reason: string | null) => void;
}

export function LocationErrorInfoDialog({
  errors,
  intervalOptions,
  infoReason,
  onInfoReasonChange,
}: LocationErrorInfoDialogProps): JSX.Element | null {
  if (errors.length === 0) return null;

  const help =
    infoReason != null
      ? getLocationErrorHelp(infoReason, intervalOptions)
      : null;

  return (
    <>
      <View className="gap-1.5 px-5 pb-1 pt-1">
        {errors.map((error) => (
          <View key={error.id} className="flex-row items-start gap-1.5">
            <View className="min-w-0 flex-1">
              <FieldError isInvalid>{error.message}</FieldError>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Why this error"
              hitSlop={8}
              className="mt-0.5 p-0.5"
              onPress={() => onInfoReasonChange(error.reason)}
            >
              <StyledIonicons
                name="information-circle-outline"
                size={18}
                className="text-danger"
              />
            </Pressable>
          </View>
        ))}
      </View>

      <Dialog
        isOpen={infoReason != null}
        onOpenChange={(open) => {
          if (!open) onInfoReasonChange(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="mx-5 w-auto max-w-md gap-4 bg-surface-secondary">
            <Dialog.Close variant="ghost" />
            <View className="gap-1 pr-8">
              <Dialog.Title>Why this error?</Dialog.Title>
              <Dialog.Description>
                How location slots and speeds work on your plan.
              </Dialog.Description>
            </View>

            {help != null ? (
              <Accordion
                key={infoReason ?? "closed"}
                variant="surface"
                selectionMode="single"
                hideSeparator
                isCollapsible
                defaultValue="pro-tip"
              >
                <Accordion.Item value="pro-tip">
                  <Accordion.Trigger>
                    <View className="flex-row items-center gap-2.5">
                      <StyledIonicons
                        name="sparkles"
                        size={16}
                        className="text-sky-400"
                      />
                      <Typography
                        type="body-sm"
                        weight="semibold"
                        className="text-foreground"
                      >
                        Pro Tip
                      </Typography>
                    </View>
                    <Accordion.Indicator />
                  </Accordion.Trigger>
                  <Accordion.Content>
                    <View className="gap-2.5">
                      <Typography
                        type="body-sm"
                        weight="semibold"
                        className="text-foreground"
                      >
                        {help.headline}
                      </Typography>
                      {help.body.split("\n\n").map((paragraph) => (
                        <Typography
                          key={paragraph.slice(0, 48)}
                          type="body-xs"
                          className="text-muted"
                        >
                          {paragraph}
                        </Typography>
                      ))}
                      {help.capacityLine != null ? (
                        <Typography type="body-xs" className="text-muted">
                          {help.capacityLine}
                        </Typography>
                      ) : null}
                    </View>
                  </Accordion.Content>
                </Accordion.Item>
              </Accordion>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
