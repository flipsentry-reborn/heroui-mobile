import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PressableFeedback } from "heroui-native";

interface FeedDetailActionsProps {
  isFavorite: boolean;
  onSave: () => void;
  onDelete: () => void;
  onShare: () => void;
}

/** Frameless Saved / Share / Delete — icon + label only. */
export function FeedDetailActions({
  isFavorite,
  onSave,
  onDelete,
  onShare,
}: FeedDetailActionsProps): JSX.Element {
  return (
    <View style={styles.row}>
      <PressableFeedback
        onPress={onSave}
        accessibilityLabel={isFavorite ? "Saved" : "Save"}
        animation={{ scale: { value: 0.96 } }}
        style={styles.action}
      >
        <Ionicons
          name={isFavorite ? "bookmark" : "bookmark-outline"}
          size={18}
          color={isFavorite ? "#1DB954" : "#E8E8E8"}
        />
        <Text style={[styles.label, { color: isFavorite ? "#1DB954" : "#E8E8E8" }]}>
          Saved
        </Text>
      </PressableFeedback>

      <PressableFeedback
        onPress={onShare}
        accessibilityLabel="Share"
        animation={{ scale: { value: 0.96 } }}
        style={styles.action}
      >
        <Ionicons name="share-outline" size={18} color="#E8E8E8" />
        <Text style={[styles.label, { color: "#E8E8E8" }]}>Share</Text>
      </PressableFeedback>

      <PressableFeedback
        onPress={onDelete}
        accessibilityLabel="Delete"
        animation={{ scale: { value: 0.96 } }}
        style={styles.action}
      >
        <Ionicons name="trash-outline" size={18} color="#f87171" />
        <Text style={[styles.label, { color: "#f87171" }]}>Delete</Text>
      </PressableFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
    paddingVertical: 8,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
