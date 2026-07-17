import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";

interface SearchBottomSheetHeaderProps {
  title?: string;
}

export function SearchBottomSheetHeader({
  title = "New Search",
}: SearchBottomSheetHeaderProps): JSX.Element {
  return (
    <View className="items-center px-5 pb-1 pt-4">
      <Typography type="body" weight="normal">
        {title}
      </Typography>
    </View>
  );
}
