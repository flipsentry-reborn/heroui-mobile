import type { JSX } from "react";
import { Redirect, Stack, useLocalSearchParams, type Href } from "expo-router";

import { HelpTopicScreen } from "@/features/help/help-topic-screen";
import { getHelpTopic } from "@/features/help/help-topics";

export default function HelpTopicRoute(): JSX.Element {
  const { topic: topicParam } = useLocalSearchParams<{ topic: string }>();
  const topicId = Array.isArray(topicParam) ? topicParam[0] : topicParam;
  const topic = topicId ? getHelpTopic(topicId) : undefined;

  if (!topic) {
    return <Redirect href={"/(tabs)/help" as Href} />;
  }

  return (
    <>
      <Stack.Screen options={{ title: topic.title }} />
      <HelpTopicScreen topic={topic} />
    </>
  );
}
