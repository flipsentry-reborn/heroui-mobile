import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useThemeColor } from "heroui-native";
import { Badge } from "heroui-native-pro";

export function FeedCategoryBadge({
  label,
}: {
  label: string;
}): JSX.Element {
  const isAi = label === "AI";
  const accentForeground = useThemeColor("accent-foreground");

  return (
    <Badge
      color={isAi ? "default" : "warning"}
      size="sm"
      variant="primary"
      placement="top-right"
      className={`flex-row items-center gap-0.5 ${
        isAi ? "bg-accent" : "bg-warning"
      }`}
    >
      {isAi ? (
        <Ionicons name="sparkles" size={10} color={accentForeground} />
      ) : null}
      <Badge.Label className={isAi ? "text-accent-foreground" : undefined}>
        {label}
      </Badge.Label>
    </Badge>
  );
}
