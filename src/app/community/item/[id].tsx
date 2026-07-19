import { useLocalSearchParams } from "expo-router";
import type { JSX } from "react";

import { CommunityItemDetailScreen } from "@/features/community/community-item-detail-screen";

export default function CommunityItemRoute(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CommunityItemDetailScreen feedItemId={String(id ?? "")} />;
}
