import type { JSX } from "react";
import { ScrollView, View } from "react-native";
import { PressableFeedback, Typography } from "heroui-native";

import { CommunityHunterAvatar } from "@/features/community/community-hunter-avatar";
import { isHunterOnline } from "@/features/community/community-presence-badge";
import type { CommunityHunter } from "@/mocks/data/community";

interface CommunityHuntersRailProps {
  hunters: CommunityHunter[];
  onPressHunter: (hunterId: string) => void;
}

/** Spotify “favorite artists” — large circles, name under. */
export function CommunityHuntersRail({
  hunters,
  onPressHunter,
}: CommunityHuntersRailProps): JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-5 px-4"
    >
      {hunters.map((hunter) => (
        <PressableFeedback
          key={hunter.id}
          onPress={() => onPressHunter(hunter.id)}
          className="w-[88px] items-center gap-2"
          animation={{ scale: { value: 0.96 } }}
        >
          <CommunityHunterAvatar hunter={hunter} size="lg" />
          <Typography
            type="body-sm"
            weight="semibold"
            className="w-full text-center"
            numberOfLines={1}
          >
            {hunter.displayName.split(" ")[0]}
          </Typography>
          {!isHunterOnline(hunter) ? (
            <Typography
              type="body-xs"
              className="text-center text-muted"
              numberOfLines={1}
            >
              {hunter.lastOnlineLabel}
            </Typography>
          ) : null}
        </PressableFeedback>
      ))}
      {hunters.length === 0 ? (
        <View className="px-1 py-4">
          <Typography type="body-xs" className="text-muted">
            No nearby hunters yet
          </Typography>
        </View>
      ) : null}
    </ScrollView>
  );
}
