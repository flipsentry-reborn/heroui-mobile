import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX } from "react";
import { View } from "react-native";
import { BottomSheet, Switch, Typography } from "heroui-native";

import { SearchBottomSheetRow } from "@/features/home/search-bottom-sheet-row";
import { SearchSheetGroup } from "@/features/home/search-sheet-group";
import { SheetShell } from "@/features/home/sheet-shell";
import type { UserPreferences } from "@/mocks/data/settings";

type IonName = ComponentProps<typeof Ionicons>["name"];

type HidePatch = Partial<
  Pick<
    UserPreferences,
    | "showScams"
    | "showDealers"
    | "showDealerships"
    | "showMajorDamaged"
    | "showRebuiltTitle"
    | "showSalvageTitle"
  >
>;

interface HideRow {
  key: string;
  icon: IonName;
  title: string;
  description: string;
  isHidden: boolean;
  onChange: (hidden: boolean) => void;
}

function HideListingsContent({
  prefs,
  onPatch,
}: {
  prefs: UserPreferences;
  onPatch: (patch: HidePatch) => void;
}): JSX.Element {
  const rows: HideRow[] = [
    {
      key: "spam",
      icon: "warning-outline",
      title: "Spam",
      description: "Hide spam and scam listings",
      isHidden: !prefs.showScams,
      onChange: (hidden) => onPatch({ showScams: !hidden }),
    },
    {
      key: "dealer",
      icon: "storefront-outline",
      title: "Dealer",
      description: "Hide dealer and dealership listings",
      isHidden: !prefs.showDealerships,
      onChange: (hidden) =>
        onPatch({ showDealers: !hidden, showDealerships: !hidden }),
    },
    {
      key: "major",
      icon: "car-outline",
      title: "Major damage",
      description: "Hide listings with major damage",
      isHidden: !(prefs.showMajorDamaged ?? true),
      onChange: (hidden) => onPatch({ showMajorDamaged: !hidden }),
    },
    {
      key: "rebuilt",
      icon: "construct-outline",
      title: "Rebuilt",
      description: "Hide rebuilt title listings",
      isHidden: !(prefs.showRebuiltTitle ?? true),
      onChange: (hidden) => onPatch({ showRebuiltTitle: !hidden }),
    },
    {
      key: "salvage",
      icon: "alert-circle-outline",
      title: "Salvage",
      description: "Hide salvage title listings",
      isHidden: !(prefs.showSalvageTitle ?? true),
      onChange: (hidden) => onPatch({ showSalvageTitle: !hidden }),
    },
  ];

  return (
    <BottomSheet.Content
      className="overflow-hidden"
      backgroundClassName="rounded-t-[32px] bg-surface-secondary"
      handleComponent={null}
      contentContainerClassName="p-0"
    >
      <View>
        <View className="items-center px-8 pt-3 pb-2">
          <Typography type="body" weight="normal">
            Hide listings
          </Typography>
        </View>

        <SearchSheetGroup>
          {rows.map((row, index) => (
            <SearchBottomSheetRow
              key={row.key}
              icon={row.icon}
              title={row.title}
              description={row.description}
              showChevron={false}
              isLast={index === rows.length - 1}
              onPress={() => row.onChange(!row.isHidden)}
              right={
                <Switch
                  isSelected={row.isHidden}
                  onSelectedChange={row.onChange}
                />
              }
            />
          ))}
        </SearchSheetGroup>
      </View>
    </BottomSheet.Content>
  );
}

interface HideListingsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: UserPreferences;
  onPatch: (patch: HidePatch) => void;
}

export function HideListingsSheet({
  isOpen,
  onOpenChange,
  prefs,
  onPatch,
}: HideListingsSheetProps): JSX.Element | null {
  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <HideListingsContent prefs={prefs} onPatch={onPatch} />
    </SheetShell>
  );
}
