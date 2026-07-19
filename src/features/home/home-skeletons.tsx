import type { JSX } from "react";
import { View } from "react-native";
import { Separator, SkeletonGroup } from "heroui-native";

/** Home: plan card + new-search CTA + search list rows. */
export function HomeScreenSkeleton(): JSX.Element {
  return (
    <SkeletonGroup isLoading isSkeletonOnly className="gap-4 px-3">
      <View className="gap-3 rounded-3xl bg-surface p-4">
        <View className="flex-row items-center gap-2">
          <SkeletonGroup.Item className="size-6 rounded-md" />
          <SkeletonGroup.Item className="h-5 flex-1 rounded-md" />
        </View>
        <SkeletonGroup.Item className="h-3 w-4/5 rounded-md" />
        <SkeletonGroup.Item className="h-9 w-full rounded-xl" />
      </View>

      <SkeletonGroup.Item className="h-12 w-full rounded-xl" />

      <View className="gap-2">
        <SkeletonGroup.Item className="mx-2 h-3 w-20 rounded-md" />
        <View className="overflow-hidden rounded-2xl bg-surface px-3">
          {[0, 1, 2].map((key) => (
            <View key={key}>
              <View className="flex-row items-center gap-3 py-3">
                <SkeletonGroup.Item className="size-5 rounded-md" />
                <View className="min-w-0 flex-1 gap-1.5">
                  <SkeletonGroup.Item className="h-4 w-32 rounded-md" />
                  <SkeletonGroup.Item className="h-3 w-44 rounded-md" />
                </View>
                <SkeletonGroup.Item className="size-4 rounded-md" />
              </View>
              {key < 2 ? <Separator className="bg-muted/30" /> : null}
            </View>
          ))}
        </View>
      </View>
    </SkeletonGroup>
  );
}
