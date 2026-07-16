import type { JSX, ReactNode } from "react";
import { View } from "react-native";
import { ListGroup } from "heroui-native";

interface SearchBottomSheetSectionProps {
  children: ReactNode;
}

/** Settings-style ListGroup shell for New Search sheet rows. */
export function SearchBottomSheetSection({
  children,
}: SearchBottomSheetSectionProps): JSX.Element {
  return (
    <View className="mb-4 mt-4">
      <ListGroup className="mx-3">{children}</ListGroup>
    </View>
  );
}
