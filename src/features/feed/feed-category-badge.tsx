import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { Badge } from "heroui-native-pro";

export function FeedCategoryBadge({
  label,
}: {
  label: string;
}): JSX.Element {
  const isAi = label === "AI";

  return (
    <Badge
      color={isAi ? "default" : "warning"}
      size="sm"
      variant="primary"
      placement="top-right"
      className={`flex-row items-center gap-0.5 ${
        isAi ? "bg-white" : "bg-warning"
      }`}
    >
      {isAi ? (
        <Ionicons
          name="sparkles"
          size={10}
          color="#000000"
        />
      ) : null}
      <Badge.Label className={isAi ? "text-black" : undefined}>
        {label}
      </Badge.Label>
    </Badge>
  );
}
