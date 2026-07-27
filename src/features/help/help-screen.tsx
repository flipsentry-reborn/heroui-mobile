import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import type { JSX } from "react";
import { Linking, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollShadow, Typography, useThemeColor } from "heroui-native";

import { HELP_TOPICS } from "@/features/help/help-topics";
import {
  SettingsRow,
  SettingsSection,
} from "@/features/settings/settings-section";

const SUPPORT_MESSENGER = "https://m.me/flipsentry";
const SUPPORT_EMAIL = "mailto:support@flipsentry.com";

export function HelpScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const background = useThemeColor("background");

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="gap-1 px-5 pb-3 pt-2">
        <Typography type="h3" weight="bold" className="text-foreground">
          Help
        </Typography>
        <Typography type="body-sm" className="text-muted">
          Guides for FlipSentry searches, alerts, and your account.
        </Typography>
      </View>

      <ScrollShadow
        className="flex-1"
        LinearGradientComponent={LinearGradient}
        color={background}
        size={12}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-[110px] pt-2"
        >
          <SettingsSection title="Browse topics">
            {HELP_TOPICS.map((topic, index) => (
              <SettingsRow
                key={topic.id}
                icon={topic.icon}
                title={topic.title}
                description={topic.description}
                onPress={() => router.push(`/help/${topic.id}` as Href)}
                isLast={index === HELP_TOPICS.length - 1}
              />
            ))}
          </SettingsSection>

          <SettingsSection title="Contact">
            <SettingsRow
              icon="chatbubble-ellipses-outline"
              title="Messenger"
              description="Chat with the FlipSentry team"
              onPress={() => void Linking.openURL(SUPPORT_MESSENGER)}
            />
            <SettingsRow
              icon="mail-outline"
              title="Email"
              description="support@flipsentry.com"
              onPress={() => void Linking.openURL(SUPPORT_EMAIL)}
              isLast
            />
          </SettingsSection>
        </ScrollView>
      </ScrollShadow>
    </View>
  );
}
