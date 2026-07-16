import { useRouter } from "expo-router";
import { useCallback, useState, type JSX } from "react";
import { View } from "react-native";

import type { FeedTabKey } from "@/features/feed/feed-category-tabs";
import { FeedForYouPage } from "@/features/feed/feed-for-you-page";
import { FeedHeader } from "@/features/feed/feed-header";
import { FeedQuickFilterPage } from "@/features/feed/feed-quick-filter-page";

export default function FeedForYouScreen(): JSX.Element {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<FeedTabKey>("for-you");

  const handlePressItem = useCallback(
    (id: string) => {
      router.push({ pathname: "/listing/[id]", params: { id } });
    },
    [router],
  );

  return (
    <View className="flex-1 bg-background">
      <FeedHeader
        searchText={searchText}
        onSearchChange={setSearchText}
        activeTab={activeTab}
        onTabSelect={setActiveTab}
      />
      {activeTab === "quick-filter" ? (
        <FeedQuickFilterPage />
      ) : (
        <FeedForYouPage query={searchText} onPressItem={handlePressItem} />
      )}
    </View>
  );
}
