import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, SkeletonGroup, Typography } from "heroui-native";
import { withUniwind } from "uniwind";

import {
  CommunityNearbyBgVariant,
  NEARBY_BG_VARIANTS,
} from "@/features/community/community-nearby-bg-variants";
import type { CommunityHunter } from "@/mocks/data/community";
import { getActiveNearbyHunters } from "@/mocks/services/community";

const StyledSafeAreaView = withUniwind(SafeAreaView);

export function CommunityNearbyBgVariantsScreen(): JSX.Element {
  const router = useRouter();
  const [hunters, setHunters] = useState<CommunityHunter[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setHunters(await getActiveNearbyHunters());
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      await load();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  return (
    <StyledSafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="flex-row items-center gap-2 px-3 pb-2 pt-1">
        <Button variant="secondary" size="sm" onPress={() => router.back()}>
          Back
        </Button>
        <View className="min-w-0 flex-1">
          <Typography type="body" weight="semibold">
            Rivals nearby · bg variants
          </Typography>
          <Typography type="body-xs" color="muted">
            Pick one — same hunters, four shells
          </Typography>
        </View>
      </View>

      {loading ? (
        <SkeletonGroup isLoading isSkeletonOnly className="px-4 pt-4">
          <SkeletonGroup.Item className="mb-4 h-28 w-full rounded-xl" />
          <SkeletonGroup.Item className="mb-4 h-28 w-full rounded-xl" />
        </SkeletonGroup>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-8 pb-16 pt-2"
        >
          {NEARBY_BG_VARIANTS.map((v) => (
            <CommunityNearbyBgVariant
              key={v.id}
              variant={v.id}
              hunters={hunters}
              onPressHunter={() => undefined}
              showLabel
            />
          ))}
        </ScrollView>
      )}
    </StyledSafeAreaView>
  );
}
