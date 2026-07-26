import { useRouter } from "expo-router";
import type { JSX } from "react";
import { View } from "react-native";

import { FiltersScreen } from "@/features/feed/filters-screen";

export default function FeedFiltersRoute(): JSX.Element {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <FiltersScreen onBack={() => router.back()} />
    </View>
  );
}
