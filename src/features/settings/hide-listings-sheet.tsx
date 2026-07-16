import type { JSX, ReactNode } from "react";
import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  ListGroup,
  Separator,
  Switch,
  Typography,
} from "heroui-native";

import type { UserPreferences } from "@/mocks/data/settings";

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
  title: string;
  description: string;
  isHidden: boolean;
  onChange: (hidden: boolean) => void;
}

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
          backgroundClassName="bg-surface rounded-t-3xl"
          handleClassName="bg-surface"
          handleIndicatorClassName="bg-separator"
        >
          {children}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
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
  const rows: HideRow[] = [
    {
      key: "spam",
      title: "Spam",
      description: "Hide spam and scam listings",
      isHidden: !prefs.showScams,
      onChange: (hidden) => onPatch({ showScams: !hidden }),
    },
    {
      key: "dealer",
      title: "Dealer",
      description: "Hide dealer and dealership listings",
      isHidden: !prefs.showDealerships,
      onChange: (hidden) =>
        onPatch({ showDealers: !hidden, showDealerships: !hidden }),
    },
    {
      key: "major",
      title: "Major damage",
      description: "Hide listings with major damage",
      isHidden: !(prefs.showMajorDamaged ?? true),
      onChange: (hidden) => onPatch({ showMajorDamaged: !hidden }),
    },
    {
      key: "rebuilt",
      title: "Rebuilt",
      description: "Hide rebuilt title listings",
      isHidden: !(prefs.showRebuiltTitle ?? true),
      onChange: (hidden) => onPatch({ showRebuiltTitle: !hidden }),
    },
    {
      key: "salvage",
      title: "Salvage",
      description: "Hide salvage title listings",
      isHidden: !(prefs.showSalvageTitle ?? true),
      onChange: (hidden) => onPatch({ showSalvageTitle: !hidden }),
    },
  ];

  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <View className="gap-4 px-1 pb-2 pt-1">
        <View className="gap-1 px-1">
          <BottomSheet.Title>Hide listings</BottomSheet.Title>
          <Typography type="body-sm" className="text-muted">
            Turn on filters to hide listing types from your feed.
          </Typography>
        </View>

        <ListGroup variant="transparent" className="bg-transparent p-0">
          {rows.map((row, index) => (
            <View key={row.key}>
              {index > 0 ? <Separator className="mx-1" /> : null}
              <ListGroup.Item
                className="bg-transparent px-1 py-2"
                onPress={() => row.onChange(!row.isHidden)}
              >
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle className="text-[15px] text-foreground">
                    {row.title}
                  </ListGroup.ItemTitle>
                  <ListGroup.ItemDescription className="text-muted">
                    {row.description}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  <Switch
                    isSelected={row.isHidden}
                    onSelectedChange={row.onChange}
                  />
                </ListGroup.ItemSuffix>
              </ListGroup.Item>
            </View>
          ))}
        </ListGroup>
      </View>
    </SheetShell>
  );
}
