import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  Avatar,
  Chip,
  PressableFeedback,
  Typography,
} from "heroui-native";

import type { MockUserProfile } from "@/mocks/data/settings";

interface SettingsProfileHeaderProps {
  profile: MockUserProfile;
  planLabel: string;
  planAccent?: boolean;
  onPress: () => void;
}

export function SettingsProfileHeader({
  profile,
  planLabel,
  planAccent = false,
  onPress,
}: SettingsProfileHeaderProps): JSX.Element {
  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <PressableFeedback
      onPress={onPress}
      className="mx-3 mb-4 overflow-hidden rounded-2xl"
      animation={{ scale: { value: 0.985 } }}
    >
      <View
        className="overflow-hidden rounded-2xl border border-[#1DB954]/35"
        style={{ borderCurve: "continuous" }}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 22 : 14}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[
            "rgba(29,185,84,0.06)",
            "rgba(29,185,84,0.2)",
            "rgba(29,185,84,0.48)",
          ]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0.14)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.7 }}
          style={StyleSheet.absoluteFill}
        />
        <View className="flex-row items-center gap-3 p-4">
          <Avatar
            size="lg"
            alt={fullName}
            className="border border-white/20 bg-black/20"
          >
            <Avatar.Fallback className="bg-black/25 text-foreground">
              {initials}
            </Avatar.Fallback>
          </Avatar>
          <View className="min-w-0 flex-1 gap-1">
            <Typography
              type="body-sm"
              weight="semibold"
              className="text-[17px] text-foreground"
              numberOfLines={1}
            >
              {fullName}
            </Typography>
            <Typography type="body-xs" className="text-muted" numberOfLines={1}>
              {profile.email}
            </Typography>
            <Chip
              size="sm"
              variant="soft"
              color={planAccent ? "accent" : "default"}
              className="mt-0.5 self-start"
            >
              <Chip.Label>{planLabel}</Chip.Label>
            </Chip>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8A8A8A" />
        </View>
      </View>
      <PressableFeedback.Highlight />
    </PressableFeedback>
  );
}
