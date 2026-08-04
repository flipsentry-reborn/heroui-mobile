import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { JSX } from "react";
import { useWindowDimensions, View } from "react-native";
import { Dialog, Typography } from "heroui-native";
import { withUniwind } from "uniwind";

import type { PlatformDelayInfo } from "@/features/feed/feed-platform-delay";

const StyledIonicons = withUniwind(Ionicons);

interface FeedDetailDelayDialogProps {
  isOpen: boolean;
  delayInfo: PlatformDelayInfo | null;
  onOpenChange: (open: boolean) => void;
}

export function FeedDetailDelayDialog({
  isOpen,
  delayInfo,
  onOpenChange,
}: FeedDetailDelayDialogProps): JSX.Element | null {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  if (delayInfo == null) return null;

  const cardMaxWidth = Math.min(windowWidth - 40, 420);
  const imageMaxHeight = windowHeight * 0.42;
  const imageWidth = Math.min(
    cardMaxWidth,
    imageMaxHeight * delayInfo.aspectRatio,
  );
  const imageHeight = imageWidth / delayInfo.aspectRatio;

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="mx-5 w-auto max-w-md gap-3 overflow-hidden bg-surface p-0">
          <View className="relative items-center bg-surface-secondary pt-3">
            <Dialog.Close
              variant="ghost"
              className="absolute right-2 top-2 z-10"
            />
            <Image
              source={delayInfo.illustration}
              style={{ width: imageWidth, height: imageHeight }}
              contentFit="contain"
              accessibilityLabel={delayInfo.label}
            />
          </View>
          <View className="gap-2.5 px-5 pb-5 pt-1">
            <View className="flex-row items-center gap-2 pr-8">
              <StyledIonicons
                name="sparkles"
                size={16}
                className="text-sky-400"
              />
              <Dialog.Title className="text-sky-400">
                {delayInfo.title}
              </Dialog.Title>
            </View>
            <Dialog.Description>
              <Typography type="body-sm" className="text-muted leading-5">
                {delayInfo.body.map((part, index) =>
                  part.type === "quote" ? (
                    <Typography
                      key={`${part.value}-${index}`}
                      type="body-sm"
                      className="text-muted/45 leading-5"
                    >
                      "{part.value}"
                    </Typography>
                  ) : (
                    <Typography
                      key={`${part.value.slice(0, 24)}-${index}`}
                      type="body-sm"
                      className="text-muted leading-5"
                    >
                      {part.value}
                    </Typography>
                  ),
                )}
              </Typography>
            </Dialog.Description>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
