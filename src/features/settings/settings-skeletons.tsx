import type { JSX } from "react";
import { View } from "react-native";
import { Separator, SkeletonGroup } from "heroui-native";

/** Settings home: profile row + subscription card + preference rows. */
export function SettingsScreenSkeleton(): JSX.Element {
  return (
    <SkeletonGroup isLoading isSkeletonOnly className="gap-4 px-3">
      <View className="gap-1.5">
        <SkeletonGroup.Item className="mx-2 h-3 w-14 rounded-md" />
        <View className="flex-row items-center gap-3 rounded-2xl bg-surface px-3 py-3">
          <SkeletonGroup.Item className="size-10 rounded-full" />
          <View className="min-w-0 flex-1 gap-1.5">
            <SkeletonGroup.Item className="h-4 w-36 rounded-md" />
            <SkeletonGroup.Item className="h-3 w-48 rounded-md" />
          </View>
          <SkeletonGroup.Item className="h-5 w-14 rounded-full" />
        </View>
      </View>

      <View className="gap-3 rounded-3xl bg-surface p-4">
        <View className="flex-row items-center gap-2">
          <SkeletonGroup.Item className="size-6 rounded-md" />
          <SkeletonGroup.Item className="h-5 flex-1 rounded-md" />
        </View>
        <SkeletonGroup.Item className="h-3 w-4/5 rounded-md" />
        <SkeletonGroup.Item className="h-9 w-full rounded-xl" />
      </View>

      <View className="gap-2">
        <SkeletonGroup.Item className="mx-2 h-3 w-28 rounded-md" />
        <View className="overflow-hidden rounded-2xl bg-surface px-3">
          {[0, 1, 2, 3].map((key) => (
            <View key={key}>
              <View className="flex-row items-center gap-3 py-3">
                <SkeletonGroup.Item className="size-5 rounded-md" />
                <View className="min-w-0 flex-1 gap-1.5">
                  <SkeletonGroup.Item className="h-4 w-32 rounded-md" />
                  <SkeletonGroup.Item className="h-3 w-44 rounded-md" />
                </View>
                <SkeletonGroup.Item className="size-4 rounded-md" />
              </View>
              {key < 3 ? <Separator className="bg-muted/30" /> : null}
            </View>
          ))}
        </View>
      </View>
    </SkeletonGroup>
  );
}

/** Subscription plans screen: three collapsed plan-card shells. */
export function SubscriptionPlansSkeleton({
  count = 3,
}: {
  count?: number;
}): JSX.Element {
  return (
    <SkeletonGroup isLoading isSkeletonOnly className="gap-4">
      {Array.from({ length: count }, (_, index) => (
        <View key={index} className="gap-5 rounded-3xl bg-surface p-5">
          <View className="gap-2">
            <View className="flex-row items-center gap-2.5">
              <SkeletonGroup.Item className="size-7 rounded-md" />
              <SkeletonGroup.Item className="h-6 flex-1 rounded-md" />
              <SkeletonGroup.Item className="h-5 w-14 rounded-full" />
            </View>
            <SkeletonGroup.Item className="h-4 w-4/5 rounded-md" />
          </View>
          <View className="gap-1.5">
            <SkeletonGroup.Item className="h-10 w-28 rounded-md" />
            <SkeletonGroup.Item className="h-3 w-24 rounded-md" />
          </View>
          <SkeletonGroup.Item className="h-11 w-full rounded-xl" />
        </View>
      ))}
    </SkeletonGroup>
  );
}

/** Profile detail: hero card + info sections. */
export function ProfileScreenSkeleton(): JSX.Element {
  return (
    <SkeletonGroup isLoading isSkeletonOnly className="gap-4 px-3 pt-3">
      <View className="gap-3 rounded-3xl bg-surface p-5">
        <View className="flex-row items-center gap-3">
          <SkeletonGroup.Item className="size-14 rounded-full" />
          <View className="min-w-0 flex-1 gap-1.5">
            <SkeletonGroup.Item className="h-5 w-40 rounded-md" />
            <SkeletonGroup.Item className="h-3 w-28 rounded-md" />
          </View>
        </View>
        <SkeletonGroup.Item className="h-4 w-3/5 rounded-md" />
      </View>

      {[0, 1].map((section) => (
        <View key={section} className="gap-2">
          <SkeletonGroup.Item className="mx-2 h-3 w-20 rounded-md" />
          <View className="overflow-hidden rounded-2xl bg-surface px-3">
            {[0, 1].map((row) => (
              <View key={row}>
                <View className="flex-row items-center gap-3 py-3">
                  <SkeletonGroup.Item className="size-5 rounded-md" />
                  <View className="min-w-0 flex-1 gap-1.5">
                    <SkeletonGroup.Item className="h-4 w-28 rounded-md" />
                    <SkeletonGroup.Item className="h-3 w-40 rounded-md" />
                  </View>
                </View>
                {row < 1 ? <Separator className="bg-muted/30" /> : null}
              </View>
            ))}
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}
