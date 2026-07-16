import { Ionicons } from "@expo/vector-icons";
import type { JSX, ReactNode } from "react";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { BottomSheet, Typography, useThemeColor } from "heroui-native";

import { SearchBottomSheetCriteria } from "@/features/home/search-bottom-sheet-criteria";
import { SearchBottomSheetHeader } from "@/features/home/search-bottom-sheet-header";
import { SearchBottomSheetRow } from "@/features/home/search-bottom-sheet-row";
import { SearchBottomSheetSection } from "@/features/home/search-bottom-sheet-section";

/** Portal only while visible; open after mount so HeroUI snap works; unmount when closed. */
function SheetShell({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIsOpen(false);
      return;
    }
    const id = requestAnimationFrame(() => setIsOpen(true));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  if (!visible) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) onClose();
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          snapPoints={["90%"]}
          enableDynamicSizing={false}
          enableOverDrag={false}
          contentContainerClassName="h-full p-0"
          backgroundClassName="bg-surface-secondary"
          backgroundStyle={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderCurve: "continuous",
          }}
          handleComponent={null}
        >
          {children}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

interface SearchBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  locationLabel?: string;
  onLocationPress?: () => void;
}

export function SearchBottomSheet({
  visible,
  onClose,
  locationLabel = "Voorhees (30 mi)",
  onLocationPress,
}: SearchBottomSheetProps): JSX.Element {
  const [muted] = useThemeColor(["muted"]);

  return (
    <SheetShell visible={visible} onClose={onClose}>
      <View className="flex-1">
        <SearchBottomSheetHeader onClose={onClose} onConfirm={onClose} />

        <SearchBottomSheetSection>
          <SearchBottomSheetRow
            icon="navigate"
            iconClassName="text-sky-500"
            title="Location"
            showChevron={false}
            isLast
            right={
              <View className="flex-row items-center gap-1">
                <Typography type="body-sm" className="text-muted">
                  {locationLabel}
                </Typography>
                <Ionicons name="chevron-forward" size={16} color={muted} />
              </View>
            }
            onPress={onLocationPress}
          />
        </SearchBottomSheetSection>

        <SearchBottomSheetCriteria />
      </View>
    </SheetShell>
  );
}
