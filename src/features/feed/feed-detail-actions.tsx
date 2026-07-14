import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PressableFeedback } from "heroui-native";

type IonName = ComponentProps<typeof Ionicons>["name"];

interface FeedDetailActionsProps {
  isFavorite: boolean;
  onSave: () => void;
  onDelete: () => void;
  onSpam: () => void;
  onExclude: () => void;
}

function ActionChip({
  icon,
  label,
  onPress,
  accent,
  danger,
  warning,
}: {
  icon: IonName;
  label: string;
  onPress: () => void;
  accent?: boolean;
  danger?: boolean;
  warning?: boolean;
}): JSX.Element {
  const iconColor = accent ? "#1DB954" : danger ? "#f87171" : warning ? "#fbbf24" : "#D4D4D8";
  const textColor = iconColor;
  const bg = accent
    ? "rgba(29,185,84,0.14)"
    : danger
      ? "rgba(248,113,113,0.12)"
      : warning
        ? "rgba(251,191,36,0.12)"
        : "rgba(255,255,255,0.08)";
  const border = accent
    ? "rgba(29,185,84,0.35)"
    : danger
      ? "rgba(248,113,113,0.28)"
      : warning
        ? "rgba(251,191,36,0.28)"
        : "rgba(255,255,255,0.12)";

  return (
    <PressableFeedback
      onPress={onPress}
      accessibilityLabel={label}
      animation={{ scale: { value: 0.96 } }}
      style={[styles.chip, { backgroundColor: bg, borderColor: border }]}
    >
      <View style={styles.chipInner}>
        <Ionicons name={icon} size={13} color={iconColor} />
        <Text numberOfLines={1} style={[styles.chipLabel, { color: textColor }]}>
          {label}
        </Text>
      </View>
    </PressableFeedback>
  );
}

/** Compact glass action chips — solid hex/rgba only (avoids HeroUI colorKit crashes). */
export function FeedDetailActions({
  isFavorite,
  onSave,
  onDelete,
  onSpam,
  onExclude,
}: FeedDetailActionsProps): JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <ActionChip
        icon={isFavorite ? "star" : "star-outline"}
        label={isFavorite ? "Saved" : "Save"}
        onPress={onSave}
        accent={isFavorite}
      />
      <ActionChip icon="trash-outline" label="Delete" onPress={onDelete} danger />
      <ActionChip icon="flag-outline" label="Spam" onPress={onSpam} warning />
      <ActionChip icon="ban-outline" label="Exclude" onPress={onExclude} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    height: 32,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  chipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
});
