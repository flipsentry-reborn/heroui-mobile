import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";

/** Spotify shelf title — bold heading, tight, left-padded. */
export function CommunitySectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}): JSX.Element {
  return (
    <View className="mb-3 gap-0.5 px-4">
      <Typography type="h3" weight="bold">
        {title}
      </Typography>
      {subtitle ? (
        <Typography type="body-xs" color="muted">
          {subtitle}
        </Typography>
      ) : null}
    </View>
  );
}
