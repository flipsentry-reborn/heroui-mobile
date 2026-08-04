import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";
import { PressableFeedback, Typography } from "heroui-native";
import { withUniwind } from "uniwind";

import { FeedDetailDelayDialog } from "@/features/feed/feed-detail-delay-dialog";
import { formatFoundInSeconds } from "@/features/feed/feed-detail-meta";
import { getPlatformDelayInfo } from "@/features/feed/feed-platform-delay";
import type { FeedPlatform } from "@/models/feed";

const StyledIonicons = withUniwind(Ionicons);

interface FeedDetailFindingTimeProps {
  foundInSeconds: number;
  platform: FeedPlatform;
}

/**
 * Single Finding Time row — sits below Advanced/Basic calculation.
 */
export function FeedDetailFindingTime({
  foundInSeconds,
  platform,
}: FeedDetailFindingTimeProps): JSX.Element {
  const [delayOpen, setDelayOpen] = useState(false);
  const delayInfo = getPlatformDelayInfo(platform);
  const value = formatFoundInSeconds(foundInSeconds);

  return (
    <>
      <View className="w-full flex-row items-center gap-2">
        <Typography
          type="body-sm"
          weight="semibold"
          className="shrink-0 text-[15px] text-foreground"
        >
          Finding Time
        </Typography>
        {delayInfo != null ? (
          <PressableFeedback
            accessibilityLabel={`Explain ${delayInfo.label}`}
            accessibilityRole="button"
            className="flex-row items-center gap-0.5"
            onPress={() => setDelayOpen(true)}
            animation={{ scale: { value: 0.96 } }}
          >
            <Typography type="body-xs" className="text-[13px] text-muted/45">
              {delayInfo.label}
            </Typography>
            <StyledIonicons
              name="open-outline"
              size={12}
              className="text-muted/45"
            />
          </PressableFeedback>
        ) : null}
        <Typography
          type="body-sm"
          weight="bold"
          className="ml-auto shrink-0 text-[17px] text-sky-400"
        >
          {value}
        </Typography>
      </View>
      <FeedDetailDelayDialog
        isOpen={delayOpen}
        delayInfo={delayInfo}
        onOpenChange={setDelayOpen}
      />
    </>
  );
}
