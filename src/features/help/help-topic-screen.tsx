import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { Linking, ScrollView, View } from "react-native";
import {
  Accordion,
  Button,
  ScrollShadow,
  Typography,
  useThemeColor,
} from "heroui-native";
import { withUniwind } from "uniwind";

import type { HelpTopic } from "@/features/help/help-topics";
import { MessengerSupportButton } from "@/features/help/messenger-support-button";

const StyledIonicons = withUniwind(Ionicons);

const SUPPORT_EMAIL = "mailto:support@flipsentry.com";

interface HelpTopicScreenProps {
  topic: HelpTopic;
}

export function HelpTopicScreen({ topic }: HelpTopicScreenProps): JSX.Element {
  const background = useThemeColor("background");

  return (
    <View className="flex-1 bg-background">
      <ScrollShadow
        className="flex-1"
        LinearGradientComponent={LinearGradient}
        color={background}
        size={12}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 px-4 pb-10 pt-3"
        >
          <View className="gap-1 px-1">
            <Typography type="body-sm" className="text-muted">
              {topic.description}
            </Typography>
          </View>

          <Accordion
            selectionMode="single"
            variant="surface"
            className="gap-2"
          >
            {topic.faqs.map((faq) => (
              <Accordion.Item key={faq.id} value={faq.id}>
                <Accordion.Trigger className="gap-2 px-3 py-3">
                  <Typography
                    type="body-sm"
                    weight="semibold"
                    className="min-w-0 flex-1 text-foreground"
                  >
                    {faq.question}
                  </Typography>
                  <Accordion.Indicator />
                </Accordion.Trigger>
                <Accordion.Content className="px-3 pb-3 pt-0">
                  <Typography type="body-sm" className="text-muted">
                    {faq.answer}
                  </Typography>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion>

          <View className="gap-2 pt-2">
            <Typography type="body-xs" className="px-1 text-muted">
              Still stuck? Reach out and we’ll help.
            </Typography>
            <MessengerSupportButton label="Messenger" />
            <Button
              variant="ghost"
              className="min-h-11 w-full rounded-2xl"
              onPress={() => void Linking.openURL(SUPPORT_EMAIL)}
            >
              <StyledIonicons
                name="mail-outline"
                size={16}
                className="text-foreground"
              />
              <Button.Label className="text-sm">Email support</Button.Label>
            </Button>
          </View>
        </ScrollView>
      </ScrollShadow>
    </View>
  );
}
